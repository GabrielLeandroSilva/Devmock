import { plural } from "../mock/routes.js";
import type { Schema, SchemaField } from "../types.js";
import { paginatedExampleJson } from "./example.js";

function fieldLabel(f: SchemaField): string {
  if (f.type === "enum") return (f.values ?? []).join(" | ");
  if (f.type === "number" && f.format === "BRL") return "number (BRL)";
  if (f.type === "ref" || f.type === "array") return f.ref ? `${f.type} → ${f.ref}` : f.type;
  return f.type;
}

/** Markdown por recurso no template do §15 (PRD-05 RF-01). */
export function buildDocFor(schema: Schema): string {
  const base = `/${plural(schema.name)}`;
  const rows = schema.fields
    .map((f) => `| ${f.name} | ${fieldLabel(f)} | ${f.required ? "sim" : "não"} |`)
    .join("\n");
  return `# ${schema.name} API\n\n## GET ${base}\n\nReturns a list of ${schema.name}.\n\n### Query Parameters\n\n| Nome | Tipo |\n|------|------|\n| page | number |\n| limit | number |\n\n### Response 200\n\n\`\`\`json\n${paginatedExampleJson(schema)}\n\`\`\`\n\n### Campos\n\n| Campo | Tipo | Obrigatório |\n|-------|------|-------------|\n${rows}\n`;
}

/** Todos os recursos: nome do model → markdown. */
export function buildDocs(schemas: Schema[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of schemas) out[s.name] = buildDocFor(s);
  return out;
}
