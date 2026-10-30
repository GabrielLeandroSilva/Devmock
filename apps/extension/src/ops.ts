import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDocFor,
  buildHtmlDocs,
  buildJsonSchemas,
  buildOpenApi,
  buildTypes,
  generate,
  importOpenApi,
  summarize,
  toYaml,
  validateLive,
  validateSchema,
  type ArtifactKey,
  type DetectResult,
  type EndpointReport,
  type RequestLogEntry,
  type Schema,
} from "@devmock/core";
import { detectProject } from "./detect.js";
import {
  devmockDir,
  listSchemas,
  readConfig,
  recordExportHashes,
  staleSinceLastExport,
  writeConfig,
} from "./project.js";

/** Operações dos comandos, sem vscode — testáveis no host com fs real. */

export function doGeneratePreview(
  root: string,
  schemaName: string,
  records = 20,
): Record<string, unknown>[] {
  const schema = findSchema(root, schemaName);
  return generate(schema, records, readConfig(root).seedDefault);
}

export function doSaveFakeData(
  root: string,
  schemaName: string,
  records: number,
): { file: string; count: number; seed: number | string } {
  const schema = findSchema(root, schemaName);
  const seed = readConfig(root).seedDefault;
  const rows = generate(schema, records, seed);
  const dir = join(devmockDir(root), "docs", "examples");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${schema.name.toLowerCase()}.json`);
  writeFileSync(file, `${JSON.stringify(rows, null, 2)}\n`);
  return { file, count: rows.length, seed };
}

export function doSwitchScenarios(root: string, endpoints: string[], scenario: string): number {
  const unique = [...new Set(endpoints)];
  if (unique.length === 0) return 0;
  const cfg = readConfig(root);
  cfg.activeScenarios = { ...cfg.activeScenarios };
  for (const endpoint of unique) cfg.activeScenarios[endpoint] = scenario;
  writeConfig(root, cfg);
  return unique.length;
}

export function doSwitchScenario(root: string, endpoint: string, scenario: string): void {
  doSwitchScenarios(root, [endpoint], scenario);
}

export interface ExportResult {
  files: string[];
  stale: string[];
}

export function doExport(root: string, picked: string): ExportResult {
  const schemas = listSchemas(root);
  if (schemas.length === 0) throw new Error("DevMock: nenhum Schema válido.");
  const want = (name: string): boolean => picked === "Tudo" || picked.startsWith(name);
  const dir = devmockDir(root);
  mkdirSync(join(dir, "openapi"), { recursive: true });
  mkdirSync(join(dir, "docs"), { recursive: true });
  const stale = staleSinceLastExport(root, schemas);
  const files: string[] = [];
  const artifacts = new Set<ArtifactKey>();
  const write = (rel: string, content: string): void => {
    writeFileSync(join(dir, rel), content);
    files.push(rel);
  };
  if (want("OpenAPI JSON")) {
    write("openapi/generated.json", `${JSON.stringify(buildOpenApi(schemas), null, 2)}\n`);
    artifacts.add("openapi");
  }
  if (picked === "Tudo" || picked === "OpenAPI YAML") {
    write("openapi/generated.yaml", toYaml(buildOpenApi(schemas)));
    artifacts.add("openapi");
  }
  if (want("JSON Schema")) {
    write("openapi/schemas.json", `${JSON.stringify(buildJsonSchemas(schemas), null, 2)}\n`);
    artifacts.add("jsonSchema");
  }
  if (want("TypeScript")) {
    write("docs/types.ts", buildTypes(schemas));
    artifacts.add("types");
  }
  if (want("Markdown")) {
    for (const s of schemas) write(`docs/${s.name.toLowerCase()}.md`, buildDocFor(s));
    artifacts.add("markdown");
  }
  if (want("HTML Docs")) {
    write("docs/index.html", buildHtmlDocs(schemas));
    artifacts.add("html");
  }
  recordExportHashes(root, schemas, [...artifacts]);
  return { files, stale };
}

export interface ImportResult {
  created: string[];
  skipped: string[];
  warnings: string[];
}

export async function doImportContent(
  root: string,
  content: string,
  overwrite: boolean,
): Promise<ImportResult> {
  const imported = await importOpenApi(content);
  const dir = join(devmockDir(root), "schemas");
  mkdirSync(dir, { recursive: true });
  const created: string[] = [];
  const skipped: string[] = [];
  for (const s of imported.schemas) {
    const target = join(dir, `${s.name.toLowerCase()}.json`);
    if (existsSync(target) && !overwrite) {
      skipped.push(s.name);
      continue;
    }
    writeFileSync(target, `${JSON.stringify(s, null, 2)}\n`);
    created.push(s.name);
  }
  return { created, skipped, warnings: imported.warnings };
}

export async function doValidate(
  root: string,
  baseUrl: string,
): Promise<{ reports: EndpointReport[]; total: ReturnType<typeof summarize> }> {
  const schemas = listSchemas(root);
  if (schemas.length === 0) throw new Error("DevMock: nenhum Schema válido.");
  const reports = await validateLive(schemas, baseUrl);
  return { reports, total: summarize(reports) };
}

function findSchema(root: string, schemaName: string): Schema {
  const schema = listSchemas(root).find((s) => s.name.toLowerCase() === schemaName.toLowerCase());
  if (!schema) throw new Error(`DevMock: schema "${schemaName}" não encontrado.`);
  return schema;
}

/** Formata uma entrada de log para o OutputChannel (PRD-02 logs com body truncado). */
export function formatLogEntry(l: RequestLogEntry): string[] {
  const lines = [
    `${l.method.padEnd(6)} ${l.route.padEnd(24)} ${l.status} ${l.ms}ms [${l.scenario}]`,
  ];
  const mark = l.truncated ? " …(truncado)" : "";
  if (l.requestBody) lines.push(`  → ${l.requestBody}${mark}`);
  if (l.responseBody) lines.push(`  ← ${l.responseBody}${mark}`);
  return lines;
}

/** Aplica `errorRate` (0–100) no `config.json` e devolve o valor aplicado. */
export function doSetErrorRate(root: string, value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error("DevMock: errorRate deve ser um inteiro entre 0 e 100.");
  }
  writeConfig(root, { ...readConfig(root), errorRate: value });
  return value;
}

/** Nome do cenário ativo de uma rota ("Default" quando não há). */
export function scenarioOf(
  activeScenarios: Record<string, string> | undefined,
  route: string,
): string {
  return activeScenarios?.[route] ?? "Default";
}

/** URL do navegador para uma rota GET coleção; `undefined` se não abrir (ex.: `:id`). */
export function endpointUrl(port: number, route: string): string | undefined {
  if (!route.startsWith("GET ")) return undefined;
  const path = route.slice(4);
  if (path.includes(":id")) return undefined;
  return `http://localhost:${port}${path}?page=1&limit=5`;
}

