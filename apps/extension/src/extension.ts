import * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_CONFIG,
  SCENARIO_NAMES,
  createMockServer,
  generatorNames,
  routesFor,
  type MockServer,
  type Schema,
} from "@devmock/core";
import { handleStudioMessage } from "./studio.js";
import {
  doCreateDetectedSchemas,
  doDetect,
  doExport,
  doGeneratePreview,
  doImportContent,
  doSaveFakeData,
  doSetErrorRate,
  doSwitchScenario,
  doValidate,
  endpointUrl,
  formatLogEntry,
} from "./ops.js";
import { buildTree, type TreeNode } from "./tree.js";
import { buildActions, buildQuickPickItems } from "./actions.js";
import {
  devmockDir,
  listSchemas,
  readConfig,
  readScenarios,
  recordExportHashes,
  staleSinceLastExport,
  writeConfig,
} from "./project.js";

const DIRS = ["schemas", "scenarios", "docs", "openapi"];
const GENERATORS = ["(tipo)", ...generatorNames()];
const TYPES = ["uuid", "string", "number", "boolean", "date", "datetime", "image", "enum", "ref", "array"];

interface Ctx {
  root: string | undefined;
  server: MockServer | undefined;
  port: number | undefined;
  channel: vscode.OutputChannel;
  provider: ProjectProvider;
}

function workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

class ProjectProvider implements vscode.TreeDataProvider<TreeNode> {
  private emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;
  constructor(private ctx: () => Ctx) {}

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(el: TreeNode): vscode.TreeItem {
    const item = new vscode.TreeItem(el.label, el.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
    if (el.description) item.description = el.description;
    if (el.icon) item.iconPath = new vscode.ThemeIcon(el.icon);
    if (el.command) item.command = el.command;
    if (el.contextValue) item.contextValue = el.contextValue;
    return item;
  }

  getChildren(el?: TreeNode): TreeNode[] {
    const ctx = this.ctx();
    if (!ctx.root) {
      return buildTree({
        root: undefined,
        initialized: false,
        schemas: [],
        config: DEFAULT_CONFIG,
        serverRunning: false,
      });
    }
    const initialized = existsSync(devmockDir(ctx.root));
    // Só lê schemas/config ao expandir um nó — a raiz não precisa (T3a).
    const loadData = initialized && !!el;
    return buildTree(
      {
        root: ctx.root,
        initialized,
        schemas: loadData ? listSchemas(ctx.root) : [],
        config: loadData ? readConfig(ctx.root) : DEFAULT_CONFIG,
        serverRunning: !!ctx.server,
        port: ctx.port,
      },
      el,
    );
  }
}

/** Escolhe um Schema válido ou avisa; usado por generate/saveFakeData. */
async function pickSchema(): Promise<{ root: string; schema: Schema } | undefined> {
  const root = workspaceRoot();
  if (!root) return undefined;
  const schemas = listSchemas(root);
  if (schemas.length === 0) {
    void vscode.window.showErrorMessage("DevMock: nenhum Schema válido.");
    return undefined;
  }
  const picked = await vscode.window.showQuickPick(schemas.map((s) => s.name), { placeHolder: "Schema" });
  if (!picked) return undefined;
  const schema = schemas.find((s) => s.name === picked);
  return schema ? { root, schema } : undefined;
}

/** Create API → Detect from project (PRD-09). */
async function detectFlow(
  root: string,
  channel: vscode.OutputChannel,
  refresh: () => void,
): Promise<void> {
  const result = doDetect(root);
  if (result.schemas.length === 0) {
    for (const w of result.warnings) channel.appendLine(`detect: ${w}`);
    void vscode.window.showInformationMessage(
      "DevMock Detect: nada encontrado em src/ (interfaces TS ou chamadas api.get/axios.post).",
    );
    return;
  }
  type Item = vscode.QuickPickItem & { schema: Schema };
  const items: Item[] = result.schemas.map((s) => ({
    label: s.name,
    description: `${s.fields.length} campos`,
    detail: s.fields.map((f) => `${f.name}: ${f.type}`).join(", "),
    schema: s,
    picked: true,
  }));
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: "Detect from project — selecione os Schemas a criar",
    canPickMany: true,
  });
  if (!picked || picked.length === 0) return;

  const { created, skipped, warnings } = doCreateDetectedSchemas(
    root,
    picked.map((p) => p.schema),
  );
  const allWarnings = [...result.warnings, ...warnings];
  channel.appendLine(
    `detect: ${created.length} criado(s), ${skipped.length} pulado(s), ${result.endpoints.length} endpoint(s) detectado(s).`,
  );
  for (const w of allWarnings) channel.appendLine(`detect: ${w}`);
  if (result.endpoints.length > 0) {
    channel.appendLine(
      `detect endpoints: ${result.endpoints.map((e) => `${e.method} ${e.path}`).join(", ")}`,
    );
  }
  refresh();
  const parts = [`${created.length} Schema(s) criado(s)`];
  if (skipped.length > 0) parts.push(`${skipped.length} já existia(m)`);
  if (allWarnings.length > 0) parts.push(`${allWarnings.length} aviso(s) no Output`);
  void vscode.window.showInformationMessage(`DevMock Detect: ${parts.join(" · ")}.`);
}

