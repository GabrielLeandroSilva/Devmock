import * as assert from "node:assert";
import { DEFAULT_CONFIG, type Schema } from "@devmock/core";
import { buildTree, type TreeNode, type TreeState } from "../../tree.js";

const user: Schema = {
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true },
    { name: "name", type: "string" },
  ],
};

function state(over: Partial<TreeState> = {}): TreeState {
  return {
    root: "C:/projeto",
    initialized: true,
    schemas: [user],
    config: { ...DEFAULT_CONFIG, activeScenarios: { "GET /users": "Empty" } },
    serverRunning: false,
    ...over,
  };
}

function labels(nodes: TreeNode[]): string[] {
  return nodes.map((n) => n.label);
}

suite("Tree (builder puro) — T3a", () => {
  test("sem pasta aberta pede para abrir", () => {
    assert.deepStrictEqual(labels(buildTree(state({ root: undefined }))), [
      "Abra uma pasta para começar",
    ]);
  });

  test("sem .devmock oferece inicializar", () => {
    const nodes = buildTree(state({ initialized: false }));
    assert.strictEqual(nodes.length, 1);
    assert.match(nodes[0].label, /inicializar/);
    assert.strictEqual(nodes[0].command?.command, "devmock.init");
  });

  test("raiz lista as 6 seções e o estado do servidor", () => {
    assert.deepStrictEqual(labels(buildTree(state())), [
      "Schemas",
      "Endpoints",
      "Scenarios",
      "Documentation",
      "Settings",
      "Mock Server 🔴 parado",
    ]);
    const running = buildTree(state({ serverRunning: true, port: 4010 }));
    assert.strictEqual(running[running.length - 1].label, "Mock Server 🟢 localhost:4010");
  });

  test("Schemas mostra campos, cenário ativo e abre o editor", () => {
    const [node] = buildTree(state(), { label: "Schemas" });
    assert.strictEqual(node.label, "User");
    assert.strictEqual(node.description, "2 campos · cenário: Empty");
    assert.strictEqual(node.contextValue, "schema");
    assert.deepStrictEqual(node.command, {
      command: "devmock.editSchema",
      title: "Editar Schema",
      arguments: ["User"],
    });
  });

  test("Endpoints: todos abrem o menu de ações e mostram cenário", () => {
    const nodes = buildTree(state(), { label: "Endpoints" });
    assert.strictEqual(nodes.length, 6);
    for (const node of nodes) {
      assert.strictEqual(node.command?.command, "devmock.endpointActions");
      assert.match(node.description ?? "", /^cenário: /);
    }
    assert.deepStrictEqual(
      nodes.find((n) => n.label === "GET /users")?.command?.arguments,
      ["GET /users", "User"],
    );
    assert.deepStrictEqual(
      nodes.find((n) => n.label === "POST /users")?.command?.arguments,
      ["POST /users", "User"],
    );
    const collection = nodes.find((n) => n.label === "GET /users");
    assert.strictEqual(collection?.description, "cenário: Empty");
    const byId = nodes.find((n) => n.label === "GET /users/:id");
    assert.strictEqual(byId?.contextValue, "endpointGet");
    const post = nodes.find((n) => n.label === "POST /users");
    assert.strictEqual(post?.contextValue, "endpoint");
    assert.strictEqual(post?.description, "cenário: Default");
  });

  test("Endpoints: label preserva o case; argumento é a chave canônica", () => {
    const custom = state({
      schemas: [
        {
          name: "User",
          fields: [{ name: "id", type: "uuid", required: true }],
          routes: [{ method: "GET", path: "/Users", kind: "list" }],
        },
      ],
      config: { ...DEFAULT_CONFIG, activeScenarios: { "GET /users": "Empty" } },
    });
    const [node] = buildTree(custom, { label: "Endpoints" });
    assert.strictEqual(node.label, "GET /Users");
    assert.deepStrictEqual(node.command?.arguments, ["GET /users", "User"]);
    assert.strictEqual(node.description, "cenário: Empty");
  });

  test("Scenarios conta Schema com cenário em qualquer método", () => {
    const nodes = buildTree(
      state({ config: { ...DEFAULT_CONFIG, activeScenarios: { "POST /users": "Forbidden" } } }),
      { label: "Scenarios" },
    );
    const node = nodes.find((n) => n.label === "✓ Forbidden");
    assert.ok(node);
    assert.strictEqual(node?.description, "1 schema(s)");
  });

  test("Scenarios conta um Schema uma única vez mesmo com várias rotas no mesmo cenário", () => {
    const multiRoute: Schema = {
      name: "User",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [
        { method: "POST", path: "/users", kind: "create" },
        { method: "DELETE", path: "/users/:id", kind: "delete" },
      ],
    };
    const nodes = buildTree(
      state({
        schemas: [multiRoute],
        config: {
          ...DEFAULT_CONFIG,
          activeScenarios: { "POST /users": "Forbidden", "DELETE /users/:id": "Forbidden" },
        },
      }),
      { label: "Scenarios" },
    );
    const forbidden = nodes.find((node) => node.label === "✓ Forbidden");
    assert.strictEqual(forbidden?.description, "1 schema(s)");
  });

  test("Scenarios marca o ativo, conta Schemas e aplica no clique", () => {
    const nodes = buildTree(state(), { label: "Scenarios" });
    const active = nodes.find((n) => n.label === "✓ Empty");
    assert.ok(active);
    assert.strictEqual(active?.description, "1 schema(s)");
    assert.strictEqual(active?.contextValue, "scenario");
    assert.strictEqual(active?.command?.command, "devmock.applyScenario");
    assert.deepStrictEqual(active?.command?.arguments, ["Empty"]);

    const idle = nodes.find((n) => n.label === "Default");
    assert.ok(idle);
    assert.strictEqual(idle?.description, undefined);
    assert.deepStrictEqual(idle?.command?.arguments, ["Default"]);
  });

  test("Scenarios: ✓ acompanha a contagem (qualquer rota)", () => {
    const nodes = buildTree(
      state({ config: { ...DEFAULT_CONFIG, activeScenarios: { "GET /users/:id": "Empty" } } }),
      { label: "Scenarios" },
    );
    const empty = nodes.find((n) => n.label === "✓ Empty");
    assert.ok(empty);
    assert.strictEqual(empty?.description, "1 schema(s)");
  });

  test("Scenarios: descrição conta cada Schema com o cenário ativo", () => {
    const order: Schema = {
      name: "Order",
      fields: [{ name: "id", type: "uuid", required: true }],
    };
    const nodes = buildTree(
      state({
        schemas: [user, order],
        config: {
          ...DEFAULT_CONFIG,
          activeScenarios: { "GET /users": "Empty", "GET /orders": "Empty" },
        },
      }),
      { label: "Scenarios" },
    );
    const empty = nodes.find((n) => n.label === "✓ Empty");
    assert.strictEqual(empty?.description, "2 schema(s)");
  });

  test("Schema usa a rota list customizada no cenário", () => {
    const custom = state({
      schemas: [
        {
          name: "User",
          fields: [{ name: "id", type: "uuid", required: true }],
          routes: [{ method: "GET", path: "/v1/Users", kind: "list" }],
        },
      ],
      config: { ...DEFAULT_CONFIG, activeScenarios: { "GET /v1/users": "Empty" } },
    });
    const [node] = buildTree(custom, { label: "Schemas" });
    assert.match(node.description ?? "", /cenário: Empty/);
  });

  test("Documentation e Settings refletem o Schema e a config", () => {
    assert.deepStrictEqual(labels(buildTree(state(), { label: "Documentation" })), ["User.md"]);
    const settings = buildTree(state(), { label: "Settings" });
    assert.deepStrictEqual(labels(settings).slice(0, 3), [
      `port: ${DEFAULT_CONFIG.port}`,
      `seedDefault: ${DEFAULT_CONFIG.seedDefault}`,
      `localeDefault: ${DEFAULT_CONFIG.localeDefault}`,
    ]);
    assert.strictEqual(settings[3].command?.command, "devmock.setErrorRate");
  });

  test("nó folha/desconhecido não tem filhos", () => {
    assert.deepStrictEqual(buildTree(state(), { label: "Mock Server 🔴 parado" }), []);
  });
});
