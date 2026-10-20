import { generate } from "../generators/index.js";
import type { Schema } from "../types.js";

/**
 * Exemplo do envelope paginado (`Response 200`) com **1 registro real** e
 * determinístico. Substitui o antigo placeholder `"data": "Model[]"`, que
 * parecia JSON inválido na documentação.
 */
export function paginatedExampleJson(schema: Schema): string {
  const [row] = generate(schema, 1, 12345);
  const payload = {
    data: row ? [row] : [],
    total: row ? 1 : 0,
    page: 1,
    limit: 20,
  };
  return JSON.stringify(payload, null, 2);
}
