import type { DevMockConfig, Schema, SchemaRoute } from "../types.js";

/** Config por endpoint (PRD-02 §11). */
export interface EndpointConfig {
  status?: number;
  delayMs?: number;
  records?: number;
  pagination?: { enabled: boolean; page: number; limit: number };
  headers?: Record<string, string>;
  scenario?: string;
  /** Corpo customizado do cenário (ex: Empty vazio). */
  body?: unknown;
  /** Cenário indicativo para o log da Extension (Default, Empty, Unauthorized…). */
  label?: string;
  /** Taxa de falha 0–100 (%) só sobre o Default; cenário ativo tem precedência. */
  errorRate?: number;
}

export interface MockServerOptions {
  config?: Partial<DevMockConfig>;
  /** Cenários por endpoint, ex: { "GET /users": { "Empty": {...} } }. */
  scenarios?: Record<string, Record<string, EndpointConfig>>;
  /** Config por endpoint (chave "METHOD /path"). */
  endpoints?: Record<string, EndpointConfig>;
}

export interface RequestLogEntry {
  method: string;
  route: string;
  status: number;
  ms: number;
  scenario: string;
  /** Corpo da requisição, truncado em 1KB (PRD-02 logs com body). */
  requestBody?: string;
  /** Corpo da resposta, truncado em 1KB. */
  responseBody?: string;
  /** true se algum corpo foi cortado no limite de 1KB. */
  truncated?: boolean;
}

export interface Envelope<T> {
  data: T;
  total?: number;
  page?: number;
  limit?: number;
}

export const DEFAULT_ENDPOINT: Required<Pick<EndpointConfig, "status" | "delayMs" | "records">> = {
  status: 200,
  delayMs: 300,
  records: 20,
};

export const NOT_FOUND_BODY = {
  error: "NOT_FOUND",
  message: "Recurso não encontrado.",
};

export const ERROR_BODY: Record<number, { error: string; message: string }> = {
  401: { error: "UNAUTHORIZED", message: "Não autorizado." },
  403: { error: "FORBIDDEN", message: "Acesso proibido." },
  429: { error: "RATE_LIMITED", message: "Muitas requisições. Tente de novo em instantes." },
  500: { error: "INTERNAL_ERROR", message: "Erro interno do servidor." },
};

/**
 * Cenários embutidos (PRD-04 MVP): valem quando não há definição em
 * scenarios/*.json — trocar de cenário funciona direto da caixa.
 * Arquivo sempre tem precedência sobre o embutido.
 */
export const BUILTIN_SCENARIOS: Record<string, EndpointConfig> = {
  Default: { status: 200 },
  Empty: { status: 200, body: { data: [], total: 0 } },
  Unauthorized: { status: 401 },
  Forbidden: { status: 403 },
  "Server Error": { status: 500 },
  "Slow Network": { status: 200, delayMs: 5000 },
  "Rate Limited": { status: 429 },
};

/**
 * Nomes dos cenários embutidos, na ordem de exibição da UI (PRD-04).
 * Fonte única para a Extension não divergir do Core (evita lista duplicada).
 */
export const SCENARIO_NAMES: string[] = Object.keys(BUILTIN_SCENARIOS);

/** Header que força o cenário por requisição (PRD-04 RF-06). */
export const SCENARIO_HEADER = "x-mock-scenario";

/** Query que força o cenário por requisição (PRD-04 RF-06). */
export const SCENARIO_QUERY = "scenario";

export function plural(name: string): string {
  const lower = name.toLowerCase();
  if (lower === "person") return "people";
  // Model já no plural ("Users", "Status") não ganha outro "s" (evita "/userss").
  if (lower.endsWith("s")) return lower;
  return `${lower}s`;
}

export function basePath(schema: Schema): string {
  return `/${plural(schema.name)}`;
}

/** CRUD padrão gerado a partir do Schema (PRD-02 RF-01). */
export function defaultRoutes(schema: Schema): SchemaRoute[] {
  const p = basePath(schema);
  return [
    { method: "GET", path: p, kind: "list" },
    { method: "GET", path: `${p}/:id`, kind: "item" },
    { method: "POST", path: p, kind: "create" },
    { method: "PUT", path: `${p}/:id`, kind: "update" },
    { method: "PATCH", path: `${p}/:id`, kind: "patch" },
    { method: "DELETE", path: `${p}/:id`, kind: "delete" },
  ];
}

