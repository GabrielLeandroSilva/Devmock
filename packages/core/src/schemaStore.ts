import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Schema } from "./types.js";

/**
 * Carrega schemas/*.json ordenando keys para diff estável no Git
 * (01-Core-Model: schemaStore nunca escreve, só lê).
 */
export function loadSchemas(dir: string): Schema[] {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  return files.map((f) => {
    const raw = JSON.parse(readFileSync(join(dir, f), "utf8")) as Schema;
    return sortKeys(raw) as Schema;
  });
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value).sort()) {
      out[k] = sortKeys((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}
