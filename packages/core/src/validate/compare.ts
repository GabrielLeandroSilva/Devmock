import type { Schema, SchemaField } from "../types.js";

export type Severity = "compatible" | "warning" | "breaking";

export interface Finding {
  path: string;
  expected: string;
  received: string;
  severity: Severity;
  message: string;
}

/**
 * Compara um valor contra o Schema, campo a campo (PRD-07 RF-01).
 * Regras: required ausente/tipo divergente/enum fora = Breaking;
 * campo extra = Warning (nunca Breaking); opcional ausente = Compatible.
 */
export function compare(schema: Schema, value: unknown, base = ""): Finding[] {
  const findings: Finding[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [{
      path: base || schema.name,
      expected: "object",
      received: kindOf(value),
      severity: "breaking",
      message: "Resposta não é um objeto.",
    }];
  }
  const obj = value as Record<string, unknown>;
  const known = new Set(schema.fields.map((f) => f.name));

  for (const field of schema.fields) {
    const path = base ? `${base}.${field.name}` : field.name;
    const present = field.name in obj && obj[field.name] !== undefined;
    if (!present) {
      if (field.required) {
        findings.push({
          path,
          expected: `${field.type} (required)`,
          received: "ausente",
          severity: "breaking",
          message: "Campo obrigatório ausente.",
        });
      }
      continue;
    }
    findings.push(...compareField(field, obj[field.name], path));
  }

  for (const key of Object.keys(obj)) {
    if (!known.has(key)) {
      findings.push({
        path: base ? `${base}.${key}` : key,
        expected: "—",
        received: kindOf(obj[key]),
        severity: "warning",
        message: "Campo extra na resposta (backend pode evoluir).",
      });
    }
  }
  return findings;
}

function compareField(field: SchemaField, value: unknown, path: string): Finding[] {
  switch (field.type) {
    case "uuid":
    case "string":
    case "date":
    case "datetime":
    case "image":
      return typeof value === "string"
        ? []
        : [breaking(path, "string", value, "Tipo divergente.")];
    case "number":
      // Caso clássico §22: "1500.00" vs 1500.50.
      return typeof value === "number"
        ? []
        : [breaking(path, "number", value, "Tipo divergente (ex: string no lugar de number).")];
    case "boolean":
      return typeof value === "boolean"
        ? []
        : [breaking(path, "boolean", value, "Tipo divergente.")];
    case "enum": {
      const values = field.values ?? [];
      return typeof value === "string" && values.includes(value)
        ? []
        : [breaking(path, values.join(" | ") || "enum", value, "Valor fora do enum fechado.")];
    }
    case "ref":
    case "array":
      // Referências não são expandidas contra outros Schemas aqui (comparação rasa):
      // array precisa ser array; ref aceita string (id) ou objeto.
      if (field.type === "array") {
        return Array.isArray(value)
          ? []
          : [breaking(path, "array", value, "Tipo divergente.")];
      }
      return typeof value === "string" || (value !== null && typeof value === "object")
        ? []
        : [breaking(path, "ref(id|objeto)", value, "Tipo divergente.")];
    default:
      return [];
  }
}

function breaking(path: string, expected: string, received: unknown, message: string): Finding {
  return { path, expected, received: kindOf(received), severity: "breaking", message };
}

/** Tipo legível do valor recebido (para expected × received). */
export function kindOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  switch (typeof value) {
    case "string":
      return `string (${JSON.stringify(value).slice(0, 32)})`;
    case "number":
    case "boolean":
    case "bigint":
      return typeof value;
    case "undefined":
      return "ausente";
    default:
      return typeof value;
  }
}