/** Rotas efetivas: as declaradas no Schema ou o CRUD padrão (ausente). */
export function schemaRoutes(schema: Schema): SchemaRoute[] {
  // JSON editado à mão pode trazer `routes` não-array/entradas nulas; nunca derrubar a UI.
  return Array.isArray(schema.routes)
    ? schema.routes.filter((route) => route && typeof route === "object")
    : defaultRoutes(schema);
}

/** Chave canônica de config/cenário/log: `"METHOD /path"` em minúsculas (AUD-04). */
export function routeKey(route: SchemaRoute): string {
  const method = String(route?.method ?? "").toUpperCase();
  const path = typeof route?.path === "string" ? route.path : "";
  return `${method} ${path.toLowerCase()}`;
}

/** String de exibição, preservando o case declarado no path. */
export function routeLabel(route: SchemaRoute): string {
  const method = String(route?.method ?? "").toUpperCase();
  const path = typeof route?.path === "string" ? route.path : "";
  return `${method} ${path}`;
}

/** Caminhos de rota efetivos (PRD-02 RF-01; v1.5.0 respeita `Schema.routes`). */
export function routesFor(schema: Schema): string[] {
  return schemaRoutes(schema).map(routeKey);
}

/** Rota de coleção: `kind: list` ou o primeiro GET sem parâmetro. */
export function listRoute(schema: Schema): SchemaRoute | undefined {
  const routes = schemaRoutes(schema);
  return (
    routes.find((route) => route && route.kind === "list") ??
    routes.find(
      (route) =>
        route &&
        String(route.method).toUpperCase() === "GET" &&
        !String(route.path).includes(":"),
    )
  );
}

export function resolveEndpoint(
  key: string,
  opts: MockServerOptions,
  scenarioOverride?: string,
): { cfg: Required<Pick<EndpointConfig, "status" | "delayMs" | "records">> & EndpointConfig; scenario: string } {
  const endpointCfg = opts.endpoints?.[key] ?? {};
  const scenarios = opts.scenarios?.[key] ?? {};
  // Precedência: request (query/header) > cenário do endpoint > ativo > Default.
  // Override desconhecido cai no cenário normal — nunca quebra a requisição (PRD-04 RF-07).
  const activeName = isKnownScenario(scenarioOverride, scenarios)
    ? scenarioOverride
    : (endpointCfg.scenario ?? activeScenarioName(key, opts));
  // Arquivo > embutido > vazio (embutido evita cair no default silenciosamente).
  const scenarioCfg = activeName ? (scenarios[activeName] ?? BUILTIN_SCENARIOS[activeName] ?? {}) : {};
  const merged: EndpointConfig = { ...endpointCfg, ...scenarioCfg, scenario: activeName };
  return {
    cfg: { ...DEFAULT_ENDPOINT, ...merged },
    scenario: activeName ?? "Default",
  };
}

/** Nome de cenário resolvível (arquivo do endpoint ou embutido). */
function isKnownScenario(
  name: string | undefined,
  scenarios: Record<string, EndpointConfig>,
): name is string {
  return (
    !!name &&
    (Object.prototype.hasOwnProperty.call(scenarios, name) ||
      Object.prototype.hasOwnProperty.call(BUILTIN_SCENARIOS, name))
  );
}

/** Cenário ativo declarado em config.activeScenarios tem precedência (PRD-04 §6). */
export function activeScenarioName(key: string, opts: MockServerOptions): string | undefined {
  return opts.config?.activeScenarios?.[key];
}

/** Envelope paginado `{data,total,page,limit}` (PRD-02 RF-03). */
export function paginate<T>(rows: T[], page: number, limit: number): Envelope<T[]> {
  const p = Math.max(1, page);
  const l = Math.max(1, limit);
  const start = (p - 1) * l;
  return {
    data: rows.slice(start, start + l),
    total: rows.length,
    page: p,
    limit: l,
  };
}
