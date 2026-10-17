import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDocFor,
  buildJsonSchemas,
  buildOpenApi,
  buildTypes,
  generate,
  importOpenApi,
  summarize,
  toYaml,
  validateLive,
  type EndpointReport,
  type RequestLogEntry,
  type Schema,
} from "@devmock/core";
import {
  devmockDir,
  listSchemas,
  readConfig,
  recordExportHashes,
  staleSinceLastExport,
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

export function doSwitchScenario(root: string, endpoint: string, scenario: string): void {
  const cfg = readConfig(root);
  cfg.activeScenarios = { ...cfg.activeScenarios, [endpoint]: scenario };
  writeFileSync(join(devmockDir(root), "config.json"), `${JSON.stringify(cfg, null, 2)}\n`);
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
  const write = (rel: string, content: string): void => {
    writeFileSync(join(dir, rel), content);
    files.push(rel);
  };
  if (want("OpenAPI JSON")) {
    write("openapi/generated.json", `${JSON.stringify(buildOpenApi(schemas), null, 2)}\n`);
  }
  if (picked === "Tudo" || picked === "OpenAPI YAML") {
    write("openapi/generated.yaml", toYaml(buildOpenApi(schemas)));
  }
  if (want("JSON Schema")) {
    write("openapi/schemas.json", `${JSON.stringify(buildJsonSchemas(schemas), null, 2)}\n`);
  }
  if (want("TypeScript")) {
    write("docs/types.ts", buildTypes(schemas));
  }
  if (want("Markdown")) {
    for (const s of schemas) write(`docs/${s.name.toLowerCase()}.md`, buildDocFor(s));
  }
  recordExportHashes(root, schemas);
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
): Promise<{ reports: EndpointReport[]; total: { compatible: number; warnings: number; breaking: number } }> {
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