export function activate(context: vscode.ExtensionContext): void {
  const channel = vscode.window.createOutputChannel("DevMock");
  const state: Ctx = {
    root: workspaceRoot(),
    server: undefined,
    port: undefined,
    channel,
    provider: undefined as unknown as ProjectProvider,
  };
  const provider = new ProjectProvider(() => state);
  state.provider = provider;

  const refresh = (): void => {
    state.root = workspaceRoot();
    provider.refresh();
  };

  /** Mantém a context key do título da view (Start/Stop) em sincronia com o server. */
  const syncServerContext = (): void => {
    void vscode.commands.executeCommand(
      "setContext",
      "devmock.serverRunning",
      state.server !== undefined,
    );
  };
  syncServerContext();

  // Watcher com debounce: edição manual reflete na Tree em <200ms (PRD-03 RF-05).
  let timer: NodeJS.Timeout | undefined;
  const watcher = vscode.workspace.createFileSystemWatcher("**/.devmock/**");
  const debounced = (): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(refresh, 200);
  };
  watcher.onDidChange(debounced);
  watcher.onDidCreate(debounced);
  watcher.onDidDelete(debounced);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("devmock.project", provider),
    watcher,
    vscode.workspace.onDidChangeWorkspaceFolders(refresh),
    vscode.commands.registerCommand("devmock.refresh", refresh),
    vscode.commands.registerCommand("devmock.actions", async () => {
      const root = workspaceRoot();
      const initialized = !!root && existsSync(devmockDir(root));
      const schemaCount = initialized && root ? listSchemas(root).length : 0;
      const actions = buildActions({ initialized, schemaCount, serverRunning: !!state.server });
      const picks = buildQuickPickItems(actions).map(
        (item): vscode.QuickPickItem & { commandId?: string } =>
          item.kind === "separator"
            ? { label: item.label, kind: vscode.QuickPickItemKind.Separator }
            : { label: item.label, description: item.description, commandId: item.command },
      );
      const picked = await vscode.window.showQuickPick(picks, { placeHolder: "Ações do DevMock" });
      if (!picked?.commandId) return;
      // Fire-and-forget (AUD-12), mas sem engolir rejeição do comando escolhido.
      void vscode.commands.executeCommand(picked.commandId).then(undefined, (err: unknown) => {
        void vscode.window.showErrorMessage(
          `DevMock: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    }),
    vscode.commands.registerCommand("devmock.setErrorRate", async () => {
      const root = workspaceRoot();
      if (!root || !existsSync(devmockDir(root))) {
        void vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
        return;
      }
      const cfg = readConfig(root);
      const input = await vscode.window.showInputBox({
        prompt: "errorRate: % de requisições que falham com 500 (0–100)",
        value: String(cfg.errorRate),
        validateInput: (v) => {
          const n = Number(v);
          return Number.isInteger(n) && n >= 0 && n <= 100
            ? undefined
            : "Informe um inteiro entre 0 e 100.";
        },
      });
      if (input === undefined) return;
      try {
        const applied = doSetErrorRate(root, Number(input));
        if (state.server) state.server.reload({ config: readConfig(root), scenarios: readScenarios(root) });
        refresh();
        void vscode.window.showInformationMessage(`DevMock: errorRate = ${applied}%.`);
      } catch (err) {
        void vscode.window.showErrorMessage(err instanceof Error ? err.message : String(err));
      }
    }),
    vscode.commands.registerCommand("devmock.openEndpoint", async (route?: string) => {
      if (!route) return;
      if (!state.server || !state.port) {
        void vscode.window.showInformationMessage(
          "DevMock: inicie o Mock Server para abrir a rota no navegador.",
        );
        return;
      }
      const url = endpointUrl(state.port, route);
      if (!url) {
        void vscode.window.showInformationMessage(
          "DevMock: esta rota exige um id real — abra a rota de coleção (GET /…).",
        );
        return;
      }
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }),
    vscode.commands.registerCommand("devmock.init", async () => {
      const root = workspaceRoot();
      if (!root) {
        void vscode.window.showErrorMessage("DevMock: abra uma pasta primeiro.");
        return;
      }
      const dir = devmockDir(root);
      mkdirSync(dir, { recursive: true });
      for (const d of DIRS) mkdirSync(join(dir, d), { recursive: true });
      if (!existsSync(join(dir, "config.json"))) writeConfig(root, DEFAULT_CONFIG);
      refresh();
      void vscode.window.showInformationMessage("DevMock: projeto inicializado em .devmock/");
    }),
    vscode.commands.registerCommand("devmock.start", async () => {
      const root = workspaceRoot();
      if (!root || !existsSync(devmockDir(root))) {
        void vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
        return;
      }
      if (state.server) {
        syncServerContext();
        void vscode.window.showInformationMessage(`DevMock já roda em http://localhost:${state.port}.`);
        return;
      }
      const schemas = listSchemas(root);
      if (schemas.length === 0) {
        void vscode.window.showErrorMessage("DevMock: nenhum Schema válido em .devmock/schemas/.");
        return;
      }
      const cfg = readConfig(root);
      const scenarios = readScenarios(root);
      state.server = createMockServer(schemas, { config: cfg, scenarios });
      try {
        state.port = await state.server.listen();
      } catch (err) {
        state.server = undefined;
        syncServerContext();
        void vscode.window.showErrorMessage(`DevMock: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
      syncServerContext();
      refresh();
      void vscode.window.showInformationMessage(`DevMock 🟢 http://localhost:${state.port}`);
    }),
    vscode.commands.registerCommand("devmock.stop", async () => {
      if (!state.server) {
        void vscode.window.showInformationMessage("DevMock: nada em execução.");
        return;
      }
      const logs = state.server.logs();
      await state.server.close();
      state.server = undefined;
      state.port = undefined;
      syncServerContext();
      channel.clear();
      for (const l of logs.slice(-50)) {
        for (const line of formatLogEntry(l)) channel.appendLine(line);
      }
      channel.show(true);
      refresh();
      void vscode.window.showInformationMessage("DevMock: servidor parado. Log nas últimas 50 requisições.");
    }),
    vscode.commands.registerCommand("devmock.createSchema", async () => {
      await createFromScratch(context, refresh, () => state.server !== undefined);
    }),
    vscode.commands.registerCommand("devmock.editSchema", async (node?: string | TreeNode) => {
      const root = workspaceRoot();
      if (!root || !existsSync(devmockDir(root))) {
        void vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
        return;
      }
      const schemas = listSchemas(root);
      if (schemas.length === 0) {
        void vscode.window.showErrorMessage("DevMock: nenhum Schema válido.");
        return;
      }
      // Clique no nó passa o nome; menu de contexto passa o TreeNode.
      const fromNode = typeof node === "object" ? (node.schemaName ?? node.label) : node;
      const target = fromNode ?? await vscode.window.showQuickPick(schemas.map((s) => s.name), { placeHolder: "Editar Schema" });
      if (!target) return;
      const schema = schemas.find((s) => s.name === target);
      if (!schema) {
        void vscode.window.showErrorMessage(`DevMock: Schema "${target}" não encontrado.`);
        return;
      }
      openSchemaForm(context, root, refresh, schema, () => state.server !== undefined);
    }),
    vscode.commands.registerCommand("devmock.createApi", async () => {
      const root = workspaceRoot();
      if (!root || !existsSync(devmockDir(root))) {
        void vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
        return;
      }
      // PRD-03 RF-06: só From scratch no MVP; demais sinalizam o futuro.
      const picked = await vscode.window.showQuickPick(
        [
          { label: "From scratch", description: "Criar Schema no Studio", action: "scratch" },
          { label: "Import OpenAPI", description: "Gerar Schemas de openapi.yaml/json", action: "import" },
          { label: "Detect from project", description: "Sugerir Schemas a partir de src/", action: "detect" },
        ],
        { placeHolder: "Create API" },
      );
      if (!picked) return;
      if (picked.action === "scratch") {
        await createFromScratch(context, refresh, () => state.server !== undefined);
        return;
      }
      if (picked.action === "import") {
        await importApiFlow(root, channel, refresh);
        return;
      }
      if (picked.action === "detect") {
        await detectFlow(root, channel, refresh);
      }
    }),
    vscode.commands.registerCommand("devmock.importApi", async () => {
      const root = workspaceRoot();
      if (!root || !existsSync(devmockDir(root))) {
        void vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
        return;
      }
      await importApiFlow(root, channel, refresh);
    }),
    vscode.commands.registerCommand("devmock.generate", async () => {
      const found = await pickSchema();
      if (!found) return;
      const rows = doGeneratePreview(found.root, found.schema.name);
      const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(rows.slice(0, 20), null, 2),
        language: "json",
      });
      await vscode.window.showTextDocument(doc, { preview: true });
    }),
    vscode.commands.registerCommand("devmock.saveFakeData", async () => {
      const found = await pickSchema();
      if (!found) return;
      const { root, schema } = found;
      const input = await vscode.window.showInputBox({
        prompt: "Quantos registros?",
        value: "20",
        validateInput: (v) => (/^\d+$/.test(v) && Number(v) > 0 ? undefined : "Informe um inteiro positivo."),
      });
      if (!input) return;
      try {
        const saved = doSaveFakeData(root, schema.name, Number(input));
        void vscode.window.showInformationMessage(
          `DevMock: ${saved.count} registros salvos em docs/examples/${schema.name.toLowerCase()}.json (seed ${saved.seed}).`,
        );
      } catch (err) {
        void vscode.window.showErrorMessage(`DevMock: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
      refresh();
    }),
    vscode.commands.registerCommand("devmock.switchScenario", async () => {
      const root = workspaceRoot();
      if (!root || !existsSync(devmockDir(root))) {
        void vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
        return;
      }
      const schemas = listSchemas(root);
      const endpoints = schemas.flatMap((s) => routesFor(s).filter((r) => r.startsWith("GET ")));
      const endpoint = await vscode.window.showQuickPick(endpoints, { placeHolder: "Endpoint" });
      if (!endpoint) return;
      const scenario = await vscode.window.showQuickPick(
        SCENARIO_NAMES,
        { placeHolder: `Cenário para ${endpoint}` },
      );
      if (!scenario) return;
      doSwitchScenario(root, endpoint, scenario);
      if (state.server) {
        // Aplica sem restart (PRD-04): recarrega cenários no servidor vivo.
        state.server.reload({ config: readConfig(root), scenarios: readScenarios(root) });
        void vscode.window.showInformationMessage(`Cenário ${scenario} ativo em ${endpoint}.`);
      }
      refresh();
    }),
    vscode.commands.registerCommand("devmock.export", async () => {
      const root = workspaceRoot();
      if (!root) return;
      if (listSchemas(root).length === 0) {
        void vscode.window.showErrorMessage("DevMock: nenhum Schema válido.");
        return;
      }
      const picked = await vscode.window.showQuickPick(
        ["OpenAPI JSON", "OpenAPI YAML", "JSON Schema", "TypeScript types", "Markdown", "HTML Docs", "Tudo"],
        { placeHolder: "Artefatos", canPickMany: false },
      );
      if (!picked) return;
      let result;
      try {
        result = doExport(root, picked);
      } catch (err) {
        void vscode.window.showErrorMessage(`DevMock: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
      // (d) staleDetector: avisa quais Schemas estavam desatualizados (agora sincronizados).
      if (result.stale.length > 0) {
        void vscode.window.showWarningMessage(
          `DevMock: artefatos estavam desatualizados para: ${result.stale.join(", ")} — sincronizados neste export.`,
        );
      }
      refresh();
      void vscode.window.showInformationMessage(`DevMock: contrato exportado (${picked}).`);
    }),
    vscode.commands.registerCommand("devmock.showLog", () => {
      if (!state.server) {
        void vscode.window.showInformationMessage("DevMock: servidor parado — sem log.");
        return;
      }
      channel.clear();
      for (const l of state.server.logs().slice(-100)) {
        for (const line of formatLogEntry(l)) channel.appendLine(line);
      }
      channel.show(true);
    }),
    vscode.commands.registerCommand("devmock.validate", async () => {
      const root = workspaceRoot();
      if (!root || !existsSync(devmockDir(root))) {
        void vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
        return;
      }
      if (listSchemas(root).length === 0) {
        void vscode.window.showErrorMessage("DevMock: nenhum Schema válido.");
        return;
      }
      const baseUrl = await vscode.window.showInputBox({
        prompt: "URL base da API real (ex: https://api.minhaempresa.com)",
        placeHolder: "https://…",
      });
      if (!baseUrl) return;
      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: "DevMock: validando API real…" },
        async () => {
          const { reports, total } = await doValidate(root, baseUrl);
          channel.clear();
          for (const r of reports) {
            if (r.error) {
              channel.appendLine(`✕ ${r.endpoint} — erro: ${r.error}`);
              continue;
            }
            const icon = r.breaking > 0 ? "✕" : r.warnings > 0 ? "⚠" : "✓";
            channel.appendLine(
              `${icon} ${r.endpoint} — ${r.compatible} compatible, ${r.warnings} warnings, ${r.breaking} breaking (${r.checked} verificados)`,
            );
            for (const f of r.findings) {
              channel.appendLine(
                `    ${f.severity === "breaking" ? "✕" : "⚠"} ${f.path}: esperado ${f.expected}, recebido ${f.received} — ${f.message}`,
              );
            }
          }
          channel.appendLine(`\n${total.compatible} compatible, ${total.warnings} warnings, ${total.breaking} breaking.`);
          channel.show(true);
          if (total.breaking > 0) {
            void vscode.window.showWarningMessage(
              `DevMock: ${total.breaking} breaking change(s) na API real — ver Output.`,
            );
          } else {
            void vscode.window.showInformationMessage("DevMock: API real compatível com o contrato. ✓");
          }
        },
      );
      refresh();
    }),
  );
}

