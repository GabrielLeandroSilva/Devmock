import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_CONFIG,
  loadSchemas,
  mergeExportHashes,
  staleSchemas,
  type ArtifactKey,
  type ExportHashes,
  type Schema,
} from "@devmock/core";

/** Helpers de projeto .devmock/ — puros (fs + Core), sem vscode. Testáveis no host. */

export function devmockDir(root: string): string {
  return join(root, ".devmock");
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function listSchemas(root: string): Schema[] {
  const dir = join(devmockDir(root), "schemas");
  if (!existsSync(dir)) return [];
  try {
    return loadSchemas(dir);
  } catch {
    return [];
  }
}

export function readConfig(root: string): typeof DEFAULT_CONFIG {
  try {
    return { ...DEFAULT_CONFIG, ...readJson<Record<string, unknown>>(join(devmockDir(root), "config.json")) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function writeConfig(root: string, cfg: unknown): void {
  writeFileSync(join(devmockDir(root), "config.json"), `${JSON.stringify(cfg, null, 2)}\n`);
}

export const HASHES_FILE = ".hashes.json";

function readExportHashes(root: string): ExportHashes | undefined {
  try {
    return readJson<ExportHashes>(join(devmockDir(root), "openapi", HASHES_FILE));
  } catch {
    return undefined;
  }
}

/** Schemas com o contrato desatualizado (qualquer artefato não sincronizado). */
export function staleSinceLastExport(root: string, schemas: Schema[]): string[] {
  return staleSchemas(schemas, readExportHashes(root));
}

/** Registra o hash do Schema apenas para os artefatos exportados (M4). */
export function recordExportHashes(root: string, schemas: Schema[], artifacts: ArtifactKey[]): void {
  const merged = mergeExportHashes(readExportHashes(root), schemas, artifacts);
  writeFileSync(join(devmockDir(root), "openapi", HASHES_FILE), `${JSON.stringify(merged, null, 2)}\n`);
}

export function readScenarios(root: string): Record<string, Record<string, never>> {
  const out: Record<string, Record<string, never>> = {};
  const dir = join(devmockDir(root), "scenarios");
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    try {
      const file = readJson<Record<string, Record<string, never>>>(join(dir, f));
      for (const [endpoint, map] of Object.entries(file)) out[endpoint] = { ...(out[endpoint] ?? {}), ...map };
    } catch {
      // Arquivo inválido: ignora (o validador do Core acusa no generate/export).
    }
  }
  return out;
}
