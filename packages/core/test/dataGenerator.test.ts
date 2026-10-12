import { describe, expect, it } from "vitest";
import { generate } from "../src/generators/index.js";
import type { Schema } from "../src/types.js";

const user: Schema = {
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true },
    { name: "name", type: "string", generator: "br.nome" },
    { name: "email", type: "string", generator: "email" },
    { name: "cpf", type: "string", generator: "br.cpf" },
    { name: "status", type: "enum", values: ["ACTIVE", "BLOCKED", "PENDING"] },
    { name: "balance", type: "number", format: "BRL" },
  ],
};

function validCpf(cpf: string): boolean {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(n[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(n[9]) && calc(10) === Number(n[10]);
}

describe("generate", () => {
  it("é determinístico: mesmo seed gera JSON idêntico", () => {
    const a = generate(user, 20, 12345);
    const b = generate(user, 20, 12345);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a).toHaveLength(20);
  });

  it("seeds diferentes geram dados diferentes", () => {
    const a = JSON.stringify(generate(user, 5, 1));
    const b = JSON.stringify(generate(user, 5, 2));
    expect(a).not.toBe(b);
  });

  it("CPFs gerados passam no validador de dígito", () => {
    const rows = generate(user, 100, 7);
    for (const r of rows) {
      expect(validCpf(String(r.cpf))).toBe(true);
    }
  });

  it("balance BRL é number, nunca string", () => {
    const rows = generate(user, 50, 9);
    for (const r of rows) {
      expect(typeof r.balance).toBe("number");
    }
  });

  it("status respeita o enum fechado", () => {
    const rows = generate(user, 100, 11);
    for (const r of rows) {
      expect(["ACTIVE", "BLOCKED", "PENDING"]).toContain(r.status);
    }
  });
});
