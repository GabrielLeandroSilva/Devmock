import { defaultRouteSummary, schemaRoutes } from "../mock/routes.js";
import type { Schema, SchemaField, SchemaRoute } from "../types.js";
import { paginatedExampleJson } from "./example.js";

function fieldLabel(f: SchemaField): string {
  if (f.type === "enum") return (f.values ?? []).join(" | ");
  if (f.type === "number" && f.format === "BRL") return "number (BRL)";
  if (f.type === "ref" || f.type === "array") return f.ref ? `${f.type} → ${f.ref}` : f.type;
  return f.type;
}

function routeSection(schema: Schema, route: SchemaRoute): string {
  const label = `${String(route.method).toUpperCase()} ${route.path}`;
  const summary = route.summary ?? defaultRouteSummary(route, schema.name);
  if (route.kind === "list") {
    return `## ${label}

${summary}

### Query Parameters

| Nome | Tipo |
|------|------|
| page | number |
| limit | number |

### Response 200

\`\`\`json
${paginatedExampleJson(schema)}
\`\`\`
`;
  }
  const status =
    route.kind === "create"
      ? 201
      : route.kind === "delete"
        ? 204
        : route.kind === "custom"
          ? (route.response?.status ?? 200)
          : 200;
  const example =
    route.kind === "custom" &&
    route.response &&
    route.response.body !== undefined &&
    status !== 204 &&
    status !== 304
      ? `

\`\`\`json
${JSON.stringify(route.response.body, null, 2)}
\`\`\``
      : "";
  const summaryBlock = summary === label ? "" : `\n\n${summary}`;
  return `## ${label}${summaryBlock}

### Response ${status}${example}
`;
}

/** Markdown por recurso no template do §15 (PRD-05 RF-01; v1.5.0 com rotas custom). */
export function buildDocFor(schema: Schema): string {
  const rows = schema.fields
    .map((f) => `| ${f.name} | ${fieldLabel(f)} | ${f.required ? "sim" : "não"} |`)
    .join("\n");
  const sections = schemaRoutes(schema)
    .map((route) => routeSection(schema, route))
    .join("\n");
  return `# ${schema.name} API

${sections}
### Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
${rows}
`;
}

/** Todos os recursos: nome do model → markdown. */
export function buildDocs(schemas: Schema[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of schemas) out[s.name] = buildDocFor(s);
  return out;
}
