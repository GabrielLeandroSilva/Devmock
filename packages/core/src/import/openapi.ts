import { parse as parseYaml } from "yaml";
import type { Schema, SchemaField } from "../types.js";
import { validateSchema } from "../validator.js";

export interface ImportResult {
  schemas: Schema[];
  warnings: string[];
}

interface Ctx {
  warnings: string[];
  extra: Schema[];
}

/**
 * Importa OpenAPI 3.x → Schemas DevMock (PRD-06).
 * Aceita objeto, string JSON ou string YAML. Nunca inventa campo:
 * o que não mapeia 1:1 vira warning.
 */
export async function importOpenApi(input: string | Record<string, unknown>): Promise<ImportResult> {
  const api = await toApiObject(input);
  const version = typeof api.openapi === "string" ? api.openapi : "";
  if (!version.startsWith("3.")) {
    throw new Error(
      `DevMock: especificação não é OpenAPI 3.x (openapi: "${version || "ausente"}"). Só OpenAPI 3 é suportado.`,
    );
  }

  const ctx: Ctx = { warnings: [], extra: [] };
  const components = (api.components ?? {}) as Record<string, unknown>;
  const definitions = (components.schemas ?? {}) as Record<string, unknown>;

  const schemas: Schema[] = [];
  for (const [name, def] of Object.entries(definitions)) {
    schemas.push(convertSchema(name, def, definitions, ctx));
  }
  schemas.push(...ctx.extra);

  // Regra da âncora (PRD-01): specs reais raramente declaram required —
  // marca o primeiro campo e avisa, em vez de descartar o Schema.
  for (const s of schemas) {
    if (s.fields.length > 0 && !s.fields.some((f) => f.required)) {
      s.fields[0].required = true;
      ctx.warnings.push(`Schema "${s.name}": nenhum required declarado — "${s.fields[0].name}" marcado como âncora.`);
    }
  }

  const known = schemas.map((s) => s.name);
  collectPathWarnings(api, known, ctx);

  // Rede de segurança: só sai daqui Schema válido (PRD-06 RF-03).
  const valid: Schema[] = [];
  for (const s of schemas) {
    const errors = validateSchema(s, known).filter((d) => d.severity === "error");
    if (errors.length > 0) {
      ctx.warnings.push(`Schema "${s.name}" descartado: ${errors[0].field}: ${errors[0].message}`);
      continue;
    }
    valid.push(s);
  }
  return { schemas: valid, warnings: [...new Set(ctx.warnings)] };
}

async function toApiObject(input: string | Record<string, unknown>): Promise<Record<string, unknown>> {
  if (typeof input !== "string") return input;
  const trimmed = input.trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      throw new Error("DevMock: string JSON inválida — verifique o conteúdo e tente de novo.");
    }
  }
  try {
    const parsed: unknown = parseYaml(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("yaml-vazio");
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    if (err instanceof Error && err.message === "yaml-vazio") {
      throw new Error("DevMock: YAML sem objeto raiz — verifique o conteúdo e tente de novo.");
    }
    throw new Error("DevMock: não foi possível ler como OpenAPI (YAML inválido?).");
  }
}

function convertSchema(
  name: string,
  def: unknown,
  definitions: Record<string, unknown>,
  ctx: Ctx,
): Schema {
  const node = (def ?? {}) as Record<string, unknown>;
  const props = (node.properties ?? {}) as Record<string, unknown>;
  const required = new Set(
    (Array.isArray(node.required) ? node.required : []).filter((r): r is string => typeof r === "string"),
  );
  const fields: SchemaField[] = [];
  for (const [propName, propDef] of Object.entries(props)) {
    const converted = convertProp(name, propName, propDef, definitions, ctx);
    for (const f of converted) {
      if (required.has(f.name)) f.required = true;
      fields.push(f);
    }
  }
  return { name, fields };
}