/** Detect from project (PRD-09): varre o projeto e sugere Schemas/endpoints. */
export function doDetect(root: string): DetectResult {
  return detectProject(root);
}

/** Cria os Schemas detectados (valida; pula existentes). */
export function doCreateDetectedSchemas(
  root: string,
  schemas: Schema[],
  overwrite = false,
): { created: string[]; skipped: string[]; warnings: string[] } {
  const dir = join(devmockDir(root), "schemas");
  mkdirSync(dir, { recursive: true });
  const created: string[] = [];
  const skipped: string[] = [];
  const warnings: string[] = [];
  // refs entre os schemas do lote (e os já existentes) são válidas.
  const known = [...new Set([...listSchemas(root).map((s) => s.name), ...schemas.map((s) => s.name)])];
  for (const s of schemas) {
    const errors = validateSchema(s, known).filter((d) => d.severity === "error");
    if (errors.length > 0) {
      warnings.push(`${s.name}: inválido — ${errors.map((e) => e.message).join("; ")}`);
      continue;
    }
    const target = join(dir, `${s.name.toLowerCase()}.json`);
    if (existsSync(target) && !overwrite) {
      skipped.push(s.name);
      continue;
    }
    writeFileSync(target, `${JSON.stringify(s, null, 2)}\n`);
    created.push(s.name);
  }
  return { created, skipped, warnings };
}
