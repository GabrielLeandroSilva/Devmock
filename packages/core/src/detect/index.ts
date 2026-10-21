import type { Schema, SchemaField } from "../types.js";

/**
 * Detect from project (PRD-09): lê fontes do projeto e **propõe** Schemas
 * (interfaces/tipos TS) e endpoints (chamadas HTTP). Nunca grava nada.
 */

export interface ProjectFile {
  path: string;
  content: string;
}

export interface DetectedEndpoint {
  method: string;
  path: string;
}

export interface DetectResult {
  schemas: Schema[];
  endpoints: DetectedEndpoint[];
  warnings: string[];
}

const DECL = /(?:^|\n)\s*(?:export\s+)?(?:interface|type)\s+([A-Za-z_$][\w$]*)\s*(?:=\s*)?\{/g;
const FIELD = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*(\?)?\s*:\s*([^;]+);?\s*$/;
/** Clientes HTTP reconhecidos (T2): ordem importa — o mais específico primeiro. */
const CLIENTS = "httpClient|https?|axios|api|client|ky|got|request";
const CALL = new RegExp(
  "\\b(?:" +
    CLIENTS +
    ")\\s*\\.\\s*(get|post|put|patch|delete)\\s*(?:<[^<>()]*>)?\\s*\\(\\s*[\"'`]([^\"'`]+)[\"'`]",
  "g",
);
/** Config-object: `axios({ url, method })`, `axios.request({…})`, `request({…})`. */
const CONFIG = /\b(?:axios|request)\s*(?:\.\s*request\s*)?\(\s*\{([^}]*)\}/g;
const URL_PROP = /\burl\s*:\s*['"`]([^'"`]+)['"`]/;
const METHOD_PROP = /\bmethod\s*:\s*['"`](\w+)['"`]/;
const FETCH = /\bfetch\s*\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*\{([^}]*)\})?/g;
const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

function collectDeclarations(content: string): { name: string; body: string }[] {
  const out: { name: string; body: string }[] = [];
  DECL.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DECL.exec(content))) {
    const open = DECL.lastIndex - 1;
    let depth = 0;
    let i = open;
    for (; i < content.length; i++) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    if (i < content.length) out.push({ name: m[1], body: content.slice(open + 1, i) });
  }
  return out;
}

function normalizePath(p: string): string {
  let clean = p.split("?")[0].trim();
  // Base embutida no template: `${BASE}/users` → `/users`.
  clean = clean.replace(/^(?:\$\{[^}]*\})+/, "");
  // URL absoluta: guarda só o path (`https://api.x/users` → `/users`).
  if (/^https?:\/\//i.test(clean)) {
    try {
      return new URL(clean).pathname || "/";
    } catch {
      // URL inválida: segue como texto.
    }
  }
  return clean.startsWith("/") ? clean : `/${clean}`;
}

function methodOf(raw: string | undefined, fallback = "GET"): string {
  const m = (raw ?? fallback).toUpperCase();
  return METHODS.has(m) ? m : fallback;
}

function parseFieldType(
  raw: string,
  known: Set<string>,
  warnings: string[],
  where: string,
): Pick<SchemaField, "type" | "values" | "ref"> | undefined {
  const parts = raw
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s && s !== "null" && s !== "undefined");
  if (parts.length === 0) return undefined;

  if (parts.every((p) => /^(['"]).*\1$/.test(p))) {
    return { type: "enum", values: parts.map((p) => p.slice(1, -1)) };
  }
  if (parts.length > 1) {
    warnings.push(`${where}: união não suportada — campo ignorado.`);
    return undefined;
  }
  const p = parts[0];
  if (p === "string") return { type: "string" };
  if (p === "number") return { type: "number" };
  if (p === "boolean") return { type: "boolean" };
  if (p === "Date") return { type: "date" };
  if (known.has(p)) return { type: "ref", ref: p };
  if (p.endsWith("[]") || /^Array\s*</.test(p)) {
    warnings.push(`${where}: array não suportado no Detect — campo ignorado.`);
    return undefined;
  }
  warnings.push(`${where}: tipo "${p}" não mapeado — campo ignorado.`);
  return undefined;
}

function toSchema(
  name: string,
  body: string,
  known: Set<string>,
  warnings: string[],
  path: string,
): Schema | undefined {
  const fields: SchemaField[] = [];
  for (const raw of body.split(/[;\n]/)) {
    const t = raw.trim();
    if (!t || t.startsWith("//") || t.startsWith("/*") || t.startsWith("*")) continue;
    if (/^\[.*\]\s*:/.test(t)) {
      warnings.push(`${path}: ${name} — index signature ignorada.`);
      continue;
    }
    if (/^\w+\s*\(.*\)\s*:/.test(t)) {
      warnings.push(`${path}: ${name} — método ignorado.`);
      continue;
    }
    const m = FIELD.exec(t);
    if (!m) continue;
    const [, fieldName, optional, rawType] = m;
    const parsed = parseFieldType(rawType, known, warnings, `${path}:${name}.${fieldName}`);
    if (!parsed) continue;
    fields.push({ name: fieldName, ...parsed, required: !optional });
  }
  if (fields.length === 0) return undefined;
  if (!fields.some((f) => f.required)) {
    fields[0].required = true;
    warnings.push(`${path}: ${name} sem campo obrigatório; "${fields[0].name}" marcado como required.`);
  }
  return { name, fields };
}

function detectEndpoints(content: string): DetectedEndpoint[] {
  const out: DetectedEndpoint[] = [];
  CALL.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CALL.exec(content))) {
    out.push({ method: m[1].toUpperCase(), path: normalizePath(m[2]) });
  }
  FETCH.lastIndex = 0;
  while ((m = FETCH.exec(content))) {
    out.push({ method: methodOf(m[2] ? METHOD_PROP.exec(m[2])?.[1] : undefined), path: normalizePath(m[1]) });
  }
  CONFIG.lastIndex = 0;
  while ((m = CONFIG.exec(content))) {
    const url = URL_PROP.exec(m[1])?.[1];
    if (!url) continue;
    out.push({ method: methodOf(METHOD_PROP.exec(m[1])?.[1]), path: normalizePath(url) });
  }
  return out;
}

/** Detecta Schemas e endpoints a partir dos arquivos do projeto (determinístico). */
export function detectFromProject(files: ProjectFile[]): DetectResult {
  const warnings: string[] = [];
  const ordered = [...files].sort((a, b) => a.path.localeCompare(b.path));

  const decls: { name: string; body: string; path: string }[] = [];
  for (const f of ordered) {
    for (const d of collectDeclarations(f.content)) decls.push({ ...d, path: f.path });
  }
  const known = new Set(decls.map((d) => d.name));

  const schemas: Schema[] = [];
  const seen = new Set<string>();
  for (const d of decls) {
    if (seen.has(d.name)) continue;
    const schema = toSchema(d.name, d.body, known, warnings, d.path);
    if (schema) {
      schemas.push(schema);
      seen.add(d.name);
    }
  }

  const endpoints: DetectedEndpoint[] = [];
  const seenEp = new Set<string>();
  for (const f of ordered) {
    for (const e of detectEndpoints(f.content)) {
      const key = `${e.method} ${e.path}`;
      if (!seenEp.has(key)) {
        seenEp.add(key);
        endpoints.push(e);
      }
    }
  }

  return { schemas, endpoints, warnings };
}
