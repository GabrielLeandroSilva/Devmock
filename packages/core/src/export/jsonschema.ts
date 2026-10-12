import type { Schema, SchemaField } from "../types.js";

/** Mapeia campo DevMock → JSON Schema / OpenAPI schema fragment. */
export function fieldToJsonSchema(field: SchemaField): Record<string, unknown> {
  switch (field.type) {
    case "uuid":
      return { type: "string", format: "uuid" };
    case "string":
      return { type: "string" };
    case "number":
      return field.format === "BRL"
        ? { type: "number", format: "float", example: 1520.5 }
        : { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "date":
      return { type: "string", format: "date" };
    case "datetime":
      return { type: "string", format: "date-time" };
    case "image":
      return { type: "string", format: "uri" };
    case "enum":
      return { type: "string", enum: field.values ?? [] };
    case "ref":
      return field.ref ? { $ref: `#/components/schemas/${field.ref}` } : { type: "string" };
    case "array":
      return {
        type: "array",
        items: field.ref ? { $ref: `#/components/schemas/${field.ref}` } : { type: "string" },
      };
    default:
      return { type: "string" };
  }
}

export function schemaToJsonSchema(schema: Schema): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const f of schema.fields) {
    properties[f.name] = fieldToJsonSchema(f);
    if (f.required) required.push(f.name);
  }
  const out: Record<string, unknown> = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: schema.name,
    type: "object",
    properties,
  };
  if (required.length > 0) out.required = required;
  return out;
}

/** Todos os models como mapa nome → JSON Schema (PRD-05 RF-03). */
export function buildJsonSchemas(schemas: Schema[]): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const s of schemas) out[s.name] = schemaToJsonSchema(s);
  return out;
}
