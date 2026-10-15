import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG, hashSchema, loadSchemas, type Schema } from "@devmock/core";

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

/** Schemas cujo hash mudou desde o último export (vazio = tudo sincronizado). */
export function staleSinceLastExport(root: string, schemas: Schema[]): string[] {
  let stored: Record<string, string> = {};
  try {
    stored = readJson<Record<string, string>>(join(devmockDir(root), "openapi", HASHES_FILE));
  } catch {
    return [];
  }
  return schemas.filter((s) => stored[s.name] !== hashSchema(s)).map((s) => s.name);
}

/** Grava o hash atual de cada Schema após exportar. */
export function recordExportHashes(root: string, schemas: Schema[]): void {
  const hashes: Record<string, string> = {};
  for (const s of schemas) hashes[s.name] = hashSchema(s);
  writeFileSync(join(devmockDir(root), "openapi", HASHES_FILE), `${JSON.stringify(hashes, null, 2)}\n`);
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
