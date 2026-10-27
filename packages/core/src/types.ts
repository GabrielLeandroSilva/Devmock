/** Tipos centrais do DevMock Core (fonte: 01-Core-Model, PRD-01). */

export type FieldType =
  | "uuid"
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "image"
  | "enum"
  | "ref"
  | "array";

export interface SchemaField {
  name: string;
  type: FieldType;
  required?: boolean;
  /** Nome do gerador, ex: "email", "br.cpf", "br.nome". */
  generator?: string;
  /** Para type "enum". */
  values?: string[];
  /** Para type "number" com formato monetário. */
  format?: "BRL";
  /** Para type "ref"/"array": nome do Schema referenciado. */
  ref?: string;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RouteKind = "list" | "item" | "create" | "update" | "patch" | "delete" | "custom";

/** Resposta padrão de uma rota (cenário/endpoint config têm precedência). */
export interface SchemaRouteResponse {
  status?: number;
  body?: unknown;
}

/** Rota declarada pelo Schema (v1.5.0). */
export interface SchemaRoute {
  method: HttpMethod;
  path: string;
  kind: RouteKind;
  response?: SchemaRouteResponse;
  /** Texto para docs/OpenAPI. */
  summary?: string;
}

export interface Schema {
  name: string;
  fields: SchemaField[];
  /** Ausente = CRUD padrão; presente = substitui o conjunto. */
  routes?: SchemaRoute[];
}

export interface Diagnostic {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface DevMockConfig {
  port: number;
  seedDefault: number;
  localeDefault: string;
  activeScenarios: Record<string, string>;
  /** Taxa de falha simulada 0–100 (% das requisições viram 500). Determinística por seed. */
  errorRate: number;
}

export const DEFAULT_CONFIG: DevMockConfig = {
  port: 4010,
  seedDefault: 12345,
  localeDefault: "pt-BR",
  activeScenarios: {},
  errorRate: 0,
};
