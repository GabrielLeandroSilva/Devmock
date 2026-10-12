import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createMockServer, type MockServer } from "../src/mock/index.js";
import { routesFor, paginate, plural } from "../src/mock/routes.js";
import type { Schema } from "../src/types.js";

const user: Schema = {
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true },
    { name: "name", type: "string", generator: "br.nome" },
    { name: "email", type: "string", generator: "email" },
  ],
};

const EPHEMERAL = { port: 0 } as const;

let server: MockServer;
let base: string;

beforeAll(async () => {
  server = createMockServer([user], { config: EPHEMERAL });
  const port = await server.listen();
  base = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await server.close();
});

async function get(path: string): Promise<{ status: number; body: any; ms: number }> {
  const t = Date.now();
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, ms: Date.now() - t };
}

describe("routes e paginação (un)", () => {
  it("gera CRUD completo a partir do Schema", () => {
    expect(routesFor(user)).toEqual([
      "GET /users",
      "GET /users/:id",
      "POST /users",
      "PUT /users/:id",
      "PATCH /users/:id",
      "DELETE /users/:id",
    ]);
  });

  it("model já no plural não ganha 's' extra (/users, nunca /userss)", () => {
    expect(plural("Users")).toBe("users");
    expect(plural("Status")).toBe("status");
    expect(plural("User")).toBe("users");
    expect(routesFor({ name: "Users", fields: [] }).filter((r) => r.startsWith("GET "))).toEqual([
      "GET /users",
      "GET /users/:id",
    ]);
  });

  it("envelope paginado tem data/total/page/limit", () => {
    const env = paginate([1, 2, 3, 4, 5], 2, 2);
    expect(env.data).toEqual([3, 4]);
    expect(env.total).toBe(5);
    expect(env.page).toBe(2);
    expect(env.limit).toBe(2);
  });
});

