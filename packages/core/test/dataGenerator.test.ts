import { describe, expect, it } from "vitest";
import { generate, generatorNames } from "../src/generators/index.js";
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

  it("cobre todos os tipos + generator inexistente + enum vazio", () => {
    const all: Schema = {
      name: "All",
      fields: [
        { name: "id", type: "uuid", required: true },
        { name: "s", type: "string" },
        { name: "n", type: "number" },
        { name: "b", type: "boolean" },
        { name: "d", type: "date" },
        { name: "dt", type: "datetime" },
        { name: "img", type: "image" },
        { name: "e", type: "enum", values: [] },
        { name: "r", type: "ref", ref: "User" },
        { name: "a", type: "array", ref: "User" },
        { name: "g", type: "string", generator: "nao-existe" },
      ],
    };
    const [row] = generate(all, 1, 42);
    expect(typeof row.s).toBe("string");
    expect(typeof row.n).toBe("number");
    expect(typeof row.b).toBe("boolean");
    expect(typeof row.d).toBe("string");
    expect(typeof row.dt).toBe("string");
    expect(typeof row.img).toBe("string");
    expect(row.e).toBeNull();
    expect(typeof row.r).toBe("string");
    expect(row.a).toEqual([]);
    expect(typeof row.g).toBe("string");
  });

  it("todos os geradores br.* produzem formato válido", () => {
    const br: Schema = {
      name: "Br",
      fields: [
        { name: "id", type: "uuid", required: true },
        { name: "cnpj", type: "string", generator: "br.cnpj" },
        { name: "cep", type: "string", generator: "br.cep" },
        { name: "cel", type: "string", generator: "br.celular" },
        { name: "end", type: "string", generator: "br.endereco" },
        { name: "pix", type: "string", generator: "br.pix" },
        { name: "banco", type: "string", generator: "br.banco" },
        { name: "ag", type: "string", generator: "br.agencia" },
        { name: "conta", type: "string", generator: "br.conta" },
        { name: "valor", type: "number", generator: "brl" },
      ],
    };
    const [row] = generate(br, 1, 99);
    expect(row.cep).toMatch(/^\d{5}-\d{3}$/);
    expect(row.cel).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/);
    expect(typeof row.valor).toBe("number");
    expect(String(row.conta)).toMatch(/^\d{6}-\d$/);
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

describe("genCnpj alfanumérico (Receita, desde 31/07/2026)", () => {  it("gera os dois formatos coexistentes, todos com DV válido", () => {
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

describe("generatorNames", () => {
  it("lista ordenada com globais + br.*", () => {
    const names = generatorNames();
    expect(names).toEqual([...names].sort());
    expect(names).toContain("br.cpf");
    expect(names).toContain("br.cnpj");
    expect(names).toContain("email");
  });
});
