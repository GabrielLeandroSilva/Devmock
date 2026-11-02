import { describe, expect, it } from "vitest";
import SwaggerParser from "@apidevtools/swagger-parser";
import {
  ALL_ARTIFACTS,
  buildDocFor,
  buildHtmlDocs,
  buildJsonSchemas,
  buildOpenApi,
  buildTypes,
  hashSchema,
  isStale,
  mergeExportHashes,
  staleSchemas,
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

const customRoutes: Schema = {
  name: "Account",
  fields: [{ name: "id", type: "uuid", required: true }],
  routes: [
    { method: "GET", path: "/v1/accounts", kind: "list", summary: "Lista contas" },
    { method: "GET", path: "/v1/accounts/:id", kind: "item" },
    {
      method: "POST",
      path: "/auth/login",
      kind: "custom",
      response: { status: 200, body: { token: "x" } },
    },
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
    expect(doc.paths["/users/{id}"].put).toMatchObject({
      requestBody: { required: true },
      responses: { "200": { description: "User updated." } },
    });
    expect(doc.paths["/users/{id}"].patch).toMatchObject({
      requestBody: { required: true },
      responses: { "200": { description: "User updated." } },
    });
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

  it("valida em swagger-parser sem erros (aceite PRD-05)", async () => {
    const api = (await SwaggerParser.validate(
      JSON.parse(JSON.stringify(buildOpenApi([user, order]))),
    )) as unknown as { openapi: string };
    expect(api.openapi.startsWith("3.")).toBe(true);
  }, 30000);
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

  it("cobre todos os tipos de campo", () => {
    const full: Schema = {
      name: "Full",
      fields: [
        { name: "id", type: "uuid", required: true },
        { name: "b", type: "boolean" },
        { name: "d", type: "date" },
        { name: "dt", type: "datetime" },
        { name: "img", type: "image" },
        { name: "r", type: "ref" },
        { name: "r2", type: "ref", ref: "User" },
        { name: "a", type: "array" },
        { name: "a2", type: "array", ref: "User" },
        { name: "n", type: "number" },
      ],
    };
    const js = buildJsonSchemas([full]).Full as any;
    expect(js.properties.b).toEqual({ type: "boolean" });
    expect(js.properties.d).toEqual({ type: "string", format: "date" });
    expect(js.properties.r).toEqual({ type: "string" });
    expect(js.properties.r2).toEqual({ $ref: "#/components/schemas/User" });
    expect(js.properties.a2.items).toEqual({ $ref: "#/components/schemas/User" });

    const ts = buildTypes([full]);
    expect(ts).toContain("b?: boolean;");
    expect(ts).toContain("a2?: User[];");

    const md = buildDocFor(full);
    expect(md).toContain("ref → User");

    const doc = buildOpenApi([{ name: "NoReq", fields: [{ name: "x", type: "string" }] }]) as any;
    expect(doc.components.schemas.NoReq.required).toBeUndefined();
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

  it("Response 200 é JSON válido (data é array, total é número)", () => {
    const md = buildDocFor(user);
    const match = md.match(/```json\n([\s\S]*?)\n```/);
    expect(match).not.toBeNull();
    const payload = JSON.parse(match![1]);
    expect(Array.isArray(payload.data)).toBe(true);
    expect(typeof payload.total).toBe("number");
    expect(payload.data[0].id).toBeTruthy();
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

  it("canonical lida com undefined", () => {
    expect(hashSchema(user)).toMatch(/^[0-9a-f]{16}$/);
  });

  it("W3 — HTML docs: página única com âncoras, campos e endpoints", () => {
    const html = buildHtmlDocs([user, order]);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain('id="user"');
    expect(html).toContain('href="#user"');
    expect(html).toContain("GET /users");
    expect(html).toContain("<th>Campo</th>");
  });

  it("W3 — HTML docs: offline (sem links externos) e determinístico", () => {
    const a = buildHtmlDocs([user]);
    const b = buildHtmlDocs([user]);
    expect(a).toBe(b);
    expect(a).not.toMatch(/https?:\/\//);
  });

  it("W3 — HTML docs escapa conteúdo dos campos", () => {
    const weird: Schema = {
      name: "X<y>",
      fields: [{ name: "a<b", type: "string" }],
    };
    const html = buildHtmlDocs([weird]);
    expect(html).toContain("X&lt;y&gt;");
    expect(html).toContain("a&lt;b");
    expect(html).not.toContain("<y>");
  });

  it("W3 — HTML docs: Response 200 é JSON válido (data é array)", () => {
    const html = buildHtmlDocs([user]);
    const m = html.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/);
    expect(m).not.toBeNull();
    const json = m![1]
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    const payload = JSON.parse(json);
    expect(Array.isArray(payload.data)).toBe(true);
    expect(typeof payload.total).toBe("number");
  });

  it("M4 — stale é por artefato: export parcial não marca o resto como sincronizado", () => {
    expect(staleSchemas([user], undefined)).toEqual([]); // nada exportado
    const full = mergeExportHashes(undefined, [user], ALL_ARTIFACTS);
    expect(staleSchemas([user], full)).toEqual([]);

    // Exportou só Markdown: OpenAPI/types/jsonSchema seguem desatualizados.
    const onlyMd = mergeExportHashes(undefined, [user], ["markdown"]);
    expect(staleSchemas([user], onlyMd)).toEqual(["User"]);

    // Schema mudou → todos os artefatos ficam stale.
    const changed: Schema = { ...user, fields: [...user.fields, { name: "x", type: "string" }] };
    expect(staleSchemas([changed], full)).toEqual(["User"]);
  });

  it("M4 — mergeExportHashes só toca os artefatos exportados", () => {
    const start = mergeExportHashes(undefined, [user], ["markdown"]);
    const after = mergeExportHashes(start, [user], ["openapi"]);
    expect(after.User.markdown).toBeDefined();
    expect(after.User.openapi).toBe(after.User.markdown);
    expect(after.User.types).toBeUndefined();
  });
});

describe("v1.5.0 — rotas custom no export", () => {
  it("OpenAPI reflete paths, summary e response custom", async () => {
    const doc = buildOpenApi([customRoutes]) as any;
    expect(doc.paths["/v1/accounts"].get.summary).toBe("Lista contas");
    expect(doc.paths["/v1/accounts/{id}"].get.parameters).toContainEqual({
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    });
    expect(doc.paths["/auth/login"].post.responses["200"].content["application/json"].example).toEqual({
      token: "x",
    });
    const api = (await SwaggerParser.validate(
      JSON.parse(JSON.stringify(doc)),
    )) as unknown as { openapi: string };
    expect(api.openapi.startsWith("3.")).toBe(true);
  }, 30000);

  it("Markdown lista as rotas custom", () => {
    const md = buildDocFor(customRoutes);
    expect(md).toContain("## GET /v1/accounts");
    expect(md).toContain("Lista contas");
    expect(md).toContain("## POST /auth/login");
  });

  it("HTML lista as rotas custom", () => {
    const html = buildHtmlDocs([customRoutes]);
    expect(html).toContain("GET /v1/accounts");
    expect(html).toContain("POST /auth/login");
    expect(html).toContain("Lista contas");
  });

  it("Markdown ignora response fora de custom", () => {
    const item: Schema = {
      name: "Item",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [
        {
          method: "GET",
          path: "/items/:id",
          kind: "item",
          response: { status: 418, body: { teapot: true } },
        },
      ],
    };
    const md = buildDocFor(item);
    expect(md).toContain("### Response 200");
    expect(md).not.toContain("418");
    expect(md).not.toContain("teapot");
  });

  it("OpenAPI sanitiza status inválido de rota custom", async () => {
    const invalid: Schema = {
      name: "X",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [
        {
          method: "POST",
          path: "/x",
          kind: "custom",
          response: { status: 999 as unknown as number, body: { ok: true } },
        },
      ],
    };
    const doc = buildOpenApi([invalid]) as any;
    expect(doc.paths["/x"].post.responses["200"]).toBeDefined();
    await SwaggerParser.validate(JSON.parse(JSON.stringify(doc)));
  }, 30000);

  it("OpenAPI recusa rota duplicada", () => {
    const a: Schema = {
      name: "A",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [{ method: "GET", path: "/dup", kind: "list" }],
    };
    const b: Schema = {
      name: "B",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [{ method: "GET", path: "/dup", kind: "list" }],
    };
    expect(() => buildOpenApi([a, b])).toThrow(/duplicada/i);
  });

  it("HTML sem list não mostra paginação/Response 200", () => {
    const onlyCustom: Schema = {
      name: "Auth",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [{ method: "POST", path: "/auth/login", kind: "custom", response: { status: 200 } }],
    };
    const html = buildHtmlDocs([onlyCustom]);
    expect(html).toContain("POST /auth/login");
    expect(html).not.toContain("Query Parameters");
    expect(html).not.toContain("Response 200");
  });

  it("custom 204/304 não documenta body", () => {
    const noContent: Schema = {
      name: "Note",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [
        {
          method: "DELETE",
          path: "/notes/:id",
          kind: "custom",
          response: { status: 204, body: { deleted: true } },
        },
        {
          method: "GET",
          path: "/notes/:id/cache",
          kind: "custom",
          response: { status: 304, body: { cached: true } },
        },
      ],
    };
    const md = buildDocFor(noContent);
    expect(md).toContain("### Response 204");
    expect(md).not.toContain("deleted");
    expect(md).toContain("### Response 304");
    expect(md).not.toContain("cached");
    const doc = buildOpenApi([noContent]) as any;
    expect(doc.paths["/notes/{id}"].delete.responses["204"].content).toBeUndefined();
    expect(doc.paths["/notes/{id}/cache"].get.responses["304"].content).toBeUndefined();

    const html = buildHtmlDocs([noContent]);
    expect(html).toContain("DELETE /notes/:id");
    expect(html).toContain("GET /notes/:id/cache");
    expect(html).not.toContain("Query Parameters");
    expect(html).not.toContain("deleted");
    expect(html).not.toContain("cached");
  });
});
