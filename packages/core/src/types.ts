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

export interface Schema {
  name: string;
  fields: SchemaField[];
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
}

export const DEFAULT_CONFIG: DevMockConfig = {
  port: 4010,
  seedDefault: 12345,
  localeDefault: "pt-BR",
  activeScenarios: {},
};
