import * as vscode from "vscode";
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

function readConfig(root: string): typeof DEFAULT_CONFIG {
  try {
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
      const root = workspaceRoot();
      if (!root) return;
      const schemas = listSchemas(root);
      if (schemas.length === 0) {
        await vscode.window.showErrorMessage("DevMock: nenhum Schema válido.");
        return;
      }
      const picked = await vscode.window.showQuickPick(schemas.map((s) => s.name), { placeHolder: "Schema" });
      if (!picked) return;
      const schema = schemas.find((s) => s.name === picked);
      if (!schema) return;
      const cfg = readConfig(root);
      const rows = generate(schema, 20, cfg.seedDefault);
      const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(rows.slice(0, 20), null, 2),
        language: "json",
      });
      await vscode.window.showTextDocument(doc, { preview: true });
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
        await vscode.window.showInformationMessage("Cenário salvo. Reinicie o servidor para aplicar (stop → start).");
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

/** Form de Schema em Webview (PRD-03 RF-04): tipos + geradores br.* em dropdown. */
function openSchemaForm(context: vscode.ExtensionContext, root: string, refresh: () => void): void {
  const panel = vscode.window.createWebviewPanel("devmockSchema", "DevMock: New Schema", vscode.ViewColumn.One, {
    enableScripts: true,
  });
  const genOptions = GENERATORS.map((g) => `<option value="${g}">${g}</option>`).join("");
  const typeOptions = TYPES.map((t) => `<option value="${t}">${t}</option>`).join("");
  panel.webview.html = `<!DOCTYPE html><html><body>
<h2>New Schema</h2>
<label>Model: <input id="model" placeholder="User" /></label>
<table id="fields"><tr><th>campo</th><th>tipo</th><th>required</th><th>generator</th><th>enum (vírgula)</th></tr></table>
<button id="add">+ campo</button> <button id="save">Salvar</button>
<pre id="err"></pre>
<script>
const genOptions = ${JSON.stringify(genOptions)};
const typeOptions = ${JSON.stringify(typeOptions)};
const vscode = acquireVsCodeApi();
function row() {
  const tr = document.createElement("tr");
  tr.innerHTML = '<td><input class="n"/></td><td><select class="t">' + typeOptions + '</select></td>' +
    '<td><input type="checkbox" class="r"/></td><td><select class="g">' + genOptions + '</select></td>' +
    '<td><input class="e" placeholder="ACTIVE,BLOCKED"/></td>';
  document.getElementById("fields").appendChild(tr);
}
row();
document.getElementById("add").onclick = row;
document.getElementById("save").onclick = () => {
  const fields = [...document.querySelectorAll("#fields tr")].slice(1).map((tr) => ({
    name: tr.querySelector(".n").value,
    type: tr.querySelector(".t").value,
    required: tr.querySelector(".r").checked,
    generator: tr.querySelector(".g").value === "(tipo)" ? undefined : tr.querySelector(".g").value,
    values: tr.querySelector(".e").value ? tr.querySelector(".e").value.split(",").map((s) => s.trim()) : undefined,
  }));
  vscode.postMessage({ model: document.getElementById("model").value, fields });
};
window.addEventListener("message", (e) => { document.getElementById("err").textContent = e.data.error ?? "Salvo!"; });
</script></body></html>`;

  panel.webview.onDidReceiveMessage(
    (msg: { model: string; fields: Record<string, unknown>[] }) => {
      const schema = { name: (msg.model || "").trim(), fields: msg.fields } as unknown as Schema;
      const diags = validateSchema(schema);
      const errors = diags.filter((d) => d.severity === "error");
      if (errors.length > 0) {
        void panel.webview.postMessage({ error: errors.map((d) => `${d.field}: ${d.message}`).join("\n") });
        return;
      }
      const file = join(devmockDir(root), "schemas", `${schema.name.toLowerCase()}.json`);
      writeFileSync(file, `${JSON.stringify(schema, null, 2)}\n`);
      void panel.webview.postMessage({ error: `Salvo em schemas/${schema.name.toLowerCase()}.json` });
      refresh();
    },
    undefined,
    context.subscriptions,
  );
}

export function deactivate(): void {}
