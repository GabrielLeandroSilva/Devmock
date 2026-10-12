import { describe, expect, it } from "vitest";
import { generate } from "../src/generators/index.js";
import { cnpjCharValue, genCnpj } from "../src/generators/br.js";
import { mulberry32 } from "../src/rng.js";
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

/** Validador espelho da regra oficial (IN RFB 2.229/2024): [A-Z0-9]{12}[0-9]{2}, DV mod 11 com ASCII-48. */
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

describe("genCnpj alfanumérico (Receita, desde 31/07/2026)", () => {
  it("gera os dois formatos coexistentes, todos com DV válido", () => {
    const rand = mulberry32("cnpj-sweep");
    let numeric = 0;
    let alpha = 0;
    for (let i = 0; i < 400; i++) {
      const c = genCnpj(rand);
      expect(validCnpj(c)).toBe(true);
      if (/[A-Z]/.test(c)) alpha++;
      else numeric++;
    }
    expect(numeric).toBeGreaterThan(0);
    expect(alpha).toBeGreaterThan(0);
  });

  it("é determinístico para o mesmo seed", () => {
    const a = genCnpj(mulberry32("x"));
    const b = genCnpj(mulberry32("x"));
    expect(a).toBe(b);
  });
});