describe("Mock Server (integração)", () => {
  it("GET /users retorna 20 registros paginados", async () => {
    const r = await get("/users?page=1&limit=20");
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(20);
    expect(r.body.total).toBe(20);
    expect(typeof r.body.data[0].id).toBe("string");
  });

  it("GET /users/:id existente → 200; inexistente → 404 com body padrão", async () => {
    const list = await get("/users");
    const id = list.body.data[0].id;
    const ok = await get(`/users/${id}`);
    expect(ok.status).toBe(200);
    expect(ok.body.id).toBe(id);

    const missing = await get("/users/nao-existe");
    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe("NOT_FOUND");
  });

  it("rota inexistente → 404", async () => {
    const r = await get("/nada");
    expect(r.status).toBe(404);
  });

  it("POST /users → 201 e o objeto aparece no GET seguinte", async () => {
    const before = await get("/users");
    const res = await fetch(`${base}/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Criado Via Post" }),
    });
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created.id).toBeDefined();
    expect(created.name).toBe("Criado Via Post");

    const after = await get("/users");
    expect(after.body.total).toBe(before.body.total + 1);
    expect(after.body.data.some((r: any) => r.id === created.id)).toBe(true);
  });

  it("PUT atualiza e DELETE remove; id inexistente → 404", async () => {
    const list = await get("/users");
    const id = list.body.data[0].id;

    const put = await fetch(`${base}/users/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Atualizado" }),
    });
    expect(put.status).toBe(200);
    expect((await put.json()).name).toBe("Atualizado");

    const putMissing = await fetch(`${base}/users/nao-existe`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(putMissing.status).toBe(404);
    await putMissing.arrayBuffer();

    const del = await fetch(`${base}/users/${id}`, { method: "DELETE" });
    expect(del.status).toBe(204);
    const gone = await get(`/users/${id}`);
    expect(gone.status).toBe(404);

    const delMissing = await fetch(`${base}/users/${id}`, { method: "DELETE" });
    expect(delMissing.status).toBe(404);
    await delMissing.arrayBuffer();
  });

  it("page/limit inválidos caem para os defaults (sem NaN)", async () => {
    const r = await get("/users?page=abc&limit=-5");
    expect(r.status).toBe(200);
    expect(r.body.page).toBe(1);
    expect(r.body.total).toBeGreaterThan(0);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it("routeKey ignora case (/Users resolve como /users)", async () => {
    const r = await get("/Users");
    expect(r.status).toBe(200);
  });

  it("porta ocupada gera erro acionável (PRD-02 RF-07)", async () => {
    const first = createMockServer([user], { config: EPHEMERAL });
    const port = await first.listen();
    const second = createMockServer([user], { config: { port } });
    await expect(second.listen()).rejects.toThrow(/já está em uso/);
    await first.close();
  });

  it("aplica delayMs configurado", async () => {
    const delayServer = createMockServer([user], {
      config: EPHEMERAL,
      endpoints: { "GET /users": { delayMs: 250 } },
    });
    const port = await delayServer.listen();
    const t = Date.now();
    const res = await fetch(`http://127.0.0.1:${port}/users`);
    await res.arrayBuffer();
    expect(Date.now() - t).toBeGreaterThanOrEqual(230);
    await delayServer.close();
  });
});

describe("cenários (PRD-04)", () => {
  it("troca de cenário sem restart (PRD-04 RF-02)", async () => {
    const s = createMockServer([user], { config: EPHEMERAL });
    const port = await s.listen();
    const url = `http://127.0.0.1:${port}/users`;

    const before = await (await fetch(url)).json();
    expect(before.data.length).toBeGreaterThan(0);

    s.reload({
      scenarios: { "GET /users": { Empty: { status: 200, body: { data: [], total: 0 } } } },
      config: { activeScenarios: { "GET /users": "Empty" } },
    });

    const after = await (await fetch(url)).json();
    expect(after).toEqual({ data: [], total: 0 });
    expect(s.logs().at(-1)?.scenario).toBe("Empty");
    await s.close();
  });

  it("cenários embutidos funcionam sem nenhum arquivo (PRD-04 MVP)", async () => {
    for (const [name, status] of [
      ["Unauthorized", 401],
      ["Forbidden", 403],
      ["Server Error", 500],
      ["Rate Limited", 429],
    ] as const) {
      const s = createMockServer([user], {
        config: { ...EPHEMERAL, activeScenarios: { "GET /users": name } },
      });
      const port = await s.listen();
      const res = await fetch(`http://127.0.0.1:${port}/users`);
      const body = await res.json();
      expect(res.status).toBe(status);
      expect(body.error).toBeDefined();
      await s.close();
    }
  });

  it("Empty embutido retorna envelope vazio sem arquivos", async () => {
    const s = createMockServer([user], {
      config: { ...EPHEMERAL, activeScenarios: { "GET /users": "Empty" } },
    });
    const port = await s.listen();
    const res = await fetch(`http://127.0.0.1:${port}/users`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [], total: 0 });
    await s.close();
  });

  it("arquivo tem precedência sobre o embutido", async () => {
    const s = createMockServer([user], {
      config: { ...EPHEMERAL, activeScenarios: { "GET /users": "Empty" } },
      scenarios: { "GET /users": { Empty: { status: 200, body: { data: [{ custom: true }], total: 1 } } } },
    });
    const port = await s.listen();
    const res = await fetch(`http://127.0.0.1:${port}/users`);
    expect(await res.json()).toEqual({ data: [{ custom: true }], total: 1 });
    await s.close();
  });

  it("Empty retorna envelope vazio com 200", async () => {
    const s = createMockServer([user], {
      config: { ...EPHEMERAL, activeScenarios: { "GET /users": "Empty" } },
      scenarios: { "GET /users": { Empty: { status: 200, body: { data: [], total: 0 } } } },
    });
    const port = await s.listen();
    const res = await fetch(`http://127.0.0.1:${port}/users`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ data: [], total: 0 });
    expect(s.logs().at(-1)?.scenario).toBe("Empty");
    await s.close();
  });

  it("401 e 500 retornam body padrão", async () => {
    for (const status of [401, 500]) {
      const s = createMockServer([user], {
        config: EPHEMERAL,
        endpoints: { "GET /users": { status } },
      });
      const port = await s.listen();
      const res = await fetch(`http://127.0.0.1:${port}/users`);
      const body = await res.json();
      expect(res.status).toBe(status);
      expect(body.error).toBeDefined();
      await s.close();
    }
  });

  it("request log registra método, rota, status e ms", async () => {
    const before = server.logs().length;
    await get("/users");
    const logs = server.logs();
    expect(logs.length).toBe(before + 1);
    const last = logs[logs.length - 1];
    expect(last).toMatchObject({ method: "GET", route: "GET /users", status: 200 });
    expect(last.ms).toBeGreaterThanOrEqual(0);
  });
});
