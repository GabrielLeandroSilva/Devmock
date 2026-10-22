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
