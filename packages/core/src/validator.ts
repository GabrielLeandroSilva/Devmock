import type { Diagnostic, Schema } from "./types.js";
import { FIELD_TYPES } from "./constants.js";

/**
 * Valida um Schema. Retorna diagnósticos com campo + motivo
 * (PRD-01 RF-02). Lista vazia = válido.
 */
export function validateSchema(schema: Schema, knownSchemas: string[] = []): Diagnostic[] {
  const diags: Diagnostic[] = [];

  if (!schema.name || !schema.name.trim()) {
    diags.push({ field: "name", message: "Schema precisa de um nome.", severity: "error" });
    return diags;
  }
  if (!Array.isArray(schema.fields) || schema.fields.length === 0) {
    diags.push({ field: "fields", message: "Schema precisa de ao menos um campo.", severity: "error" });
    return diags;
  }

  const names = new Set<string>();
  let hasRequired = false;

  for (const f of schema.fields) {
    if (!f.name || !f.name.trim()) {
      diags.push({ field: "(sem nome)", message: "Campo sem nome.", severity: "error" });
      continue;
    }
    if (names.has(f.name)) {
      diags.push({ field: f.name, message: `Campo duplicado: "${f.name}".`, severity: "error" });
    }
    names.add(f.name);
    if (f.required) hasRequired = true;

    if (!FIELD_TYPES.includes(f.type)) {
      diags.push({ field: f.name, message: `Tipo inválido: "${f.type}".`, severity: "error" });
      continue;
    }
    if (f.type === "enum") {
      if (!f.values || f.values.length === 0) {
        diags.push({ field: f.name, message: "Enum precisa de ao menos um valor.", severity: "error" });
      }
    }
    if ((f.type === "ref" || f.type === "array") && f.ref) {
      if (!knownSchemas.includes(f.ref)) {
        diags.push({
          field: f.name,
          message: `Referência quebrada: "${f.ref}" não é um Schema conhecido.`,
          severity: "error",
        });
      }
    }
    if (f.type !== "ref" && f.type !== "array" && f.ref && !f.generator) {
      diags.push({
        field: f.name,
        message: `"ref" só faz sentido para tipos ref/array.`,
        severity: "warning",
      });
    }
  }

  if (!hasRequired) {
    diags.push({
      field: "(schema)",
      message: "Todo Schema precisa de ao menos 1 campo required (âncora de identidade).",
      severity: "error",
    });
  }

  return diags;
}
