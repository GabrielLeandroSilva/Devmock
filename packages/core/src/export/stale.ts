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

/** Artefatos exportáveis, chaveados no `.hashes.json`. */
export type ArtifactKey = "openapi" | "jsonSchema" | "types" | "markdown" | "html";

/** Conjunto completo do contrato: um artefato ausente conta como desatualizado. */
export const ALL_ARTIFACTS: ArtifactKey[] = ["openapi", "jsonSchema", "types", "markdown", "html"];

/** Hash do Schema no momento em que cada artefato foi gerado: `{ schema: { artefato: hash } }`. */
export type ExportHashes = Record<string, Partial<Record<ArtifactKey, string>>>;

/**
 * Registra, por artefato, o hash do Schema que o gerou. Só toca os artefatos
 * informados — um export parcial não marca os demais como sincronizados (M4).
 */
export function mergeExportHashes(
  prev: ExportHashes | undefined,
  schemas: Schema[],
  artifacts: ArtifactKey[],
): ExportHashes {
  const out: ExportHashes = { ...(prev ?? {}) };
  for (const s of schemas) {
    const entry = { ...(out[s.name] ?? {}) };
    const h = hashSchema(s);
    for (const a of artifacts) entry[a] = h;
    out[s.name] = entry;
  }
  return out;
}

/**
 * Schemas com o contrato desatualizado: qualquer artefato esperado sem hash
 * registrado (nunca gerado) OU com hash diferente do Schema atual.
 * Sem registro algum (nada exportado) → [] (nada a avisar).
 */
export function staleSchemas(schemas: Schema[], stored: ExportHashes | undefined): string[] {
  if (!stored) return [];
  return schemas
    .filter((s) => {
      const entry = stored[s.name] ?? {};
      const current = hashSchema(s);
      return ALL_ARTIFACTS.some((a) => entry[a] !== current);
    })
    .map((s) => s.name);
}
