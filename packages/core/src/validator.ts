import type { Diagnostic, HttpMethod, RouteKind, Schema, SchemaRoute } from "./types.js";
import { FIELD_TYPES, HTTP_METHODS, ROUTE_KINDS } from "./constants.js";
import { routeLabel, schemaRoutes } from "./mock/routes.js";

/**
 * Valida um Schema. Retorna diagnósticos com campo + motivo
 * (PRD-01 RF-02). Lista vazia = válido.
 */
export function validateSchema(schema: Schema, knownSchemas: string[] = []): Diagnostic[] {
  const diags: Diagnostic[] = [];

  if (typeof schema.name !== "string" || !schema.name.trim()) {
    diags.push({ field: "name", message: "Schema precisa de um nome.", severity: "error" });
    return diags;
  }
  if (!Array.isArray(schema.fields) || schema.fields.length === 0) {
    diags.push({ field: "fields", message: "Schema precisa de ao menos um campo.", severity: "error" });
    return diags;
  }

  const names = new Set<string>();
  let hasRequired = false;

  for (const f of schema.fields) {
    if (!f || typeof f !== "object") {
      diags.push({ field: "(sem nome)", message: "Campo inválido.", severity: "error" });
      continue;
    }
    if (typeof f.name !== "string" || !f.name.trim()) {
      diags.push({ field: "(sem nome)", message: "Campo sem nome.", severity: "error" });
      continue;
    }
    if (names.has(f.name)) {
      diags.push({ field: f.name, message: `Campo duplicado: "${f.name}".`, severity: "error" });
    }
    names.add(f.name);
    if (f.required) hasRequired = true;

    if (!FIELD_TYPES.includes(f.type)) {
      diags.push({ field: f.name, message: `Tipo inválido: "${f.type}".`, severity: "error" });
      continue;
    }
    if (f.type === "enum") {
      if (!Array.isArray(f.values) || f.values.length === 0) {
        diags.push({ field: f.name, message: "Enum precisa de ao menos um valor.", severity: "error" });
      }
    }
    if ((f.type === "ref" || f.type === "array") && f.ref) {
      if (!knownSchemas.includes(f.ref)) {
        diags.push({
          field: f.name,
          message: `Referência quebrada: "${f.ref}" não é um Schema conhecido.`,
          severity: "error",
        });
      }
    }
    if (f.type !== "ref" && f.type !== "array" && f.ref && !f.generator) {
      diags.push({
        field: f.name,
        message: `"ref" só faz sentido para tipos ref/array.`,
        severity: "warning",
      });
    }
  }

  if (!hasRequired) {
    diags.push({
      field: "(schema)",
      message: "Todo Schema precisa de ao menos 1 campo required (âncora de identidade).",
      severity: "error",
    });
  }

  if (schema.routes !== undefined) {
    if (!Array.isArray(schema.routes)) {
      diags.push({
        field: "routes",
        message: "routes deve ser uma lista de rotas.",
        severity: "error",
      });
    } else if (schema.routes.length === 0) {
      diags.push({
        field: "routes",
        message: "routes precisa ter ao menos 1 rota (remova o campo para usar o CRUD padrão).",
        severity: "error",
      });
    } else {
      diags.push(...validateRouteList(schema.routes));
    }
  }

  return diags;
}

const ROUTE_METHOD_BY_KIND: Partial<Record<RouteKind, HttpMethod>> = {
  list: "GET",
  item: "GET",
  create: "POST",
  update: "PUT",
  patch: "PATCH",
  delete: "DELETE",
};

const NEEDS_PARAM: RouteKind[] = ["item", "update", "patch", "delete"];

