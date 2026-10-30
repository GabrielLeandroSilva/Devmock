import { listRoute, routeKey, routeLabel, type DevMockConfig, type Schema } from "@devmock/core";
import { scenarioOf } from "./ops.js";

/** Grupo de ações no QuickPick (separadores da UI). */
export type ActionGroup = "project" | "schemas" | "data" | "server" | "view";

export interface ActionState {
  initialized: boolean;
  schemaCount: number;
  serverRunning: boolean;
}

export interface ActionItem {
  label: string;
  description?: string;
  /** Codicon (ex.: "add" → `$(add)`). */
  icon?: string;
  command: string;
  group: ActionGroup;
}

/** Config mínima para montar a seleção de cenário. */
export type ScenarioConfig = Pick<DevMockConfig, "activeScenarios">;

/** Item da multi-seleção de Schemas ao clicar num cenário (M2). */
export interface ScenarioPickItem {
  label: string;
  description: string;
  route: string;
  picked: boolean;
}

/**
 * Monta a multi-seleção de Schemas para aplicar um cenário (M2).
 * A rota é a do `GET` de coleção — a mesma exibida no nó do Schema.
 */
export function buildScenarioPick(
  schemas: Schema[],
  config: ScenarioConfig,
  scenario: string,
): ScenarioPickItem[] {
  return schemas.flatMap((schema) => {
    const route = listRoute(schema);
    if (!route) return [];
    const key = routeKey(route);
    const current = scenarioOf(config.activeScenarios, key);
    return [
      {
        label: schema.name,
        description: `cenário: ${current} · ${routeLabel(route)}`,
        route: key,
        picked: current === scenario,
      },
    ];
  });
}

/** Rótulo humano de cada grupo (separadores do QuickPick). */
export const ACTION_GROUP_LABELS: Record<ActionGroup, string> = {
  project: "Projeto",
  schemas: "Schemas",
  data: "Dados & contrato",
  server: "Servidor",
  view: "View",
};

/** Item já pronto para o QuickPick (separador ou ação). */
export interface QuickPickAction {
  kind: "separator" | "item";
  label: string;
  description?: string;
  command?: string;
}

/** Ações do clique num endpoint (M4). */
export type EndpointActionId = "scenario" | "curl" | "browser";

export interface EndpointActionItem {
  label: string;
  description?: string;
  icon?: string;
  action: EndpointActionId;
}

/** Menu de um endpoint: cenário/cURL sempre; browser só em GET de coleção. */
export function buildEndpointMenu(method: string, path: string): EndpointActionItem[] {
  const m = String(method).toUpperCase();
  const withBody = m === "POST" || m === "PUT" || m === "PATCH";
  const items: EndpointActionItem[] = [
    {
      label: "Switch scenario…",
      description: "Aplicar um cenário neste endpoint",
      icon: "symbol-enum",
      action: "scenario",
    },
    {
      label: "Copy as cURL",
      description: withBody ? "Copiar comando com body de exemplo" : "Copiar comando (sem body)",
      icon: "copy",
      action: "curl",
    },
  ];
  if (m === "GET" && !String(path).includes(":")) {
    items.push({
      label: "Open in browser",
      description: "Abrir GET de coleção",
      icon: "globe",
      action: "browser",
    });
  }
  return items;
}

/** cURL pronto (POSIX; body opcional para métodos de escrita). */
export function buildCurl(method: string, url: string, body?: string): string {
  const quote = (value: string): string => `'${value.replace(/'/g, "'\\''")}'`;
  const parts = [`curl -X ${String(method).toUpperCase()} ${quote(url)}`];
  if (body !== undefined) {
    parts.push(`-H "Content-Type: application/json"`);
    parts.push(`-d ${quote(body)}`);
  }
  return parts.join(" ");
}

/** Converte as ações em itens de QuickPick, com um separador por grupo (M1). */
export function buildQuickPickItems(actions: ActionItem[]): QuickPickAction[] {
  const items: QuickPickAction[] = [];
  let lastGroup: ActionGroup | undefined;
  for (const action of actions) {
    if (lastGroup !== undefined && action.group !== lastGroup) {
      items.push({ kind: "separator", label: ACTION_GROUP_LABELS[action.group] });
    }
    items.push({
      kind: "item",
      label: action.icon ? `$(${action.icon}) ${action.label}` : action.label,
      description: action.description,
      command: action.command,
    });
    lastGroup = action.group;
  }
  return items;
}

/**
 * Lista as ações do botão "Ações" da Tree conforme o estado do projeto (M1).
 * Puro (sem `vscode`): o comando só converte em QuickPick e executa.
 */
export function buildActions(state: ActionState): ActionItem[] {
  const hasSchemas = state.schemaCount > 0;

  if (!state.initialized) {
    return [
      {
        label: "Initialize Project",
        description: "Criar .devmock/",
        icon: "new-folder",
        command: "devmock.init",
        group: "project",
      },
      { label: "Refresh View", icon: "refresh", command: "devmock.refresh", group: "view" },
    ];
  }

  const out: ActionItem[] = [
    { label: "New Schema…", icon: "add", command: "devmock.createSchema", group: "schemas" },
  ];
  if (hasSchemas) {
    out.push({ label: "Edit Schema…", icon: "edit", command: "devmock.editSchema", group: "schemas" });
  }
  out.push(
    {
      label: "Create API…",
      description: "From scratch, Import ou Detect",
      icon: "symbol-class",
      command: "devmock.createApi",
      group: "schemas",
    },
    { label: "Import OpenAPI…", icon: "cloud-download", command: "devmock.importApi", group: "schemas" },
  );

  if (hasSchemas) {
    out.push(
      { label: "Generate Fake Data…", icon: "beaker", command: "devmock.generate", group: "data" },
      { label: "Save Fake Data…", icon: "save", command: "devmock.saveFakeData", group: "data" },
      {
        label: "Export Contract…",
        description: "6 artefatos + hashes",
        icon: "export",
        command: "devmock.export",
        group: "data",
      },
      {
        label: "Validate Real API…",
        description: "Compara com a API real",
        icon: "check",
        command: "devmock.validate",
        group: "data",
      },
    );
  }

  if (state.serverRunning) {
    out.push({ label: "Stop Mock Server", icon: "debug-stop", command: "devmock.stop", group: "server" });
  } else if (hasSchemas) {
    out.push({ label: "Start Mock Server", icon: "play", command: "devmock.start", group: "server" });
  }
  if (hasSchemas) {
    out.push({
      label: "Switch Scenario…",
      description: "Por endpoint",
      icon: "symbol-enum",
      command: "devmock.switchScenario",
      group: "server",
    });
  }
  out.push({ label: "Set Error Rate…", icon: "pencil", command: "devmock.setErrorRate", group: "server" });
  if (state.serverRunning) {
    out.push({ label: "Show Request Log", icon: "output", command: "devmock.showLog", group: "server" });
  }

  out.push({ label: "Refresh View", icon: "refresh", command: "devmock.refresh", group: "view" });
  return out;
}
