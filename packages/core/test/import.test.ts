import { describe, expect, it } from "vitest";
import { importOpenApi } from "../src/import/index.js";
import { validateSchema } from "../src/validator.js";

const fixture = {
  openapi: "3.0.3",
  info: { title: "Loja", version: "1.0.0" },
  paths: {
    "/users": {
      get: {
        responses: {
          "200": {
            description: "ok",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/User" } },
              },
            },
          },
        },
      },
    },
    "/external": {
      get: {
        responses: {
          "200": {
            description: "ok",
            content: {
              "application/json": {
                schema: { $ref: "https://api.exemplo.com/common.json#/Error" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id", "email"],
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          status: { type: "string", enum: ["ACTIVE", "BLOCKED"] },
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
              zip: { type: "string" },
            },
          },
          nickname: { oneOf: [{ type: "string" }, { type: "null" }] },
        },
      },
      Order: {
        type: "object",
        required: ["id", "userId"],
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { $ref: "#/components/schemas/User" },
          total: { type: "number" },
        },
      },
    },
  },
};

const fixtureYaml = `
openapi: 3.0.3
info:
  title: Mini
  version: 1.0.0
paths: {}
components:
  schemas:
    Product:
      type: object
      required:
        - id
      properties:
        id:
          type: string
          format: uuid
        price:
          type: number
`;

describe("importOpenApi (PRD-06)", () => {
  it("converte $refs, enum, required e hints de generator sem warnings", async () => {
    const { schemas, warnings } = await importOpenApi(fixture as never);
    const names = schemas.map((s) => s.name).sort();
    expect(names).toEqual(["Order", "User", "UserAddress"]);

    const user = schemas.find((s) => s.name === "User");
    expect(user?.fields.find((f) => f.name === "id")).toMatchObject({ type: "uuid", required: true });
    expect(user?.fields.find((f) => f.name === "email")).toMatchObject({ required: true, generator: "email" });
    expect(user?.fields.find((f) => f.name === "status")).toMatchObject({
      type: "enum",
      values: ["ACTIVE", "BLOCKED"],
    });

    const order = schemas.find((s) => s.name === "Order");
    expect(order?.fields.find((f) => f.name === "userId")).toMatchObject({ type: "ref", ref: "User", required: true });

    for (const s of schemas) {
      expect(validateSchema(s, names).filter((d) => d.severity === "error")).toEqual([]);
    }
    expect(warnings.join("\n")).toContain("oneOf");
  });

  it("oneOf e $ref remoto viram warnings, não erro", async () => {
    const { schemas, warnings } = await importOpenApi(fixture as never);
    expect(schemas.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes("oneOf"))).toBe(true);
    expect(warnings.some((w) => w.includes("api.exemplo.com"))).toBe(true);
  });

  it("aceita YAML string", async () => {
    const { schemas, warnings } = await importOpenApi(fixtureYaml);
    expect(schemas.map((s) => s.name)).toEqual(["Product"]);
    expect(warnings).toEqual([]);
  });

  it("rejeita não-OpenAPI com mensagem acionável", async () => {
    await expect(importOpenApi({ foo: 1 } as never)).rejects.toThrow(/OpenAPI 3/);
    await expect(importOpenApi("{json quebrado")).rejects.toThrow(/JSON/);
  });
});