function validatePath(path: string): string | undefined {
  if (!path) return "path é obrigatório.";
  if (/\s/.test(path)) return "path não pode ter espaço.";
  if (path.includes("%")) return "path não pode ter % (use o caractere literal).";
  if (path === "/") return "path não pode ser a raiz (/).";
  if (!path.startsWith("/")) return "path precisa começar com /.";
  if (path.endsWith("/")) return "path não pode terminar com /.";
  if (path.includes("//")) return "path não pode ter //.";
  if (/[?#]/.test(path)) return "path não pode ter query ou hash.";
  return undefined;
}

/** Shape da rota (params viram `:`) para detectar ambiguidade de matching. */
function routeShapeKey(route: SchemaRoute): string {
  const method = String(route.method ?? "").toUpperCase();
  const path = typeof route.path === "string" ? route.path.toLowerCase() : "";
  const shape = path
    .split("/")
    .map((segment) => (segment.startsWith(":") ? ":" : segment))
    .join("/");
  return `${method} ${shape}`;
}

function validateRouteList(routes: SchemaRoute[]): Diagnostic[] {
  const diags: Diagnostic[] = [];
  const seen = new Set<string>();

  routes.forEach((route, i) => {
    const field = `routes[${i}]`;
    if (!route || typeof route !== "object") {
      diags.push({ field, message: "Rota inválida.", severity: "error" });
      return;
    }

    const method = String(route.method ?? "").toUpperCase() as HttpMethod;
    if (!HTTP_METHODS.includes(method)) {
      diags.push({ field, message: `Método inválido: "${route.method}".`, severity: "error" });
    }

    const kind = route.kind as RouteKind;
    if (!ROUTE_KINDS.includes(kind)) {
      diags.push({ field, message: `kind inválido: "${route.kind}".`, severity: "error" });
    } else {
      const expected = ROUTE_METHOD_BY_KIND[kind];
      if (expected && method !== expected) {
        diags.push({
          field,
          message: `${kind} exige ${expected} (recebido ${method || "?"}).`,
          severity: "error",
        });
      }
    }

    const path = typeof route.path === "string" ? route.path : "";
    if (typeof route.path !== "string") {
      diags.push({ field, message: "path deve ser texto.", severity: "error" });
    } else {
      const pathError = validatePath(path);
      if (pathError) diags.push({ field, message: pathError, severity: "error" });
    }

    if (route.response !== undefined) {
      if (!route.response || typeof route.response !== "object" || Array.isArray(route.response)) {
        diags.push({
          field,
          message: "response deve ser um objeto { status?, body? }.",
          severity: "error",
        });
      } else if (route.response.status !== undefined) {
        const status = route.response.status;
        if (!Number.isInteger(status) || status < 200 || status > 599) {
          diags.push({
            field,
            message: "response.status deve ser inteiro entre 200 e 599.",
            severity: "error",
          });
        }
      }
    }
    if (route.summary !== undefined && typeof route.summary !== "string") {
      diags.push({ field, message: "summary deve ser texto.", severity: "error" });
    }

    const params = path.split("/").filter((segment) => segment.startsWith(":"));
    for (const param of params) {
      if (!/^:[A-Za-z_]\w*$/.test(param)) {
        diags.push({
          field,
          message: `Parâmetro inválido: "${param}" (use :nome).`,
          severity: "error",
        });
      }
    }
    if (new Set(params).size !== params.length) {
      diags.push({ field, message: "Parâmetro repetido no path.", severity: "error" });
    }
    if (ROUTE_KINDS.includes(kind) && NEEDS_PARAM.includes(kind) && params.length === 0) {
      diags.push({
        field,
        message: `${kind} exige um parâmetro no path (ex.: :id).`,
        severity: "error",
      });
    }

    const key = routeShapeKey(route);
    if (seen.has(key)) {
      diags.push({ field, message: "Rota duplicada (método + path).", severity: "error" });
    }
    seen.add(key);
  });

  return diags;
}

/** Checa colisões de `method+path` entre Schemas (inclui o CRUD padrão). */
export function validateProject(schemas: Schema[]): Diagnostic[] {
  const diags: Diagnostic[] = [];
  const seen = new Map<string, string>();

  for (const schema of schemas) {
    for (const route of schemaRoutes(schema)) {
      const key = routeShapeKey(route);
      const owner = seen.get(key);
      if (owner !== undefined && owner !== schema.name) {
        diags.push({
          field: `${schema.name}: ${routeLabel(route)}`,
          message: `Rota duplicada com o Schema "${owner}".`,
          severity: "error",
        });
      } else {
        seen.set(key, schema.name);
      }
    }
  }

  return diags;
}