function convertProp(
  owner: string,
  propName: string,
  def: unknown,
  definitions: Record<string, unknown>,
  ctx: Ctx,
): SchemaField[] {
  const node = (def ?? {}) as Record<string, unknown>;
  const at = `${owner}.${propName}`;

  if (typeof node.$ref === "string") {
    const target = refTarget(node.$ref, definitions);
    if (!target) {
      ctx.warnings.push(`${at}: $ref remoto/externo "${node.$ref}" virado string (não resolvido).`);
      return [{ name: propName, type: "string" }];
    }
    return [{ name: propName, type: "ref", ref: target }];
  }

  if (node.oneOf !== undefined || node.anyOf !== undefined) {
    ctx.warnings.push(`${at}: oneOf/anyOf não suportado — virado string.`);
    return [{ name: propName, type: "string" }];
  }

  const type = node.type as string | undefined;

  if (Array.isArray(node.enum)) {
    const values = node.enum.map((v) => String(v));
    if (node.enum.some((v) => typeof v !== "string")) {
      ctx.warnings.push(`${at}: enum não-string convertido para string.`);
    }
    return [{ name: propName, type: "enum", values }];
  }

  switch (type) {
    case "integer":
    case "number":
      return [{ name: propName, type: "number" }];
    case "boolean":
      return [{ name: propName, type: "boolean" }];
    case "string": {
      // Formatos com tipo próprio no modelo viram o tipo (mais fiel que hint).
      if (node.format === "uuid") return [{ name: propName, type: "uuid" }];
      if (node.format === "date") return [{ name: propName, type: "date" }];
      if (node.format === "date-time") return [{ name: propName, type: "datetime" }];
      const field: SchemaField = { name: propName, type: "string" };
      if (node.format === "email") field.generator = "email";
      return [field];
    }
    case "array": {
      const items = (node.items ?? {}) as Record<string, unknown>;
      if (typeof items.$ref === "string") {
        const target = refTarget(items.$ref, definitions);
        if (target) return [{ name: propName, type: "array", ref: target }];
        ctx.warnings.push(`${at}: items com $ref remoto virado array de string.`);
        return [{ name: propName, type: "array" }];
      }
      if (items.type === "object") {
        const nested = nestedName(owner, propName);
        ctx.extra.push(convertSchema(nested, items, definitions, ctx));
        return [{ name: propName, type: "array", ref: nested }];
      }
      return [{ name: propName, type: "array" }];
    }
    case "object": {
      const nested = nestedName(owner, propName);
      ctx.extra.push(convertSchema(nested, node, definitions, ctx));
      ctx.warnings.push(
        `${at}: objeto inline gerou Schema "${nested}" (mock gera uuid para ref aninhada — limitação conhecida).`,
      );
      return [{ name: propName, type: "ref", ref: nested }];
    }
    default: {
      if (node.properties !== undefined) {
        const nested = nestedName(owner, propName);
        ctx.extra.push(convertSchema(nested, node, definitions, ctx));
        ctx.warnings.push(
          `${at}: sem type explícito, tratado como objeto → Schema "${nested}" (mock gera uuid para ref aninhada).`,
        );
        return [{ name: propName, type: "ref", ref: nested }];
      }
      ctx.warnings.push(`${at}: tipo "${String(type ?? "ausente")}" desconhecido — virado string.`);
      return [{ name: propName, type: "string" }];
    }
  }
}

/** Nome do schema referenciado, ou undefined se $ref externo/remoto. */
function refTarget(ref: string, definitions: Record<string, unknown>): string | undefined {
  if (!ref.startsWith("#/")) return undefined;
  const last = ref.split("/").pop();
  if (!last || !(last in definitions)) return undefined;
  return last;
}

/** Nome do schema referenciado, ou undefined se $ref externo/remoto. */

function nestedName(owner: string, prop: string): string {
  const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
  return `${cap(owner)}${cap(prop)}`;
}

/** Avisa sobre $refs de paths que não apontam para schemas conhecidos. */
function collectPathWarnings(
  api: Record<string, unknown>,
  known: string[],
  ctx: Ctx,
): void {
  const paths = (api.paths ?? {}) as Record<string, unknown>;
  for (const [path, item] of Object.entries(paths)) {
    const ops = (item ?? {}) as Record<string, unknown>;
    for (const [method, op] of Object.entries(ops)) {
      if (method.startsWith("x-") || typeof op !== "object" || op === null) continue;
      const text = JSON.stringify(op);
      for (const m of text.matchAll(/"\$ref"\s*:\s*"([^"]+)"/g)) {
        const ref = m[1];
        if (ref.startsWith("#/components/schemas/")) {
          const name = ref.split("/").pop() ?? "";
          if (!known.includes(name)) {
            ctx.warnings.push(`${method.toUpperCase()} ${path}: referencia Schema desconhecido "${name}".`);
          }
        } else if (!ref.startsWith("#/")) {
          ctx.warnings.push(`${method.toUpperCase()} ${path}: $ref externo "${ref}" não resolvido.`);
        }
      }
    }
  }
}
