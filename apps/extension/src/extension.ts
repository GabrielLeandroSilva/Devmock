import * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_CONFIG,
  buildDocFor,
  buildJsonSchemas,
  buildOpenApi,
  buildTypes,
  createMockServer,
  generate,
  generatorNames,
  loadSchemas,
  routesFor,
  toYaml,
  validateSchema,
  type MockServer,
  type Schema,
} from "@devmock/core";

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

function devmockDir(root: string): string {
  return join(root, ".devmock");
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function listSchemas(root: string): Schema[] {
  const dir = join(devmockDir(root), "schemas");
  if (!existsSync(dir)) return [];
  try {
    return loadSchemas(dir);
  } catch {
    return [];
  }
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
    return item;
  }

  getChildren(el?: TreeNode): TreeNode[] {
    const ctx = this.ctx();
    if (!ctx.root) return [{ label: "Abra uma pasta para começar" }];
    const dir = devmockDir(ctx.root);
    if (!existsSync(dir)) {
      return [{
        label: "Sem configuração — clique para inicializar",
        icon: "warning",
        command: { command: "devmock.init", title: "Initialize" },
      }];
    }
    if (!el) {
      const serverLabel = ctx.server && ctx.port ? `🟢 localhost:${ctx.port}` : "🔴 parado";
      return [
        { label: "Schemas", icon: "symbol-class", children: true },
        { label: "Endpoints", icon: "symbol-method", children: true },
        { label: "Scenarios", icon: "symbol-enum", children: true },
        { label: "Documentation", icon: "book", children: true },
        { label: "Settings", icon: "gear", children: true },
        { label: `Mock Server ${serverLabel}`, icon: "server" },
      ];
    }
    const schemas = listSchemas(ctx.root);
    switch (el.label) {
      case "Schemas":
        return schemas.map((s) => ({ label: s.name, description: `${s.fields.length} campos` }));
      case "Endpoints":
        return schemas.flatMap((s) => routesFor(s).map((r) => ({ label: r })));
      case "Scenarios": {
        const cfg = readConfig(ctx.root);
        return ["Default", "Empty", "Unauthorized", "Server Error", "Slow Network"].map((name) => ({
          label: (Object.values(cfg.activeScenarios ?? {}).includes(name) ? "✓ " : "") + name,
        }));
      }
      case "Documentation":
        return schemas.map((s) => ({ label: `${s.name}.md` }));
      case "Settings": {
        const cfg = readConfig(ctx.root);
        return [
          { label: `port: ${cfg.port}` },
          { label: `seedDefault: ${cfg.seedDefault}` },
          { label: `localeDefault: ${cfg.localeDefault}` },
        ];
      }
      default:
        return [];
    }
  }
}

interface TreeNode {
  label: string;
  description?: string;
  icon?: string;
  children?: boolean;
  command?: vscode.Command;
}

/** Escolhe um Schema válido ou avisa; usado por generate/saveFakeData. */
async function pickSchema(): Promise<{ root: string; schema: Schema } | undefined> {
  const root = workspaceRoot();
  if (!root) return undefined;
  const schemas = listSchemas(root);
  if (schemas.length === 0) {
    await vscode.window.showErrorMessage("DevMock: nenhum Schema válido.");
    return undefined;
  }
  const picked = await vscode.window.showQuickPick(schemas.map((s) => s.name), { placeHolder: "Schema" });
  if (!picked) return undefined;
  const schema = schemas.find((s) => s.name === picked);
  return schema ? { root, schema } : undefined;
}

