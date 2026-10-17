import { describe, expect, it } from "vitest";
import {
  createMockServer,
  type MockServerOptions,
} from "../src/mock/index.js";
import { plural, routesFor } from "../src/mock/routes.js";
import { cnpjCharValue, genCnpj } from "../src/generators/br.js";
import { mulberry32 } from "../src/rng.js";
import type { Schema } from "../src/types.js";

/**
 * Suíte de regressão por bug — 1 teste por entrada do catálogo AUD-*
 * (ver `DevMock Cerebro/04-Prompts-Agentes/Agente-Auditor.md` §5 e
 * `05-Gestao-Projeto/07-Estrategia-Testes.md`).
 * Convenção: `it('AUD-xx — …')`. Não renomear: o CI exige a rastreabilidade.
 */

const user: Schema = {
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true },
    { name: "name", type: "string", generator: "br.nome" },
    { name: "email", type: "string", generator: "email" },
  ],
};

const EPHEMERAL = { port: 0 } as const;

async function boot(extra: MockServerOptions = {}) {
  const server = createMockServer([user], {
    config: { ...EPHEMERAL, ...(extra.config ?? {}) },
    scenarios: extra.scenarios,
    endpoints: extra.endpoints,
  });
  const port = await server.listen();
  const base = `http://127.0.0.1:${port}`;
  const req = async (p: string, init?: Parameters<typeof fetch>[1]) => {
    const res = await fetch(base + p, init);
    const text = await res.text();
    return { status: res.status, body: text ? (JSON.parse(text) as any) : null };
  };
  return { server, base, req };
}

const JSON_HEADERS = { "content-type": "application/json" };

/** Validador espelho da regra oficial (IN RFB 2.229/2024). */
function validCnpj(masked: string): boolean {
  const n = masked.replace(/[.\-/]/g, "");
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(n)) return false;
  const vals = [...n].map((c) => (/\d/.test(c) ? Number(c) : cnpjCharValue(c)));
  const dv = (nums: number[], startW: number) => {
    let sum = 0;
    let w = startW;
    for (const v of nums) {
      sum += v * w;
      w = w === 2 ? 9 : w - 1;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(vals.slice(0, 12), 5) === vals[12] && dv(vals.slice(0, 13), 6) === vals[13];
}

describe("regressão — catálogo AUD", () => {
  it("AUD-01 — POST/PUT/DELETE persistem na sessão do mock", async () => {
    const { server, req } = await boot();
    try {
      const before = (await req("/users")).body.total as number;

      const created = await req("/users", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: "Regressão AUD-01" }),
      });
      expect(created.status).toBe(201);
      const id = created.body.id as string;

      expect((await req("/users")).body.total).toBe(before + 1);

      const put = await req(`/users/${id}`, {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: "Alterado" }),
      });
      expect(put.status).toBe(200);
      expect(put.body.name).toBe("Alterado");
      expect((await req(`/users/${id}`)).body.name).toBe("Alterado");

      const del = await req(`/users/${id}`, { method: "DELETE" });
      expect(del.status).toBe(204);
      expect((await req(`/users/${id}`)).status).toBe(404);
    } finally {
      await server.close();
    }
  });

  it("AUD-02 — total conta o store inteiro, não o slice paginado", async () => {
    const { server, req } = await boot();
    try {
      const r = await req("/users?page=1&limit=5");
      expect(r.body.data).toHaveLength(5);
      expect(r.body.total).toBe(20);
    } finally {
      await server.close();
    }
  });

  it("AUD-03 — page/limit inválidos caem no default (nunca NaN)", async () => {
    const { server, req } = await boot();
    try {
      const r = await req("/users?page=abc&limit=-5");
      expect(r.status).toBe(200);
      expect(r.body.page).toBe(1);
      expect(r.body.limit).toBe(20);
      expect(Number.isNaN(r.body.page)).toBe(false);
      expect(Array.isArray(r.body.data)).toBe(true);
    } finally {
      await server.close();
    }
  });

  it("AUD-04 — routeKey ignora o case (/Users resolve como /users)", async () => {
    const { server, req } = await boot();
    try {
      expect((await req("/Users")).status).toBe(200);
      expect((await req("/USERS")).status).toBe(200);
    } finally {
      await server.close();
    }
  });

  it("AUD-05 — porta ocupada gera mensagem acionável (não EADDRINUSE cru)", async () => {
    const first = createMockServer([user], { config: EPHEMERAL });
    const port = await first.listen();
    const second = createMockServer([user], { config: { port } });
    try {
      await expect(second.listen()).rejects.toThrow(/já está em uso/);
    } finally {
      await first.close();
    }
  });

  it("AUD-07 — br.cnpj emite formato numérico e alfanumérico, ambos com DV válido", () => {
    const rand = mulberry32("aud-07");
    let numeric = 0;
    let alpha = 0;
    for (let i = 0; i < 300; i++) {
      const c = genCnpj(rand);
      expect(validCnpj(c)).toBe(true);
      if (/[A-Z]/.test(c)) alpha++;
      else numeric++;
    }
    expect(numeric).toBeGreaterThan(0);
    expect(alpha).toBeGreaterThan(0);
  });

  it("AUD-09 — plural idempotente: model já plural não ganha 's' extra", () => {
    expect(plural("Users")).toBe("users");
    expect(plural("Status")).toBe("status");
    expect(plural("User")).toBe("users");
    const routes = routesFor({ name: "Users", fields: [] });
    expect(routes).toContain("GET /users");
    expect(routes).not.toContain("GET /userss");
  });

  it("AUD-10 — cenários embutidos (incl. 403/429) aplicam sem nenhum arquivo", async () => {
    const cases: ReadonlyArray<readonly [string, number]> = [
      ["Unauthorized", 401],
      ["Forbidden", 403],
      ["Server Error", 500],
      ["Rate Limited", 429],
    ];
    for (const [name, status] of cases) {
      const { server, req } = await boot({
        config: { ...EPHEMERAL, activeScenarios: { "GET /users": name } },
      });
      try {
        const r = await req("/users");
        expect(r.status, `${name} deveria responder ${status}`).toBe(status);
        expect(r.body.error).toBeDefined();
      } finally {
        await server.close();
      }
    }
  });

  it("AUD-13 — ?limit sozinho paginava (não exige page)", async () => {
    const { server, req } = await boot();
    try {
      const r = await req("/users?limit=3");
      expect(r.status).toBe(200);
      expect(r.body.data).toHaveLength(3);
      expect(r.body.limit).toBe(3);
      expect(r.body.page).toBe(1);
    } finally {
      await server.close();
    }
  });
});
