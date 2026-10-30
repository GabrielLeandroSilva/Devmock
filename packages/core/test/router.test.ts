import { describe, expect, it } from "vitest";
import { createMockServer } from "../src/mock/index.js";
import { BUILTIN_SCENARIOS, routesFor } from "../src/mock/routes.js";
import type { DevMockConfig, Schema, SchemaRoute } from "../src/types.js";

const FIELDS = [
  { name: "id", type: "uuid" as const, required: true },
  { name: "name", type: "string" as const, generator: "br.nome" },
];

function schema(routes?: SchemaRoute[]): Schema {
  return { name: "User", fields: FIELDS, ...(routes ? { routes } : {}) };
}

async function start(
  schemas: Schema[],
  config: Partial<DevMockConfig> = {},
  options: { scenarios?: Record<string, Record<string, { status?: number; body?: unknown }>> } = {},
) {
  const endpoints = Object.fromEntries(schemas.flatMap((item) => routesFor(item).map((key) => [key, { delayMs: 0 }])));
  const server = createMockServer(schemas, {
    config: { port: 0, ...config },
    endpoints,
    ...options,
  });
  const port = await server.listen();
  return { server, base: `http://127.0.0.1:${port}` };
}

describe("router por Schema (v1.5.0 M2)", () => {
  it("resolve rotas customizadas/aninhadas e usa a chave canônica no log", async () => {
    const { server, base } = await start([
      schema([
        { method: "GET", path: "/v1/users", kind: "list" },
        { method: "GET", path: "/v1/users/:id", kind: "item" },
        { method: "POST", path: "/v1/users", kind: "create" },
        { method: "PATCH", path: "/v1/users/:id", kind: "patch" },
      ]),
    ]);
    try {
      const list = await fetch(`${base}/v1/users`);
      expect(list.status).toBe(200);
      const body = (await list.json()) as { data: unknown[]; total: number };
      expect(body.data).toHaveLength(20);
      expect(body.total).toBe(20);
      expect(server.logs().at(-1)?.route).toBe("GET /v1/users");

      const id = (body.data[0] as { id: string }).id;
      const item = await fetch(`${base}/v1/users/${id}`);
      expect(item.status).toBe(200);
      expect(server.logs().at(-1)?.route).toBe("GET /v1/users/:id");

      const created = await fetch(`${base}/v1/users`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Novo" }),
      });
      expect(created.status).toBe(201);
      expect(created.headers.get("location")).toMatch(/^\/v1\/users\/[^/]+$/);
      expect(created.headers.get("access-control-expose-headers")).toContain("location");
      expect(created.headers.get("access-control-expose-headers")).toContain("allow");

      const patched = await fetch(`${base}/v1/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alterado" }),
      });
      expect(patched.status).toBe(200);
      expect(((await patched.json()) as { name: string }).name).toBe("Alterado");

      // A rota padrão não existe quando `routes` é declarado.
      expect((await fetch(`${base}/users`)).status).toBe(404);
    } finally {
      await server.close();
    }
  });

  it("estático vence :param e a resposta custom é usada", async () => {
    const { server, base } = await start([
      schema([
        { method: "GET", path: "/v1/users/:id", kind: "item" },
        { method: "GET", path: "/v1/users/me", kind: "custom", response: { status: 200, body: { me: true } } },
        { method: "POST", path: "/auth/login", kind: "custom", response: { status: 201, body: { token: "abc" } } },
      ]),
    ]);
    try {
      const me = await fetch(`${base}/v1/users/me`);
      expect(me.status).toBe(200);
      expect(await me.json()).toEqual({ me: true });
      expect(server.logs().at(-1)?.route).toBe("GET /v1/users/me");

      const login = await fetch(`${base}/auth/login`, { method: "POST" });
      expect(login.status).toBe(201);
      expect(await login.json()).toEqual({ token: "abc" });

      expect((await fetch(`${base}/auth/login`)).status).toBe(405);
    } finally {
      await server.close();
    }
  });

  it("cenário aplica por chave canônica a uma rota custom POST sem restart", async () => {
    const { server, base } = await start([
      schema([
        {
          method: "POST",
          path: "/auth/login",
          kind: "custom",
          response: { status: 201, body: { source: "route" } },
        },
      ]),
    ]);
    try {
      const before = await fetch(`${base}/auth/login`, { method: "POST" });
      expect(before.status).toBe(201);
      expect(await before.json()).toEqual({ source: "route" });

      server.reload({
        config: { activeScenarios: { "POST /auth/login": "Accepted" } },
        scenarios: { "POST /auth/login": { Accepted: { status: 202, body: { source: "scenario" } } } },
      });
      const after = await fetch(`${base}/auth/login`, { method: "POST" });
      expect(after.status).toBe(202);
      expect(await after.json()).toEqual({ source: "scenario" });
      expect(server.logs().at(-1)).toMatchObject({ route: "POST /auth/login", scenario: "Accepted", status: 202 });
    } finally {
      await server.close();
    }
  });

  it("preserva aliases singulares para todas as operações do CRUD padrão", async () => {
    const { server, base } = await start([schema()]);
    try {
      const list = await fetch(`${base}/user`);
      expect(list.status).toBe(200);
      expect(server.logs().at(-1)?.route).toBe("GET /users");

      const body = (await list.json()) as { data: { id: string }[] };
      const id = body.data[0].id;
      const item = await fetch(`${base}/user/${id}`);
      expect(item.status).toBe(200);
      expect(server.logs().at(-1)?.route).toBe("GET /users/:id");

      const created = await fetch(`${base}/user`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Singular" }),
      });
      expect(created.status).toBe(201);
      const createdBody = (await created.json()) as { id: string };
      expect(server.logs().at(-1)?.route).toBe("POST /users");

      const updated = await fetch(`${base}/user/${createdBody.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Atualizado" }),
      });
      expect(updated.status).toBe(200);
      expect(server.logs().at(-1)?.route).toBe("PUT /users/:id");

      const patched = await fetch(`${base}/user/${createdBody.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Patched" }),
      });
      expect(patched.status).toBe(200);
      expect(server.logs().at(-1)?.route).toBe("PATCH /users/:id");

      const deleted = await fetch(`${base}/user/${createdBody.id}`, { method: "DELETE" });
      expect(deleted.status).toBe(204);
      expect(server.logs().at(-1)?.route).toBe("DELETE /users/:id");
    } finally {
      await server.close();
    }
  });

  it("match de path é case-insensitive", async () => {
    const { server, base } = await start([schema([{ method: "GET", path: "/v1/users", kind: "list" }])]);
    try {
      expect((await fetch(`${base}/V1/Users`)).status).toBe(200);
    } finally {
      await server.close();
    }
  });

  it("recusa rotas duplicadas entre Schemas no start", () => {
    const a: Schema = {
      name: "User",
      fields: FIELDS,
      routes: [{ method: "GET", path: "/dup", kind: "list" }],
    };
    const b: Schema = {
      name: "Customer",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [{ method: "GET", path: "/dup", kind: "list" }],
    };
    expect(() => createMockServer([a, b])).toThrow(/rotas inválidas|schemas\/rotas inválidos/i);
  });

  it("start recusa Schema/rotas inválidos com mensagem acionável", () => {
    const badStatus = schema([
      { method: "GET", path: "/x", kind: "list", response: { status: "abc" as unknown as number } },
    ]);
    expect(() => createMockServer([badStatus])).toThrow(/inválid/i);

    const emptyRoute = { ...schema(), routes: [{} as SchemaRoute] } as Schema;
    expect(() => createMockServer([emptyRoute])).toThrow(/inválid/i);

    const noName = { fields: FIELDS } as unknown as Schema;
    expect(() => createMockServer([noName])).toThrow(/inválid/i);
  });

  it("path estático não-ASCII casa com percent-encoding", async () => {
    const { server, base } = await start([schema([{ method: "GET", path: "/usuários", kind: "list" }])]);
    try {
      expect((await fetch(`${base}/usu%C3%A1rios`)).status).toBe(200);
    } finally {
      await server.close();
    }
  });

  it("item aninhado usa o último param (recurso)", async () => {
    const nested = schema([
      { method: "GET", path: "/users", kind: "list" },
      { method: "GET", path: "/orgs/:orgId/users/:userId", kind: "item" },
    ]);
    const { server, base } = await start([nested]);
    try {
      const list = await fetch(`${base}/users`);
      const body = (await list.json()) as { data: { id: string }[] };
      const res = await fetch(`${base}/orgs/o1/users/${body.data[0].id}`);
      expect(res.status).toBe(200);
      expect(server.logs().at(-1)?.route).toBe("GET /orgs/:orgid/users/:userid");
    } finally {
      await server.close();
    }
  });

  it("404 para path desconhecido e 405 para método não permitido", async () => {
    const { server, base } = await start([schema()]);
    try {
      expect((await fetch(`${base}/nope`)).status).toBe(404);
      expect((await fetch(`${base}/users`, { method: "DELETE" })).status).toBe(405);
    } finally {
      await server.close();
    }
  });

  it("endpoints config usa a chave canônica da rota customizada", async () => {
    const server = createMockServer([schema([{ method: "GET", path: "/v1/Users", kind: "list" }])], {
      config: { port: 0 },
      endpoints: { "GET /v1/users": { status: 418, delayMs: 0 } },
    });
    const port = await server.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${port}/v1/Users`);
      expect(res.status).toBe(418);
      expect(server.logs().at(-1)?.route).toBe("GET /v1/users");
    } finally {
      await server.close();
    }
  });

  it("alias singular não existe quando o Schema declara routes", async () => {
    const { server, base } = await start([schema([{ method: "GET", path: "/v2/users", kind: "list" }])]);
    try {
      expect((await fetch(`${base}/user`)).status).toBe(404);
    } finally {
      await server.close();
    }
  });

  it("rota explícita /user vence o alias do CRUD padrão", async () => {
    const explicit: Schema = {
      name: "Customer",
      fields: FIELDS,
      routes: [
        { method: "GET", path: "/user", kind: "custom", response: { status: 200, body: { custom: true } } },
      ],
    };
    const { server, base } = await start([schema(), explicit]);
    try {
      const res = await fetch(`${base}/user`);
      expect(await res.json()).toEqual({ custom: true });
      expect(server.logs().at(-1)?.route).toBe("GET /user");
    } finally {
      await server.close();
    }
  });

  it("custom preserva body null explícito", async () => {
    const { server, base } = await start([
      schema([{ method: "GET", path: "/null", kind: "custom", response: { status: 200, body: null } }]),
    ]);
    try {
      const res = await fetch(`${base}/null`);
      expect(res.status).toBe(200);
      expect(await res.json()).toBeNull();
    } finally {
      await server.close();
    }
  });

  it("ação custom com :id responde o status declarado", async () => {
    const { server, base } = await start([
      schema([
        {
          method: "POST",
          path: "/users/:id/activate",
          kind: "custom",
          response: { status: 204 },
        },
      ]),
    ]);
    try {
      const res = await fetch(`${base}/users/abc/activate`, { method: "POST" });
      expect(res.status).toBe(204);
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-11 — config do endpoint sobrepõe o status da response custom", async () => {
    const server = createMockServer(
      [schema([{ method: "POST", path: "/auth/login", kind: "custom", response: { status: 201, body: { source: "route" } } }])],
      { config: { port: 0 }, endpoints: { "POST /auth/login": { status: 202, delayMs: 0 } } },
    );
    const port = await server.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${port}/auth/login`, { method: "POST" });
      expect(res.status).toBe(202);
      expect(await res.json()).toEqual({ source: "route" });
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-11 — cenário da requisição sobrepõe endpoint e response custom", async () => {
    const server = createMockServer(
      [schema([{ method: "POST", path: "/auth/login", kind: "custom", response: { status: 201, body: { source: "route" } } }])],
      {
        config: { port: 0 },
        endpoints: { "POST /auth/login": { status: 202, body: { source: "endpoint" }, delayMs: 0 } },
        scenarios: { "POST /auth/login": { Requested: { status: 203, body: { source: "request" } } } },
      },
    );
    const port = await server.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${port}/auth/login?scenario=Requested`, { method: "POST" });
      expect(res.status).toBe(203);
      expect(await res.json()).toEqual({ source: "request" });
    } finally {
      await server.close();
    }
  });

  it.each([99, 700])("status de endpoint fora de faixa (%i) é clampado para 500 e o log reflete", async (status) => {
    const server = createMockServer([schema()], {
      config: { port: 0 },
      endpoints: { "GET /users": { status, delayMs: 0 } },
    });
    const port = await server.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${port}/users`);
      expect(res.status).toBe(500);
      expect(server.logs().at(-1)?.status).toBe(500);
    } finally {
      await server.close();
    }
  });

  it("rejeita rotas com mesmo shape e nomes de param diferentes", () => {
    const a: Schema = {
      name: "A",
      fields: FIELDS,
      routes: [{ method: "GET", path: "/x/:id", kind: "item" }],
    };
    const b: Schema = {
      name: "B",
      fields: FIELDS,
      routes: [{ method: "GET", path: "/x/:name", kind: "item" }],
    };
    expect(() => createMockServer([a, b])).toThrow(/duplicada/i);
  });

  it("PRD-02 RF-10 — PUT substitui os campos e preserva o id", async () => {
    const { server, base } = await start([schema()]);
    try {
      const list = await fetch(`${base}/users`);
      const first = ((await list.json()) as { data: { id: string }[] }).data[0];
      await fetch(`${base}/users/${first.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transient: true }),
      });

      const put = await fetch(`${base}/users/${first.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Substituído" }),
      });
      expect(put.status).toBe(200);
      expect(await put.json()).toEqual({ id: first.id, name: "Substituído" });
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-10 — PATCH faz merge dos campos", async () => {
    const { server, base } = await start([schema()]);
    try {
      const list = await fetch(`${base}/users`);
      const first = ((await list.json()) as { data: { id: string; name: string }[] }).data[0];
      const patch = await fetch(`${base}/users/${first.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      expect(patch.status).toBe(200);
      expect(await patch.json()).toMatchObject({ id: first.id, name: first.name, active: true });
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-10 — JSON inválido responde 400", async () => {
    const { server, base } = await start([schema()]);
    try {
      const res = await fetch(`${base}/users`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{invalid",
      });
      expect(res.status).toBe(400);
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-10 — DELETE na coleção responde 405", async () => {
    const { server, base } = await start([schema()]);
    try {
      expect((await fetch(`${base}/users`, { method: "DELETE" })).status).toBe(405);
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-11 — body-only mantém o status default da rota custom", async () => {
    const server = createMockServer(
      [schema([{ method: "GET", path: "/x", kind: "custom", response: { status: 201 } }])],
      {
        config: { port: 0 },
        endpoints: { "GET /x": { body: { ok: true }, delayMs: 0 } },
      },
    );
    const port = await server.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${port}/x`);
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ ok: true });
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-11 — body null explícito vence e status 200 explícito vence 201", async () => {
    const nullRoute = schema([
      { method: "GET", path: "/n", kind: "custom", response: { status: 201, body: { route: true } } },
    ]);
    const a = createMockServer([nullRoute], {
      config: { port: 0 },
      endpoints: { "GET /n": { body: null } },
    });
    const portA = await a.listen();
    try {
      expect(await (await fetch(`http://127.0.0.1:${portA}/n`)).json()).toBeNull();
    } finally {
      await a.close();
    }

    const b = createMockServer([nullRoute], {
      config: { port: 0 },
      endpoints: { "GET /n": { status: 200 } },
    });
    const portB = await b.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${portB}/n`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ route: true });
    } finally {
      await b.close();
    }
  });

  it("PRD-02 RF-11 — status 401 explícito mantém o body da rota custom", async () => {
    const server = createMockServer(
      [schema([{ method: "GET", path: "/e", kind: "custom", response: { status: 201, body: { why: "x" } } }])],
      { config: { port: 0 }, endpoints: { "GET /e": { status: 401 } } },
    );
    const port = await server.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${port}/e`);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ why: "x" });
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-10 — JSON inválido responde 400 mesmo com cenário ativo ou rota custom", async () => {
    const server = createMockServer(
      [
        schema([
          { method: "POST", path: "/users", kind: "create" },
          { method: "POST", path: "/auth/login", kind: "custom", response: { status: 201 } },
        ]),
      ],
      {
        config: { port: 0, activeScenarios: { "POST /users": "Empty" } },
        scenarios: { "POST /users": { Empty: { body: { data: [], total: 0 } } } },
      },
    );
    const port = await server.listen();
    try {
      const bad = { method: "POST", headers: { "content-type": "application/json" }, body: "{invalid" };
      expect((await fetch(`http://127.0.0.1:${port}/users`, bad)).status).toBe(400);
      expect((await fetch(`http://127.0.0.1:${port}/auth/login`, bad)).status).toBe(400);
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-10 — corpo não-objeto (array/null/primitivo) responde 400", async () => {
    const { server, base } = await start([schema()]);
    try {
      for (const body of ["[]", "null", "42", '"x"']) {
        const res = await fetch(`${base}/users`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
        });
        expect(res.status).toBe(400);
      }
    } finally {
      await server.close();
    }
  });

  it.each(["PUT", "PATCH"] as const)("PRD-02 RF-10 — %s rejeita JSON inválido e corpos não-objeto", async (method) => {
    const { server, base } = await start([schema()]);
    try {
      const list = await fetch(`${base}/users`);
      const id = ((await list.json()) as { data: { id: string }[] }).data[0].id;
      for (const body of ["{invalid", "[]", "null", "42", '"x"']) {
        const res = await fetch(`${base}/users/${id}`, {
          method,
          headers: { "content-type": "application/json" },
          body,
        });
        expect(res.status).toBe(400);
      }
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-10 — id no body não sobrescreve o id no PUT/PATCH", async () => {
    const { server, base } = await start([schema()]);
    try {
      const list = await fetch(`${base}/users`);
      const first = ((await list.json()) as { data: { id: string }[] }).data[0];
      const patch = await fetch(`${base}/users/${first.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "hacked", transient: true }),
      });
      expect(((await patch.json()) as { id: string }).id).toBe(first.id);

      const put = await fetch(`${base}/users/${first.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "hacked", name: "Substituído" }),
      });
      const putBody = (await put.json()) as { id: string; name: string };
      expect(putBody.id).toBe(first.id);
      expect(putBody.name).toBe("Substituído");
      expect(putBody).not.toHaveProperty("transient");
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-10 — 405 traz Allow, body e log", async () => {
    const { server, base } = await start([schema()]);
    try {
      const res = await fetch(`${base}/users`, { method: "DELETE" });
      expect(res.status).toBe(405);
      const allow = res.headers.get("allow") ?? "";
      expect(allow).toMatch(/GET/);
      expect(allow).toMatch(/POST/);
      expect(allow).toMatch(/OPTIONS/);
      expect(await res.json()).toMatchObject({ error: "METHOD_NOT_ALLOWED" });
      expect(res.headers.get("access-control-expose-headers")).toContain("location");
      expect(res.headers.get("access-control-expose-headers")).toContain("allow");
      expect(server.logs().at(-1)?.status).toBe(405);
    } finally {
      await server.close();
    }
  });

  it("cenários embutidos Default/Slow não sobrescrevem o status do método", async () => {
    expect(BUILTIN_SCENARIOS.Default.status).toBeUndefined();
    expect(BUILTIN_SCENARIOS["Slow Network"].status).toBeUndefined();

    const server = createMockServer([schema()], {
      config: {
        port: 0,
        activeScenarios: {
          "POST /users": "Default",
          "GET /users": "Default",
          "DELETE /users/:id": "Default",
        },
      },
    });
    const port = await server.listen();
    try {
      const created = await fetch(`http://127.0.0.1:${port}/users`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      expect(created.status).toBe(201);

      const viaQuery = await fetch(`http://127.0.0.1:${port}/users?scenario=Default`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      expect(viaQuery.status).toBe(201);

      const list = await fetch(`http://127.0.0.1:${port}/users`);
      const first = ((await list.json()) as { data: { id: string }[] }).data[0];
      const removedByQuery = await fetch(
        `http://127.0.0.1:${port}/users/${first.id}?scenario=Default`,
        { method: "DELETE" },
      );
      expect(removedByQuery.status).toBe(204);

      const list2 = await fetch(`http://127.0.0.1:${port}/users`);
      const second = ((await list2.json()) as { data: { id: string }[] }).data[0];
      const removedByActive = await fetch(`http://127.0.0.1:${port}/users/${second.id}`, {
        method: "DELETE",
      });
      expect(removedByActive.status).toBe(204);
    } finally {
      await server.close();
    }
  });

  it("cenário Default não rebaixa rota custom 201", async () => {
    const server = createMockServer(
      [schema([{ method: "GET", path: "/c", kind: "custom", response: { status: 201 } }])],
      { config: { port: 0, activeScenarios: { "GET /c": "Default" } } },
    );
    const port = await server.listen();
    try {
      expect((await fetch(`http://127.0.0.1:${port}/c`)).status).toBe(201);
    } finally {
      await server.close();
    }
  });

  it("PRD-02 RF-11 — cenário de arquivo body-only/null respeita o status da rota", async () => {
    const route = schema([{ method: "GET", path: "/c", kind: "custom", response: { status: 201 } }]);
    const scenarios = {
      "GET /c": { OnlyBody: { body: { s: 1 } }, NullBody: { body: null } },
    };
    const a = createMockServer([route], {
      config: { port: 0, activeScenarios: { "GET /c": "OnlyBody" } },
      scenarios,
    });
    const portA = await a.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${portA}/c`);
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ s: 1 });
    } finally {
      await a.close();
    }

    const b = createMockServer([route], {
      config: { port: 0, activeScenarios: { "GET /c": "NullBody" } },
      scenarios,
    });
    const portB = await b.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${portB}/c`);
      expect(res.status).toBe(201);
      expect(await res.json()).toBeNull();
    } finally {
      await b.close();
    }
  });

  it("endpoint 401 vence o cenário Default", async () => {
    const server = createMockServer([schema()], {
      config: { port: 0, activeScenarios: { "POST /users": "Default" } },
      endpoints: { "POST /users": { status: 401 } },
    });
    const port = await server.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${port}/users`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ error: "UNAUTHORIZED" });
    } finally {
      await server.close();
    }
  });

  it("corpo vazio em POST é aceito (201); inválido traz body INVALID_JSON", async () => {
    const { server, base } = await start([schema()]);
    try {
      expect((await fetch(`${base}/users`, { method: "POST" })).status).toBe(201);
      const invalid = await fetch(`${base}/users`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{invalid",
      });
      expect(invalid.status).toBe(400);
      expect(await invalid.json()).toMatchObject({ error: "INVALID_JSON" });
    } finally {
      await server.close();
    }
  });
});
