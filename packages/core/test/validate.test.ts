import { describe, expect, it } from "vitest";
import { createMockServer } from "../src/mock/index.js";
import { compare, kindOf, summarize, validateLive } from "../src/validate/index.js";
import type { Schema } from "../src/types.js";

const user: Schema = {
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true },
    { name: "email", type: "string", required: true },
    { name: "status", type: "enum", values: ["ACTIVE", "BLOCKED"] },
    { name: "balance", type: "number", format: "BRL" },
    { name: "nick", type: "string" },
  ],
};

const good = {
  id: "7c9c",
  email: "a@example.com",
  status: "ACTIVE",
  balance: 1520.5,
  nick: "ze",
};

describe("compare (PRD-07)", () => {
  it("objeto igual → zero findings", () => {
    expect(compare(user, good)).toEqual([]);
  });

  it("balance string vs number → Breaking (caso §22)", () => {
    const findings = compare(user, { ...good, balance: "1500.00" });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ path: "balance", severity: "breaking" });
  });

  it("enum fora da lista → Breaking", () => {
    const findings = compare(user, { ...good, status: "SUSPENDED" });
    expect(findings.some((f) => f.path === "status" && f.severity === "breaking")).toBe(true);
  });

  it("required ausente → Breaking; opcional ausente → ok", () => {
    const { email: _drop, nick: _drop2, ...rest } = good;
    const findings = compare(user, rest);
    expect(findings.some((f) => f.path === "email" && f.severity === "breaking")).toBe(true);
    expect(findings.some((f) => f.path === "nick")).toBe(false);
  });

  it("campo extra → Warning, nunca Breaking", () => {
    const findings = compare(user, { ...good, apelido: "zé" });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ path: "apelido", severity: "warning" });
  });

  it("resposta não-objeto → Breaking", () => {
    expect(compare(user, [1, 2])[0].severity).toBe("breaking");
  });

  it("ref/array comparam raso: array ok, ref aceita id ou objeto", () => {
    const s: Schema = {
      name: "O",
      fields: [
        { name: "id", type: "uuid", required: true },
        { name: "owner", type: "ref", ref: "User" },
        { name: "tags", type: "array" },
      ],
    };
    expect(compare(s, { id: "1", owner: "u1", tags: ["a"] })).toEqual([]);
    expect(compare(s, { id: "1", owner: { id: "u1" }, tags: ["a"] })).toEqual([]);
    expect(compare(s, { id: "1", owner: 42, tags: "x" }).filter((f) => f.severity === "breaking")).toHaveLength(2);
  });
});

describe("kindOf", () => {
  it("rotula todos os tipos de recebido", () => {
    expect(kindOf(undefined)).toBe("ausente");
    expect(kindOf(null)).toBe("null");
    expect(kindOf([1])).toBe("array");
    expect(kindOf(true)).toBe("boolean");
    expect(kindOf(Symbol("s"))).toBe("symbol");
    expect(kindOf("abc")).toContain("string");
  });
});

describe("validateLive contra mock local", () => {
  it("mock íntegro → compatible sem breaking", async () => {
    const server = createMockServer([user], { config: { port: 0 } });
    const port = await server.listen();
    const reports = await validateLive([user], `http://127.0.0.1:${port}`);
    expect(reports).toHaveLength(1);
    expect(reports[0].breaking).toBe(0);
    expect(reports[0].compatible).toBeGreaterThan(0);
    const total = summarize(reports);
    expect(total.breaking).toBe(0);
    expect(total.checked).toBe(5);
    expect(total.skipped).toBe(0);
    await server.close();
  });

  it("base inalcançável → erro por endpoint, sem crash", async () => {
    const reports = await validateLive([user], "http://127.0.0.1:1", { timeoutMs: 1000 });
    expect(reports[0].error).toMatch(/rede|timeout/i);
    expect(summarize(reports).breaking).toBe(1);
  });

  it("resposta não-JSON e HTTP error viram erro por endpoint", async () => {
    const { createServer } = await import("node:http");
    let mode: "plain" | "error" = "plain";
    const srv = createServer((req, res) => {
      if (mode === "plain") {
        res.setHeader("content-type", "text/plain");
        res.end("não-json");
        return;
      }
      res.statusCode = 500;
      res.end("{}");
    });
    await new Promise<void>((resolve) => srv.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;

    const plain = await validateLive([user], base);
    expect(plain[0].error).toMatch(/não-JSON/);

    mode = "error";
    const failed = await validateLive([user], base);
    expect(failed[0].error).toMatch(/HTTP 500/);
    await new Promise<void>((resolve) => srv.close(() => resolve()));
  });
});

describe("v1.5.0 — rotas custom no validate", () => {
  it("valida a rota kind list customizada", async () => {
    const custom: Schema = {
      ...user,
      name: "Account",
      routes: [
        { method: "GET", path: "/v1/accounts", kind: "list" },
        { method: "GET", path: "/v1/accounts/:id", kind: "item" },
      ],
    };
    const server = createMockServer([custom], { config: { port: 0 } });
    const port = await server.listen();
    try {
      const reports = await validateLive([custom], `http://127.0.0.1:${port}`);
      expect(reports[0].endpoint).toBe("GET /v1/accounts");
      expect(reports[0].breaking).toBe(0);
      expect(reports[0].compatible).toBeGreaterThan(0);
    } finally {
      await server.close();
    }
  });

  it("pula Schema sem rota de coleção sem contar breaking", async () => {
    const custom: Schema = {
      ...user,
      name: "Account",
      routes: [{ method: "GET", path: "/v1/accounts/:id", kind: "item" }],
    };
    const reports = await validateLive([custom], "http://127.0.0.1:1", { timeoutMs: 500 });
    expect(reports[0].skipped).toMatch(/Sem rota de coleção/);
    expect(summarize(reports).breaking).toBe(0);
    expect(summarize(reports).skipped).toBe(1);
    expect(summarize(reports).checked).toBe(0);
  });

  it("pula GET custom que não é kind list", async () => {
    const custom: Schema = {
      ...user,
      name: "Account",
      routes: [
        {
          method: "GET",
          path: "/health",
          kind: "custom",
          response: { status: 200, body: { ok: true } },
        },
      ],
    };
    const reports = await validateLive([custom], "http://127.0.0.1:1", { timeoutMs: 500 });
    expect(reports[0].skipped).toMatch(/Sem rota de coleção/);
    expect(summarize(reports).breaking).toBe(0);
  });

  it("escolhe a list de coleção quando há uma aninhada", async () => {
    const custom: Schema = {
      ...user,
      name: "Account",
      routes: [
        { method: "GET", path: "/v1/accounts/:id/posts", kind: "list" },
        { method: "GET", path: "/v1/accounts", kind: "list" },
      ],
    };
    const server = createMockServer([custom], { config: { port: 0 } });
    const port = await server.listen();
    try {
      const reports = await validateLive([custom], `http://127.0.0.1:${port}`);
      expect(reports[0].endpoint).toBe("GET /v1/accounts");
      expect(reports[0].skipped).toBeUndefined();
      expect(reports[0].compatible).toBeGreaterThan(0);
    } finally {
      await server.close();
    }
  });
});