/** Fluxo Import OpenAPI: file picker → converte → grava schemas/ (PRD-06 RF-06). */
async function importApiFlow(root: string, channel: vscode.OutputChannel, refresh: () => void): Promise<void> {
  const files = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: "Importar",
    filters: { "OpenAPI": ["yaml", "yml", "json"] },
  });
  if (!files || files.length === 0) return;
  let content: string;
  try {
    content = readFileSync(files[0].fsPath, "utf8");
  } catch {
    void vscode.window.showErrorMessage("DevMock: não foi possível ler o arquivo selecionado.");
    return;
  }
  let imported;
  try {
    imported = await doImportContent(root, content, false);
  } catch (err) {
    void vscode.window.showErrorMessage(`DevMock: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }
  if (imported.skipped.length > 0) {
    const answer = await vscode.window.showWarningMessage(
      `Sobrescrever ${imported.skipped.length} schema(s) existente(s)? (${imported.skipped.join(", ")})`,
      { modal: true },
      "Sobrescrever",
    );
    if (answer !== "Sobrescrever") return;
    const forced = await doImportContent(root, content, true);
    imported = forced;
  }
  if (imported.warnings.length > 0) {
    channel.clear();
    for (const w of imported.warnings) channel.appendLine(`import: ${w}`);
    channel.show(true);
  }
  void vscode.window.showInformationMessage(
    `DevMock: ${imported.created.length} schema(s) importado(s)${imported.warnings.length > 0 ? ` com ${imported.warnings.length} aviso(s)` : ""}.`,
  );
  refresh();
}

/** Abre o Studio após garantir projeto inicializado (usado por createSchema/createApi). */
async function createFromScratch(
  context: vscode.ExtensionContext,
  refresh: () => void,
  isRunning?: () => boolean,
): Promise<void> {
  const root = workspaceRoot();
  if (!root || !existsSync(devmockDir(root))) {
    void vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
    return;
  }
  openSchemaForm(context, root, refresh, undefined, isRunning);
}

/** DevMock Studio: editor de Schema + preview de Fake Data (PRD-03 RF-04). */
function openSchemaForm(
  context: vscode.ExtensionContext,
  root: string,
  refresh: () => void,
  initial?: Schema,
  isRunning?: () => boolean,
): void {
  const media = vscode.Uri.joinPath(context.extensionUri, "media");
  const title = initial ? `DevMock Studio — Editar ${initial.name}` : "DevMock Studio";
  const panel = vscode.window.createWebviewPanel("devmockSchema", title, vscode.ViewColumn.One, {
    enableScripts: true,
    localResourceRoots: [media],
  });
  const cssUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(media, "form.css"));
  const jsUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(media, "form.js"));
  const csp = panel.webview.cspSource;
  const nonce = randomBytes(16).toString("base64");
  const cfg = readConfig(root);
  panel.webview.html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${csp}; script-src 'nonce-${nonce}' ${csp};" />
<link rel="stylesheet" href="${cssUri}" />
</head><body>
<div class="flex-col gap">
  <div class="card">
    <div class="justify-between"><h2 class="title">DevMock Studio <span class="badge">Schema + Preview</span></h2></div>
    <p class="muted">Defina o modelo, pré-visualize os dados com seed e salve em <code>schemas/</code>.</p>
    <label class="field">Model <input id="model" placeholder="User" /></label>
  </div>
  <div class="card">
    <h3 class="subtitle">Campos</h3>
    <table class="grid" id="fields"><tr><th>campo</th><th>tipo</th><th>req.</th><th>generator</th><th>enum (vírgula)</th><th></th></tr></table>
    <div class="flex gap mt"><button id="add" class="btn btn-secondary">+ campo</button></div>
  </div>
  <div class="card">
    <h3 class="subtitle">Gerar preview</h3>
    <div class="flex gap">
      <label class="field">Records <input id="records" type="number" value="5" min="1" max="100" /></label>
      <label class="field">Seed <input id="seed" type="number" /></label>
    </div>
    <div class="flex gap mt">
      <button id="preview" class="btn btn-secondary">Preview</button>
      <button id="save" class="btn btn-primary">Salvar schema</button>
    </div>
    <pre id="previewOut" class="preview hidden"></pre>
    <div id="msg" class="alert hidden mt"></div>
  </div>
</div>
<script nonce="${nonce}">window.DM_GENERATORS = ${JSON.stringify(GENERATORS)}; window.DM_TYPES = ${JSON.stringify(TYPES)}; window.DM_SEED = ${JSON.stringify(cfg.seedDefault)}; window.DM_INITIAL = ${JSON.stringify(initial ?? null)}; window.DM_EDITING = ${JSON.stringify(initial?.name ?? null)};</script>
<script src="${jsUri}"></script>
</body></html>`;

  panel.webview.onDidReceiveMessage(
    (msg: { kind: string; model: string; fields: Record<string, unknown>[]; records?: number; seed?: number | string; silent?: boolean }) => {
      const reply = handleStudioMessage(msg, {
        root,
        seedDefault: cfg.seedDefault,
        initial,
        isRunning,
        onSaved: refresh,
      });
      if (reply.kind === "noop") return;
      void panel.webview.postMessage(reply);
    },
    undefined,
    context.subscriptions,
  );
}

export function deactivate(): void {}
