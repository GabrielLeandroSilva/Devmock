import { describe, expect, it } from "vitest";
import { createMockServer } from "../src/mock/index.js";
import { BUILTIN_SCENARIOS, resolveEndpoint, SCENARIO_NAMES } from "../src/mock/routes.js";
import { generate } from "../src/generators/index.js";
import { DEFAULT_CONFIG, type Schema } from "../src/types.js";

/**
 * Suíte de rastreabilidade de PRD — cobre aceites/RF que não tinham teste.
 * Convenção: `it('PRD-xx …')`. Alimenta a matriz `RF → teste` em
 * `DevMock Cerebro/05-Gestao-Projeto/07-Estrategia-Testes.md` §5.
 */

const user: Schema = {
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true },
    { name: "name", type: "string", generator: "br.nome" },
    { name: "email", type: "string", generator: "email" },
    { name: "status", type: "enum", values: ["ACTIVE", "BLOCKED", "PENDING"] },
  ],
};

const EPHEMERAL = { port: 0 } as const;

describe("rastreabilidade de PRD", () => {
  it("PRD-01 RF-07 — config default: port 4010, seedDefault, locale pt-BR", () => {
    expect(DEFAULT_CONFIG.port).toBe(4010);
    expect(DEFAULT_CONFIG.seedDefault).toBe(12345);
    expect(DEFAULT_CONFIG.localeDefault).toBe("pt-BR");
    expect(DEFAULT_CONFIG.activeScenarios).toEqual({});
  });

  it("PRD-01 §7 — gera 1000 registros em menos de 2s", () => {
    const t = Date.now();
    const rows = generate(user, 1000, 12345);
    expect(rows).toHaveLength(1000);
    expect(Date.now() - t).toBeLessThan(2000);
  });

  it("PRD-02 §7 — trocar porta e reiniciar não deixa resíduo", async () => {
    const first = createMockServer([user], { config: EPHEMERAL });
    const port = await first.listen();
    await first.close();

    // Rebind na mesma porta recém-liberada: prova que o close não deixou resíduo.
    const second = createMockServer([user], { config: { port } });
    try {
      const again = await second.listen();
      expect(again).toBe(port);
      const res = await fetch(`http://127.0.0.1:${again}/users?limit=1`);
      expect(res.status).toBe(200);
    } finally {
      await second.close();
    }
  });

  it("PRD-04 §7 — Slow Network embutido aplica delayMs de ~5s", () => {
    const { cfg } = resolveEndpoint("GET /users", {
      config: { ...EPHEMERAL, activeScenarios: { "GET /users": "Slow Network" } },
    });
    expect(BUILTIN_SCENARIOS["Slow Network"].delayMs).toBe(5000);
    expect(cfg.delayMs).toBe(5000);
  });

  it("M1 — SCENARIO_NAMES expõe os 7 cenários (inclui 403 e 429) na UI", () => {
    expect(SCENARIO_NAMES).toEqual([
      "Default",
      "Empty",
      "Unauthorized",
      "Forbidden",
      "Server Error",
      "Slow Network",
      "Rate Limited",
    ]);
    expect(SCENARIO_NAMES).toEqual(Object.keys(BUILTIN_SCENARIOS));
  });

  it("M2 — errorRate é determinístico por seed; 0 mantém o comportamento", async () => {
    const a = await countErrors(42, 50, 100);
    const b = await countErrors(42, 50, 100);
    expect(a).toBe(b); // mesma seed → mesma distribuição
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(100);
    expect(await countErrors(42, 0, 50)).toBe(0);
  });

  it("M2 — cenário ativo tem precedência sobre errorRate", async () => {
    const s = createMockServer([user], {
      config: { port: 0, seedDefault: 42, errorRate: 100, activeScenarios: { "GET /users": "Empty" } },
      endpoints: { "GET /users": { delayMs: 0 } },
    });
    const port = await s.listen();
    try {
      const res = await fetch(`http://127.0.0.1:${port}/users`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ data: [], total: 0 });
    } finally {
      await s.close();
    }
  });
});

/** Conta respostas 500 em N requisições com uma errorRate/seed dadas. */
async function countErrors(seed: number, errorRate: number, n: number): Promise<number> {
  const server = createMockServer([user], {
    config: { port: 0, seedDefault: seed, errorRate },
    endpoints: { "GET /users": { delayMs: 0 } },
  });
  const port = await server.listen();
  try {
    let errors = 0;
    for (let i = 0; i < n; i++) {
      const res = await fetch(`http://127.0.0.1:${port}/users?limit=1`);
      if (res.status === 500) errors++;
      await res.arrayBuffer();
    }
    return errors;
  } finally {
    await server.close();
  }
}
