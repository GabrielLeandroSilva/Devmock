import { describe, expect, it } from "vitest";
import { createMockServer } from "../src/mock/index.js";
import { compare, summarize, validateLive } from "../src/validate/index.js";
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
    await server.close();
  });

  it("base inalcançável → erro por endpoint, sem crash", async () => {
    const reports = await validateLive([user], "http://127.0.0.1:1", { timeoutMs: 1000 });
    expect(reports[0].error).toMatch(/rede|timeout/i);
    expect(summarize(reports).breaking).toBe(1);
  });
});
