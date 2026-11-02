import { defaultRouteSummary, schemaRoutes } from "../mock/routes.js";
import type { Schema, SchemaRoute } from "../types.js";
import { fieldToJsonSchema } from "./jsonschema.js";

interface OpenApiDoc {
  openapi: string;
  info: { title: string; version: string; description: string };
  paths: Record<string, unknown>;
  components: { schemas: Record<string, unknown> };
}

function toOpenApiPath(path: string): { path: string; params: string[] } {
  const params: string[] = [];
  const out = path
    .split("/")
    .map((segment) => {
      if (!segment.startsWith(":")) return segment;
      const name = segment.slice(1);
      params.push(name);
      return `{${name}}`;
    })
    .join("/");
  return { path: out, params };
}

function pathParameters(params: string[]): Record<string, unknown>[] {
  return params.map((name) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
}

function listResponse(ref: unknown, name: string): Record<string, unknown> {
  return {
    description: `Returns a list of ${name}.`,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            data: { type: "array", items: ref },
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
          },
        },
      },
    },
  };
}

function operationFor(
  route: SchemaRoute,
  ref: unknown,
  params: string[],
  schema: Schema,
): Record<string, unknown> {
  const summary = route.summary ?? defaultRouteSummary(route, schema.name);
  const parameters = pathParameters(params);
  const requestBody = {
    required: true,
    content: { "application/json": { schema: ref } },
  };

  switch (route.kind) {
    case "list":
      return {
        summary,
        parameters: [
          ...parameters,
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1 } },
        ],
        responses: { "200": listResponse(ref, schema.name) },
      };
    case "item":
      return {
        summary,
        parameters,
        responses: {
          "200": {
            description: `${schema.name} found.`,
            content: { "application/json": { schema: ref } },
          },
          "404": { description: "Not found." },
        },
      };
    case "create":
      return {
        summary,
        parameters,
        requestBody,
        responses: {
          "201": {
            description: `${schema.name} created.`,
            content: { "application/json": { schema: ref } },
          },
        },
      };
    case "update":
    case "patch":
      return {
        summary,
        parameters,
        requestBody,
        responses: {
          "200": {
            description: `${schema.name} updated.`,
            content: { "application/json": { schema: ref } },
          },
          "404": { description: "Not found." },
        },
      };
    case "delete":
      return {
        summary,
        parameters,
        responses: { "204": { description: "Deleted." }, "404": { description: "Not found." } },
      };
    case "custom": {
      const raw = route.response?.status;
      const status =
        Number.isInteger(raw) && (raw as number) >= 200 && (raw as number) <= 599
          ? String(raw)
          : "200";
      const response: Record<string, unknown> = { description: summary };
      const responseBody = route.response?.body;
      if (responseBody !== undefined && status !== "204" && status !== "304") {
        response.content = { "application/json": { example: responseBody } };
      }
      return {
        summary,
        ...(parameters.length > 0 ? { parameters } : {}),
        responses: { [status]: response },
      };
    }
    default:
      return { summary, responses: { "200": { description: summary } } };
  }
}

/**
 * Gera OpenAPI 3.0 válido a partir dos Schemas (PRD-05 RF-02).
 * v1.5.0: paths/operações vêm de `Schema.routes` (custom), com `summary`.
 */
export function buildOpenApi(schemas: Schema[], title = "DevMock API"): OpenApiDoc {
  const paths: Record<string, unknown> = {};
  const components: Record<string, unknown> = {};

  for (const s of schemas) {
    const ref = { $ref: `#/components/schemas/${s.name}` };
    const required = s.fields.filter((f) => f.required).map((f) => f.name);
    const properties: Record<string, unknown> = {};
    for (const f of s.fields) properties[f.name] = fieldToJsonSchema(f);
    components[s.name] = {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
    };

    for (const route of schemaRoutes(s)) {
      const { path, params } = toOpenApiPath(route.path);
      const pathItem = (paths[path] as Record<string, unknown> | undefined) ?? {};
      const method = String(route.method).toLowerCase();
      if (pathItem[method] !== undefined) {
        throw new Error(
          `DevMock: rota duplicada no OpenAPI — ${String(route.method).toUpperCase()} ${path}`,
        );
      }
      pathItem[method] = operationFor(route, ref, params, s);
      paths[path] = pathItem;
    }
  }

  return {
    openapi: "3.0.3",
    info: { title, version: "1.0.0", description: "Generated by DevMock — Schema is the source of truth." },
    paths,
    components: { schemas: components },
  };
}
