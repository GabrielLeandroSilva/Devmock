import { describe, expect, it } from "vitest";
import {
  buildDocFor,
  buildJsonSchemas,
  buildOpenApi,
  buildTypes,
  hashSchema,
  isStale,
  toYaml,
} from "../src/export/index.js";
import type { Schema } from "../src/types.js";

const user: Schema = {
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true },
    { name: "name", type: "string", generator: "br.nome" },
    { name: "status", type: "enum", values: ["ACTIVE", "BLOCKED", "PENDING"] },
    { name: "balance", type: "number", format: "BRL" },
  ],
};

const order: Schema = {
  name: "Order",
  fields: [
    { name: "id", type: "uuid", required: true },
    { name: "userId", type: "ref", ref: "User", required: true },
    { name: "items", type: "array", ref: "User" },
  ],
};

describe("buildOpenApi (PRD-05 RF-02)", () => {
  it("gera documento 3.x com paths CRUD e components", () => {
    const doc = buildOpenApi([user, order]) as any;
    expect(doc.openapi.startsWith("3.")).toBe(true);
    expect(Object.keys(doc.paths)).toContain("/users");
    expect(Object.keys(doc.paths)).toContain("/users/{id}");
    expect(doc.paths["/users"].get.parameters.map((p: any) => p.name)).toEqual(["page", "limit"]);
    expect(doc.paths["/users"].post.responses["201"]).toBeDefined();
    expect(doc.components.schemas.User.properties.balance).toMatchObject({ type: "number" });
    expect(doc.components.schemas.User.properties.status).toEqual({
      type: "string",
      enum: ["ACTIVE", "BLOCKED", "PENDING"],
    });
    expect(doc.components.schemas.User.required).toContain("id");
  });

  it("ref vira $ref, nunca tipo inventado", () => {
    const doc = buildOpenApi([user, order]) as any;
    expect(doc.components.schemas.Order.properties.userId).toEqual({
      $ref: "#/components/schemas/User",
    });
  });
});

describe("buildTypes (PRD-05 RF-04)", () => {
  it("enum vira union, BRL vira number, required sem ?", () => {
    const ts = buildTypes([user]);
    expect(ts).toContain('status?: "ACTIVE" | "BLOCKED" | "PENDING";');
    expect(ts).toContain("balance?: number;");
    expect(ts).toContain("id: string;");
    expect(ts).not.toContain("1500.00");
  });
});

describe("buildJsonSchemas (PRD-05 RF-03)", () => {
  it("gera draft-07 com required", () => {
    const all = buildJsonSchemas([user]);
    expect(all.User.title).toBe("User");
    expect(all.User.required).toEqual(["id"]);
  });
});

describe("buildDocFor (PRD-05 RF-01)", () => {
  it("segue o template do §15", () => {
    const md = buildDocFor(user);
    expect(md).toContain("## GET /users");
    expect(md).toContain("Returns a list of User.");
    expect(md).toContain("| page | number |");
    expect(md).toContain("ACTIVE | BLOCKED | PENDING");
  });
});

describe("toYaml", () => {
  it("converte o OpenAPI com indentação e sem JSON embutido", () => {
    const yaml = toYaml(buildOpenApi([user]) as unknown as Record<string, unknown>);
    expect(yaml).toContain('openapi: "3.0.3"');
    expect(yaml).toContain("/users:");
    expect(yaml).toContain('"200":');
    expect(yaml).toContain("- name: page");
    expect(yaml).not.toContain(": {");
    expect(toYaml(buildOpenApi([user]) as unknown as Record<string, unknown>)).toBe(yaml);
  });

  it("escapa strings especiais e preserva tipos", () => {
    expect(toYaml({ a: "x: y", b: 1, c: true, d: null, e: [], f: {} })).toBe(
      'a: "x: y"\nb: 1\nc: true\nd: null\ne: []\nf: {}\n',
    );
  });
});

describe("idempotência + stale (PRD-05 §8)", () => {
  it("re-export do mesmo Schema gera saída idêntica", () => {
    expect(JSON.stringify(buildOpenApi([user, order]))).toBe(JSON.stringify(buildOpenApi([user, order])));
    expect(buildTypes([user])).toBe(buildTypes([user]));
  });

  it("hash detecta Schema desatualizado", () => {
    const h = hashSchema(user);
    expect(isStale(user, h)).toBe(false);
    expect(isStale({ ...user, fields: [...user.fields, { name: "x", type: "string" }] }, h)).toBe(true);
  });
});
