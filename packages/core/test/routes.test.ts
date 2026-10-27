import { describe, expect, it } from "vitest";
import { defaultRoutes, listRoute, routeKey, routeLabel, routesFor, schemaRoutes } from "../src/mock/routes.js";
import { validateProject, validateSchema } from "../src/validator.js";
import type { HttpMethod, Schema, SchemaRoute } from "../src/types.js";

const user: Schema = {
  name: "User",
  fields: [{ name: "id", type: "uuid", required: true }],
};

function withRoutes(routes: SchemaRoute[]): Schema {
  return { ...user, routes };
}

function messages(schema: Schema): string[] {
  return validateSchema(schema)
    .filter((d) => d.severity === "error")
    .map((d) => d.message);
}

describe("PRD-02 RF-08 — rotas por Schema (v1.5.0)", () => {
  it("CRUD padrão continua igual quando routes está ausente", () => {
    expect(routesFor(user)).toEqual([
      "GET /users",
      "GET /users/:id",
      "POST /users",
      "PUT /users/:id",
      "PATCH /users/:id",
      "DELETE /users/:id",
    ]);
    expect(defaultRoutes(user).map((r) => r.kind)).toEqual([
      "list",
      "item",
      "create",
      "update",
      "patch",
      "delete",
    ]);
  });

  it("routes presente substitui o CRUD padrão (inclusive rota custom)", () => {
    const schema = withRoutes([
      { method: "GET", path: "/v1/users", kind: "list" },
      { method: "GET", path: "/v1/users/:id", kind: "item" },
      { method: "POST", path: "/auth/login", kind: "custom", response: { status: 200, body: { token: "x" } } },
    ]);
    expect(routesFor(schema)).toEqual(["GET /v1/users", "GET /v1/users/:id", "POST /auth/login"]);
    expect(schemaRoutes(schema)).toHaveLength(3);
    expect(routeKey(schema.routes![2])).toBe("POST /auth/login");
  });

  it("listRoute prioriza kind list e cai no primeiro GET sem parâmetro", () => {
    const listed = withRoutes([
      { method: "GET", path: "/v1/users/:id", kind: "item" },
      { method: "GET", path: "/v1/users", kind: "list" },
    ]);
    expect(listRoute(listed)?.path).toBe("/v1/users");

    const fallback = withRoutes([{ method: "GET", path: "/accounts", kind: "custom" }]);
    expect(listRoute(fallback)?.path).toBe("/accounts");
  });

  it("aceita rotas custom válidas (aninhada, custom, param e response)", () => {
    const schema = withRoutes([
      { method: "GET", path: "/v1/users", kind: "list" },
      { method: "GET", path: "/v1/users/:id", kind: "item", summary: "Detalhe" },
      { method: "POST", path: "/auth/login", kind: "custom", response: { status: 201, body: { ok: true } } },
      { method: "POST", path: "/users/:id/activate", kind: "custom" },
      { method: "DELETE", path: "/users/:id", kind: "delete" },
    ]);
    expect(messages(schema)).toEqual([]);
  });

  it("routes vazio é erro (remova o campo para usar o padrão)", () => {
    expect(messages(withRoutes([]))).toEqual(
      expect.arrayContaining([expect.stringMatching(/ao menos 1 rota/i)]),
    );
    expect(routesFor(withRoutes([]))).toEqual([]);
  });

  it.each([
    ["path sem barra", [{ method: "GET", path: "users", kind: "list" }], /começar com \//],
    ["path vazio", [{ method: "GET", path: "", kind: "list" }], /obrigatório/],
    ["método ausente", [{ path: "/x", kind: "custom" }], /Método inválido/],
    ["raiz", [{ method: "GET", path: "/", kind: "list" }], /raiz/],
    ["barra final", [{ method: "GET", path: "/users/", kind: "list" }], /terminar com \//],
    ["barra dupla", [{ method: "GET", path: "/v1//users", kind: "list" }], /\/\//],
    ["query", [{ method: "GET", path: "/users?x=1", kind: "list" }], /query/],
    ["path com espaço", [{ method: "GET", path: " /users ", kind: "list" }], /espaço/],
    ["kind inválido", [{ method: "GET", path: "/users", kind: "nope" }], /kind inválido/],
    ["método inválido", [{ method: "TRACE", path: "/users", kind: "custom" }], /Método inválido/],
    ["kind x método", [{ method: "GET", path: "/users", kind: "create" }], /create exige POST/],
    [
      "duplicada",
      [
        { method: "GET", path: "/users", kind: "list" },
        { method: "GET", path: "/users", kind: "list" },
      ],
      /duplicada/,
    ],
    ["item sem param", [{ method: "GET", path: "/users", kind: "item" }], /parâmetro/],
    ["param inválido", [{ method: "GET", path: "/users/:1id", kind: "item" }], /Parâmetro inválido/],
    ["param repetido", [{ method: "GET", path: "/users/:id/:id", kind: "item" }], /repetido/],
    ["status inválido", [{ method: "POST", path: "/login", kind: "custom", response: { status: 99 } }], /status/],
    ["response nula", [{ method: "POST", path: "/login", kind: "custom", response: null }], /response/i],
    ["response não-objeto", [{ method: "POST", path: "/login", kind: "custom", response: "x" }], /response/i],
    ["summary inválido", [{ method: "POST", path: "/login", kind: "custom", summary: 42 }], /summary/],
    ["rota nula", [null], /Rota inválida/],
    ["path não-texto", [{ method: "GET", path: 42, kind: "list" }], /texto/],
  ] as const)("rejeita %s", (_name, routes, re) => {
    const schema = withRoutes(routes as unknown as SchemaRoute[]);
    expect(messages(schema)).toEqual(expect.arrayContaining([expect.stringMatching(re)]));
  });

  it("routes não-array é erro e não derruba os helpers", () => {
    const bad = { ...user, routes: {} as unknown as SchemaRoute[] } as Schema;
    const nullRoutes = { ...user, routes: null } as unknown as Schema;
    expect(messages(bad)).toEqual(expect.arrayContaining([expect.stringMatching(/lista de rotas/i)]));
    expect(messages(nullRoutes)).toEqual(expect.arrayContaining([expect.stringMatching(/lista de rotas/i)]));
    expect(routesFor(bad)).toEqual(routesFor(user));
    expect(routesFor(nullRoutes)).toEqual(routesFor(user));
    expect(routesFor({ ...user, routes: [null] as unknown as SchemaRoute[] })).toEqual([]);
    expect(() => validateProject([bad])).not.toThrow();
    expect(() => validateProject([nullRoutes])).not.toThrow();
    expect(() =>
      validateProject([{ ...user, routes: [null] as unknown as SchemaRoute[] }]),
    ).not.toThrow();
  });

  it("validateProject detecta colisão entre Schemas (inclusive CRUD padrão)", () => {
    const customer: Schema = {
      name: "Customer",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [{ method: "GET", path: "/users", kind: "list" }],
    };
    expect(validateProject([user, customer]).some((d) => /duplicada/i.test(d.message))).toBe(true);

    const ok: Schema = { ...customer, routes: [{ method: "GET", path: "/customers", kind: "list" }] };
    expect(validateProject([user, ok])).toEqual([]);

    const account: Schema = {
      name: "Account",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [{ method: "GET", path: "/v1/Users", kind: "list" }],
    };
    const profile: Schema = {
      name: "Profile",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [{ method: "get" as HttpMethod, path: "/v1/users", kind: "list" }],
    };
    expect(validateProject([account, profile])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: expect.stringMatching(/duplicada com o Schema "Account"/) }),
      ]),
    );
  });

  it("routeKey canonicaliza método/path (AUD-04) e routeLabel preserva o case", () => {
    const route: SchemaRoute = { method: "get" as HttpMethod, path: "/Users", kind: "list" };
    expect(routeKey(route)).toBe("GET /users");
    expect(routeLabel(route)).toBe("GET /Users");
  });
});
