import { describe, expect, it } from "vitest";
import { validateSchema } from "../src/validator.js";
import type { Schema } from "../src/types.js";

const user = (): Schema => ({
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true },
    { name: "name", type: "string", generator: "br.nome" },
    { name: "status", type: "enum", values: ["ACTIVE", "BLOCKED", "PENDING"] },
  ],
});

describe("validateSchema", () => {
  it("aceita o Schema User do exemplo", () => {
    expect(validateSchema(user())).toEqual([]);
  });

  it("exige ao menos 1 campo required", () => {
    const s = user();
    s.fields.forEach((f) => delete f.required);
    const diags = validateSchema(s);
    expect(diags.some((d) => d.message.includes("required"))).toBe(true);
  });

  it("rejeita enum sem valores", () => {
    const s = user();
    s.fields[2].values = [];
    expect(validateSchema(s).some((d) => d.field === "status")).toBe(true);
  });

  it("aponta referência quebrada com o nome", () => {
    const s: Schema = {
      name: "Order",
      fields: [
        { name: "id", type: "uuid", required: true },
        { name: "userId", type: "ref", ref: "Customer" },
      ],
    };
    const diags = validateSchema(s, ["User", "Order"]);
    expect(diags.some((d) => d.field === "userId" && d.message.includes("Customer"))).toBe(true);
  });

  it("aceita ref conhecida", () => {
    const s: Schema = {
      name: "Order",
      fields: [
        { name: "id", type: "uuid", required: true },
        { name: "userId", type: "ref", ref: "User" },
      ],
    };
    expect(validateSchema(s, ["User", "Order"])).toEqual([]);
  });

  it("barreira de entrada: sem nome, sem fields", () => {
    expect(validateSchema({ name: "  ", fields: [] }).some((d) => d.field === "name")).toBe(true);
    expect(validateSchema({ name: "X", fields: [] }).some((d) => d.field === "fields")).toBe(true);
  });

  it("campo sem nome, duplicado e tipo inválido", () => {
    const s = {
      name: "Bad",
      fields: [
        { name: "id", type: "uuid", required: true },
        { name: "", type: "string" },
        { name: "id", type: "string" },
        { name: "x", type: "foguete" },
      ],
    } as unknown as Schema;
    const fields = validateSchema(s).map((d) => d.field);
    expect(fields).toContain("(sem nome)");
    expect(fields).toContain("id");
    expect(fields).toContain("x");
  });

  it("ref em tipo comum vira warning (não erro)", () => {
    const s: Schema = {
      name: "W",
      fields: [
        { name: "id", type: "uuid", required: true },
        { name: "codigo", type: "string", ref: "User" },
      ],
    };
    const diags = validateSchema(s, ["User"]);
    expect(diags.some((d) => d.severity === "warning")).toBe(true);
    expect(diags.some((d) => d.severity === "error")).toBe(false);
  });
});
