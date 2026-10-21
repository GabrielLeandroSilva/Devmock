import { SCENARIO_NAMES, routesFor, type DevMockConfig, type Schema } from "@devmock/core";
import { scenarioOf } from "./ops.js";

/** Nó da Tree em formato puro (sem tipos do VS Code) — testável fora do host. */
export interface TreeNode {
  label: string;
  description?: string;
  icon?: string;
  children?: boolean;
  command?: { command: string; title: string; arguments?: unknown[] };
  contextValue?: string;
  schemaName?: string;
}

/** Snapshot do projeto que a Tree precisa para montar um nível. */
export interface TreeState {
  root: string | undefined;
  initialized: boolean;
  schemas: Schema[];
  config: DevMockConfig;
  serverRunning: boolean;
  port?: number;
}

/**
 * Builder puro da Tree (PRD-03 RF-02/RF-05): monta os nós a partir de um
 * snapshot, sem tocar em `vscode`/fs. `el` vazio devolve a raiz.
 */
export function buildTree(state: TreeState, el?: TreeNode): TreeNode[] {
  if (!state.root) return [{ label: "Abra uma pasta para começar" }];
  if (!state.initialized) {
    return [
      {
        label: "Sem configuração — clique para inicializar",
        icon: "warning",
        command: { command: "devmock.init", title: "Initialize" },
      },
    ];
  }
  if (!el) return rootNodes(state);

  const cfg = state.config;
  switch (el.label) {
    case "Schemas":
      return state.schemas.map((s) => ({
        label: s.name,
        description: `${s.fields.length} campos · cenário: ${scenarioOf(cfg.activeScenarios, routesFor(s)[0])}`,
        contextValue: "schema",
        schemaName: s.name,
        command: { command: "devmock.editSchema", title: "Editar Schema", arguments: [s.name] },
      }));
    case "Endpoints":
      return state.schemas.flatMap((s) =>
        routesFor(s).map((r) => {
          const isGet = r.startsWith("GET ");
          const openable = isGet && !r.includes(":id");
          return {
            label: r,
            description: isGet ? `cenário: ${scenarioOf(cfg.activeScenarios, r)}` : undefined,
            contextValue: isGet ? "endpointGet" : "endpoint",
            command: openable
              ? { command: "devmock.openEndpoint", title: "Abrir no navegador", arguments: [r] }
              : undefined,
          };
        }),
      );
    case "Scenarios":
      return SCENARIO_NAMES.map((name) => ({
        label: (Object.values(cfg.activeScenarios ?? {}).includes(name) ? "✓ " : "") + name,
      }));
    case "Documentation":
      return state.schemas.map((s) => ({ label: `${s.name}.md` }));
    case "Settings":
      return [
        { label: `port: ${cfg.port}` },
        { label: `seedDefault: ${cfg.seedDefault}` },
        { label: `localeDefault: ${cfg.localeDefault}` },
        {
          label: `errorRate: ${cfg.errorRate}`,
          icon: "pencil",
          command: { command: "devmock.setErrorRate", title: "Editar errorRate" },
        },
      ];
    default:
      return [];
  }
}

function rootNodes(state: TreeState): TreeNode[] {
  const serverLabel =
    state.serverRunning && state.port ? `🟢 localhost:${state.port}` : "🔴 parado";
  return [
    { label: "Schemas", icon: "symbol-class", children: true },
    { label: "Endpoints", icon: "symbol-method", children: true },
    { label: "Scenarios", icon: "symbol-enum", children: true },
    { label: "Documentation", icon: "book", children: true },
    { label: "Settings", icon: "gear", children: true },
    { label: `Mock Server ${serverLabel}`, icon: "server" },
  ];
}
