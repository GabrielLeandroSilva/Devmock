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

  test("Endpoints: GET coleção abre no navegador; :id não abre", () => {
    const nodes = buildTree(state(), { label: "Endpoints" });
    assert.strictEqual(nodes.length, 6);
    const collection = nodes.find((n) => n.label === "GET /users");
    assert.strictEqual(collection?.contextValue, "endpointGet");
    assert.strictEqual(collection?.command?.command, "devmock.openEndpoint");
    assert.strictEqual(collection?.description, "cenário: Empty");
    const byId = nodes.find((n) => n.label === "GET /users/:id");
    assert.strictEqual(byId?.contextValue, "endpointGet");
    assert.strictEqual(byId?.command, undefined);
    const post = nodes.find((n) => n.label === "POST /users");
    assert.strictEqual(post?.contextValue, "endpoint");
    assert.strictEqual(post?.description, undefined);
  });

  test("Scenarios marca o ativo com ✓", () => {
    const nodes = buildTree(state(), { label: "Scenarios" });
    assert.ok(nodes.some((n) => n.label === "✓ Empty"));
    assert.ok(nodes.some((n) => n.label === "Default"));
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
