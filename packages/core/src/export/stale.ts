import { createHash } from "node:crypto";
import type { Schema } from "../types.js";

/** JSON canônico (keys ordenadas) para hash estável. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * Hash do Schema para o staleDetector (05-Integracoes):
 * compara com o hash gravado no export e avisa "artefato desatualizado".
 */
export function hashSchema(schema: Schema): string {
  return createHash("sha256").update(canonical(schema)).digest("hex").slice(0, 16);
}

export function isStale(schema: Schema, exportedHash: string): boolean {
  return hashSchema(schema) !== exportedHash;
}