function readConfig(root: string): typeof DEFAULT_CONFIG {  try {
    return { ...DEFAULT_CONFIG, ...readJson<Record<string, unknown>>(join(devmockDir(root), "config.json")) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function writeConfig(root: string, cfg: unknown): void {
  writeFileSync(join(devmockDir(root), "config.json"), `${JSON.stringify(cfg, null, 2)}\n`);
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
    vscode.commands.registerCommand("devmock.init", async () => {
      const root = workspaceRoot();
      if (!root) {
        await vscode.window.showErrorMessage("DevMock: abra uma pasta primeiro.");
        return;
      }
      const dir = devmockDir(root);
      mkdirSync(dir, { recursive: true });
      for (const d of DIRS) mkdirSync(join(dir, d), { recursive: true });
      if (!existsSync(join(dir, "config.json"))) writeConfig(root, DEFAULT_CONFIG);
      refresh();
      await vscode.window.showInformationMessage("DevMock: projeto inicializado em .devmock/");
    }),
    vscode.commands.registerCommand("devmock.start", async () => {
      const root = workspaceRoot();
      if (!root || !existsSync(devmockDir(root))) {
        await vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
        return;
      }
      if (state.server) {
        await vscode.window.showInformationMessage(`DevMock já roda em http://localhost:${state.port}.`);
        return;
      }
      const schemas = listSchemas(root);
      if (schemas.length === 0) {
        await vscode.window.showErrorMessage("DevMock: nenhum Schema válido em .devmock/schemas/.");
        return;
      }
      const cfg = readConfig(root);
      const scenarios = readScenarios(root);
      state.server = createMockServer(schemas, { config: cfg, scenarios });
      try {
        state.port = await state.server.listen();
      } catch (err) {
        state.server = undefined;
        await vscode.window.showErrorMessage(`DevMock: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
      refresh();
      await vscode.window.showInformationMessage(`DevMock 🟢 http://localhost:${state.port}`);
    }),
    vscode.commands.registerCommand("devmock.stop", async () => {
      if (!state.server) {
        await vscode.window.showInformationMessage("DevMock: nada em execução.");
        return;
      }
      const logs = state.server.logs();
      await state.server.close();
      state.server = undefined;
      state.port = undefined;
      channel.clear();
      for (const l of logs.slice(-50)) {
        channel.appendLine(`${l.method.padEnd(6)} ${l.route.padEnd(24)} ${l.status} ${l.ms}ms [${l.scenario}]`);
      }
      channel.show(true);
      refresh();
      await vscode.window.showInformationMessage("DevMock: servidor parado. Log nas últimas 50 requisições.");
    }),
    vscode.commands.registerCommand("devmock.createSchema", async () => {
      const root = workspaceRoot();
      if (!root || !existsSync(devmockDir(root))) {
        await vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
        return;
      }
      openSchemaForm(context, root, refresh);
    }),
    vscode.commands.registerCommand("devmock.generate", async () => {
      const found = await pickSchema();
      if (!found) return;
      const { root, schema } = found;
      const cfg = readConfig(root);
      const rows = generate(schema, 20, cfg.seedDefault);
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
      const cfg = readConfig(root);
      const input = await vscode.window.showInputBox({
        prompt: "Quantos registros?",
        value: "20",
        validateInput: (v) => (/^\d+$/.test(v) && Number(v) > 0 ? undefined : "Informe um inteiro positivo."),
      });
      if (!input) return;
      const rows = generate(schema, Number(input), cfg.seedDefault);
      const dir = join(devmockDir(root), "docs", "examples");
      mkdirSync(dir, { recursive: true });
      const file = join(dir, `${schema.name.toLowerCase()}.json`);
      writeFileSync(file, `${JSON.stringify(rows, null, 2)}\n`);
      await vscode.window.showInformationMessage(
        `DevMock: ${rows.length} registros salvos em docs/examples/${schema.name.toLowerCase()}.json (seed ${cfg.seedDefault}).`,
      );
      refresh();
    }),
    vscode.commands.registerCommand("devmock.switchScenario", async () => {
      const root = workspaceRoot();
      if (!root || !existsSync(devmockDir(root))) {
        await vscode.window.showErrorMessage("DevMock: rode `DevMock: Initialize Project` primeiro.");
        return;
      }
      const schemas = listSchemas(root);
      const endpoints = schemas.flatMap((s) => routesFor(s).filter((r) => r.startsWith("GET ")));
      const endpoint = await vscode.window.showQuickPick(endpoints, { placeHolder: "Endpoint" });
      if (!endpoint) return;
      const scenario = await vscode.window.showQuickPick(
        ["Default", "Empty", "Unauthorized", "Server Error", "Slow Network"],
        { placeHolder: `Cenário para ${endpoint}` },
      );
      if (!scenario) return;
      const cfg = readConfig(root);
      cfg.activeScenarios = { ...cfg.activeScenarios, [endpoint]: scenario };
      writeConfig(root, cfg);
      if (state.server) {
        // Aplica sem restart (PRD-04): recarrega cenários no servidor vivo.
        state.server.reload({ config: cfg, scenarios: readScenarios(root) });
        await vscode.window.showInformationMessage(`Cenário ${scenario} ativo em ${endpoint}.`);
      }
      refresh();
    }),
    vscode.commands.registerCommand("devmock.export", async () => {
      const root = workspaceRoot();
      if (!root) return;
      const schemas = listSchemas(root);
      if (schemas.length === 0) {
        await vscode.window.showErrorMessage("DevMock: nenhum Schema válido.");
        return;
      }
      const picked = await vscode.window.showQuickPick(
        ["OpenAPI JSON", "OpenAPI YAML", "JSON Schema", "TypeScript types", "Markdown", "Tudo"],
        { placeHolder: "Artefatos", canPickMany: false },
      );
      if (!picked) return;
      const want = (name: string): boolean => picked === "Tudo" || picked.startsWith(name);
      const dir = devmockDir(root);
      if (want("OpenAPI JSON")) {
        const doc = buildOpenApi(schemas);
        writeFileSync(join(dir, "openapi", "generated.json"), `${JSON.stringify(doc, null, 2)}\n`);
      }
      if (picked === "Tudo" || picked === "OpenAPI YAML") {
        const doc = buildOpenApi(schemas);
        writeFileSync(join(dir, "openapi", "generated.yaml"), toYaml(doc));
      }
      if (want("JSON Schema")) {
        writeFileSync(join(dir, "openapi", "schemas.json"), `${JSON.stringify(buildJsonSchemas(schemas), null, 2)}\n`);
      }
      if (want("TypeScript")) {
        writeFileSync(join(dir, "docs", "types.ts"), buildTypes(schemas));
      }
      if (want("Markdown")) {
        for (const s of schemas) writeFileSync(join(dir, "docs", `${s.name.toLowerCase()}.md`), buildDocFor(s));
      }
      refresh();
      await vscode.window.showInformationMessage(`DevMock: contrato exportado (${picked}).`);
    }),
    vscode.commands.registerCommand("devmock.showLog", () => {
      if (!state.server) {
        void vscode.window.showInformationMessage("DevMock: servidor parado — sem log.");
        return;
      }
      channel.clear();
      for (const l of state.server.logs().slice(-100)) {
        channel.appendLine(`${l.method.padEnd(6)} ${l.route.padEnd(24)} ${l.status} ${l.ms}ms [${l.scenario}]`);
      }
      channel.show(true);
    }),
  );
}

function readScenarios(root: string): Record<string, Record<string, never>> {
  const out: Record<string, Record<string, never>> = {};
  const dir = join(devmockDir(root), "scenarios");
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    try {
      const file = readJson<Record<string, Record<string, never>>>(join(dir, f));
      for (const [endpoint, map] of Object.entries(file)) out[endpoint] = { ...(out[endpoint] ?? {}), ...map };
    } catch {
      // Arquivo inválido: ignora (o validador do Core acusa no generate/export).
    }
  }
  return out;
}

/** DevMock Studio: editor de Schema + preview de Fake Data (PRD-03 RF-04). */
function openSchemaForm(context: vscode.ExtensionContext, root: string, refresh: () => void): void {
  const media = vscode.Uri.joinPath(context.extensionUri, "media");
  const panel = vscode.window.createWebviewPanel("devmockSchema", "DevMock Studio", vscode.ViewColumn.One, {
    enableScripts: true,
    localResourceRoots: [media],
  });
  const cssUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(media, "form.css"));
  const jsUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(media, "form.js"));
  const csp = panel.webview.cspSource;
  const nonce = randomBytes(16).toString("base64");  const cfg = readConfig(root);
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
      <span id="previewBadge" class="badge hidden"></span>
    </div>
    <pre id="previewOut" class="preview hidden"></pre>
    <div id="msg" class="alert hidden mt"></div>
  </div>
</div>
<script nonce="${nonce}">window.DM_GENERATORS = ${JSON.stringify(GENERATORS)}; window.DM_TYPES = ${JSON.stringify(TYPES)}; window.DM_SEED = ${JSON.stringify(cfg.seedDefault)};</script>
<script src="${jsUri}"></script>
</body></html>`;

  panel.webview.onDidReceiveMessage(
    (msg: { kind: string; model: string; fields: Record<string, unknown>[]; records?: number; seed?: number | string; silent?: boolean }) => {
      const schema = { name: (msg.model || "").trim(), fields: msg.fields } as unknown as Schema;
      const diags = validateSchema(schema);
      const errors = diags.filter((d) => d.severity === "error");
      if (msg.kind === "preview") {
        // Preview silencioso (auto): sem erros válidos, sem resposta — nunca polui a tela.
        if (errors.length > 0) {
          if (!msg.silent) {
            void panel.webview.postMessage({ kind: "error", text: errors.map((d) => `${d.field}: ${d.message}`).join("\n") });
          }
          return;
        }
        const seed = msg.seed === undefined || msg.seed === "" ? cfg.seedDefault : msg.seed;
        const rows = generate(schema, msg.records ?? 5, seed);
        void panel.webview.postMessage({
          kind: "previewResult",
          label: `${rows.length} registros · seed ${seed}`,
          text: JSON.stringify(rows, null, 2),
        });
        return;
      }
      if (errors.length > 0) {
        void panel.webview.postMessage({ kind: "error", text: errors.map((d) => `${d.field}: ${d.message}`).join("\n") });
        return;
      }
      const file = join(devmockDir(root), "schemas", `${schema.name.toLowerCase()}.json`);
      writeFileSync(file, `${JSON.stringify(schema, null, 2)}\n`);
      void panel.webview.postMessage({ kind: "ok", text: `Salvo em schemas/${schema.name.toLowerCase()}.json` });
      refresh();
    },
    undefined,
    context.subscriptions,
  );
}

export function deactivate(): void {}
