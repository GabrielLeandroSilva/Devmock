import * as assert from "node:assert";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMockServer, type SchemaRoute } from "@devmock/core";
import { handleStudioMessage } from "../../studio.js";
import {
  doCreateDetectedSchemas,
  doDetect,
  doExport,
  doGeneratePreview,
  doImportContent,
  doSaveFakeData,
  doSetErrorRate,
  doSwitchScenario,
  doSwitchScenarios,
  doValidate,
  endpointUrl,
  formatLogEntry,
  scenarioOf,
} from "../../ops.js";
import { devmockDir, listSchemas, readConfig, staleSinceLastExport } from "../../project.js";
import { buildActions } from "../../actions.js";

suite("ops no host (fs real, sem mocks)", () => {
  let root = "";
  const fixtureDotDevmock = join(__dirname, "..", "fixture", ".devmock");

  setup(() => {
    root = mkdtempSync(join(tmpdir(), "devmock-host-"));
    cpSync(fixtureDotDevmock, join(root, ".devmock"), { recursive: true });
  });

  teardown(() => {
    rmSync(root, { recursive: true, force: true });
  });

  test("save + generate determinístico em disco", () => {
    const saved = doSaveFakeData(root, "User", 4);
    assert.strictEqual(saved.count, 4);
    assert.ok(existsSync(saved.file));
    const again = doGeneratePreview(root, "User", 4);
    assert.deepStrictEqual(JSON.parse(readFileSync(saved.file, "utf8")), again);
  });

  test("switch grava activeScenarios", () => {
    doSwitchScenario(root, "GET /users", "Empty");
    assert.strictEqual(readConfig(root).activeScenarios["GET /users"], "Empty");
  });

  test("switch multi grava vários endpoints e preserva os demais", () => {
    doSwitchScenario(root, "GET /orders", "Forbidden");
    const applied = doSwitchScenarios(
      root,
      ["GET /users", "GET /users", "GET /products"],
      "Empty",
    );
    assert.strictEqual(applied, 2);
    const cfg = readConfig(root);
    assert.strictEqual(cfg.activeScenarios["GET /users"], "Empty");
    assert.strictEqual(cfg.activeScenarios["GET /products"], "Empty");
    assert.strictEqual(cfg.activeScenarios["GET /orders"], "Forbidden");
  });

  test("export gera 6 artefatos + stale detecta mudança", () => {
    const first = doExport(root, "Tudo");
    assert.strictEqual(first.files.length, 6);
    assert.deepStrictEqual(first.stale, []);
    // Muda o schema e exporta de novo: avisa stale e sincroniza.
    const schemaPath = join(devmockDir(root), "schemas", "user.json");
    const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
    schema.fields.push({ name: "novo", type: "string" });
    writeFileSync(schemaPath, JSON.stringify(schema));
    const second = doExport(root, "Tudo");
    assert.deepStrictEqual(second.stale, ["User"]);
  });

  test("import cria, pula sem overwrite e sobrescreve com flag", async () => {
    const yaml = "openapi: 3.0.3\ninfo:\n  title: L\n  version: '1'\npaths: {}\ncomponents:\n  schemas:\n    Customer:\n      type: object\n      required: [id]\n      properties:\n        id:\n          type: string\n";
    const r1 = await doImportContent(root, yaml, false);
    assert.deepStrictEqual(r1.created, ["Customer"]);
    const r2 = await doImportContent(root, yaml, false);
    assert.deepStrictEqual(r2.skipped, ["Customer"]);
    const r3 = await doImportContent(root, yaml, true);
    assert.deepStrictEqual(r3.created, ["Customer"]);
  });

  test("validate contra mock real: compatível e quebrado", async () => {
    const server = createMockServer(
      [{ name: "User", fields: [{ name: "id", type: "uuid", required: true }] }],
      { config: { port: 0 } },
    );
    const port = await server.listen();
    try {
      const ok = await doValidate(root, `http://127.0.0.1:${port}`);
      assert.strictEqual(ok.total.breaking, 0);
      const bad = await doValidate(root, "http://127.0.0.1:1");
      assert.ok(bad.reports[0].error);
    } finally {
      await server.close();
    }
  });

  test("studio: save, preview, erro e rename com fs real", () => {
    const fields = [
      { name: "id", type: "uuid", required: true },
      { name: "name", type: "string", generator: "br.nome" },
    ];
    const saved = handleStudioMessage(
      { kind: "save", model: "User", fields },
      { root, seedDefault: 7, onSaved: () => {} },
    );
    assert.strictEqual(saved.kind, "ok");

    const preview = handleStudioMessage(
      { kind: "preview", model: "User", fields, records: 2, seed: 7 },
      { root, seedDefault: 7 },
    );
    assert.strictEqual(preview.kind, "previewResult");
    if (preview.kind === "previewResult") {
      assert.strictEqual(JSON.parse(preview.text).length, 2);
    }

    const bad = handleStudioMessage(
      { kind: "save", model: "", fields: [] },
      { root, seedDefault: 7 },
    );
    assert.strictEqual(bad.kind, "error");

    const renamed = handleStudioMessage(
      { kind: "save", model: "Users", fields },
      { root, seedDefault: 7, initial: { name: "User", fields: [] } },
    );
    assert.strictEqual(renamed.kind, "ok");
    assert.ok(existsSync(join(devmockDir(root), "schemas", "users.json")));
    assert.ok(!existsSync(join(devmockDir(root), "schemas", "user.json")));
  });

  test("studio: rotas customizadas salvam, validam e preview ignora", () => {
    const fields = [
      { name: "id", type: "uuid", required: true },
      { name: "name", type: "string", generator: "br.nome" },
    ];
    const routes: SchemaRoute[] = [
      { method: "GET", path: "/v1/route-users", kind: "list", summary: "Lista" },
      {
        method: "POST",
        path: "/route-auth/login",
        kind: "custom",
        response: { status: 201, body: { token: "x" } },
      },
    ];
    const file = join(devmockDir(root), "schemas", "routeuser.json");

    const saved = handleStudioMessage(
      { kind: "save", model: "RouteUser", fields, routes },
      { root, seedDefault: 7, onSaved: () => {} },
    );
    assert.strictEqual(saved.kind, "ok");
    assert.deepStrictEqual(JSON.parse(readFileSync(file, "utf8")).routes, routes);

    const preview = handleStudioMessage(
      {
        kind: "preview",
        model: "RouteUser",
        fields,
        routes: [{ method: "GET", path: "bad", kind: "list" }],
        records: 1,
      },
      { root, seedDefault: 7 },
    );
    assert.strictEqual(preview.kind, "previewResult");
    if (preview.kind === "previewResult") {
      assert.strictEqual(JSON.parse(preview.text).length, 1);
    }

    const empty = handleStudioMessage(
      { kind: "save", model: "RouteUser", fields, routes: [] },
      { root, seedDefault: 7 },
    );
    assert.strictEqual(empty.kind, "error");
    if (empty.kind === "error") {
      assert.match(empty.text, /Adicione ao menos 1 rota/);
    }
    const savedBeforeInvalidRoutes = readFileSync(file, "utf8");

    const invalid = handleStudioMessage(
      {
        kind: "save",
        model: "RouteUser",
        fields,
        routes: [{ method: "GET", path: "bad", kind: "list" }],
      },
      { root, seedDefault: 7 },
    );
    assert.strictEqual(invalid.kind, "error");
    assert.strictEqual(readFileSync(file, "utf8"), savedBeforeInvalidRoutes);

    // Volta ao CRUD padrão (sem routes) para não afetar os próximos testes.
    const reset = handleStudioMessage(
      { kind: "save", model: "RouteUser", fields },
      { root, seedDefault: 7, onSaved: () => {} },
    );
    assert.strictEqual(reset.kind, "ok");
    assert.strictEqual(JSON.parse(readFileSync(file, "utf8")).routes, undefined);
  });

  test("M4 — export parcial não sincroniza os demais artefatos", () => {
    doExport(root, "Tudo");
    assert.deepStrictEqual(staleSinceLastExport(root, listSchemas(root)), []);

    const schemaPath = join(devmockDir(root), "schemas", "user.json");
    const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
    schema.fields.push({ name: "novo", type: "string" });
    writeFileSync(schemaPath, JSON.stringify(schema));

    // Exporta SÓ Markdown: OpenAPI/types/jsonSchema seguem stale.
    doExport(root, "Markdown");
    assert.deepStrictEqual(staleSinceLastExport(root, listSchemas(root)), ["User"]);

    // Exporta tudo de novo → sincroniza.
    doExport(root, "Tudo");
    assert.deepStrictEqual(staleSinceLastExport(root, listSchemas(root)), []);
  });

  test("M3 — formatLogEntry mostra bodies e marca truncado", () => {
    const withBodies = formatLogEntry({
      method: "POST",
      route: "POST /users",
      status: 201,
      ms: 3,
      scenario: "Default",
      requestBody: '{"a":1}',
      responseBody: '{"id":"x"}',
      truncated: false,
    });
    assert.strictEqual(withBodies.length, 3);
    assert.ok(withBodies[1].includes("→"));
    assert.ok(withBodies[2].includes("←"));

    const cut = formatLogEntry({
      method: "GET",
      route: "GET /users",
      status: 200,
      ms: 1,
      scenario: "Default",
      responseBody: "y".repeat(1024),
      truncated: true,
    });
    assert.strictEqual(cut.length, 2);
    assert.ok(cut[1].includes("truncado"));
  });

  test("W1 — doSetErrorRate valida 0..100 e grava", () => {
    assert.strictEqual(doSetErrorRate(root, 25), 25);
    assert.strictEqual(readConfig(root).errorRate, 25);
    assert.throws(() => doSetErrorRate(root, -1));
    assert.throws(() => doSetErrorRate(root, 101));
    assert.throws(() => doSetErrorRate(root, 1.5));
  });

  test("W1 — scenarioOf e endpointUrl", () => {
    assert.strictEqual(scenarioOf({ "GET /users": "Empty" }, "GET /users"), "Empty");
    assert.strictEqual(scenarioOf({}, "GET /users"), "Default");
    assert.strictEqual(endpointUrl(4010, "GET /users"), "http://localhost:4010/users?page=1&limit=5");
    assert.strictEqual(endpointUrl(4010, "GET /users/:id"), undefined);
    assert.strictEqual(endpointUrl(4010, "POST /users"), undefined);
  });

  test("W1 — comandos/menus da Tree no package.json", () => {    const pkg = JSON.parse(readFileSync(join(__dirname, "../../../package.json"), "utf8")) as {
      contributes: {
        commands: { command: string; icon?: string }[];
        menus: Record<string, { command: string; when?: string; group?: string }[]>;
      };
    };
    const cmds = pkg.contributes.commands;
    assert.ok(cmds.some((c) => c.command === "devmock.setErrorRate"));
    assert.ok(cmds.some((c) => c.command === "devmock.openEndpoint"));
    assert.ok(cmds.some((c) => c.command === "devmock.actions"));
    assert.ok(cmds.some((c) => c.command === "devmock.applyScenario"));
    assert.strictEqual(cmds.find((c) => c.command === "devmock.actions")?.icon, "$(ellipsis)");
    assert.strictEqual(cmds.find((c) => c.command === "devmock.start")?.icon, "$(play)");
    assert.strictEqual(cmds.find((c) => c.command === "devmock.stop")?.icon, "$(debug-stop)");
    const title = pkg.contributes.menus["view/title"];
    assert.ok(title.some((m) => m.command === "devmock.actions" && m.group === "navigation@0"));
    assert.ok(title.some((m) => m.command === "devmock.refresh" && m.group === "navigation@1"), "Refresh continua no header");
    assert.ok(!title.some((m) => m.command === "devmock.createSchema"), "New Schema saiu do header");
    assert.ok(title.some((m) => m.command === "devmock.start" && m.group === "navigation@2" && /&&\s*!devmock\.serverRunning/.test(m.when ?? "")));
    assert.ok(title.some((m) => m.command === "devmock.stop" && m.group === "navigation@2" && /&&\s*devmock\.serverRunning/.test(m.when ?? "")));
    const ctx = pkg.contributes.menus["view/item/context"];
    assert.ok(!ctx.some((m) => m.command === "devmock.start" || m.command === "devmock.stop"));

    // Contrato builder ↔ package.json: um typo em ActionItem.command não passa silencioso.
    const states = [
      { initialized: false, schemaCount: 0, serverRunning: false },
      { initialized: true, schemaCount: 0, serverRunning: false },
      { initialized: true, schemaCount: 2, serverRunning: false },
      { initialized: true, schemaCount: 2, serverRunning: true },
    ];
    for (const state of states) {
      for (const action of buildActions(state)) {
        assert.ok(
          cmds.some((c) => c.command === action.command),
          `ação "${action.command}" sem comando no package.json`,
        );
      }
    }
  });

  test("W2 — doDetect encontra interfaces e cria os Schemas (ref entre eles)", () => {
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src", "types.ts"),
      "export interface Customer { id: string; name?: string; }\n" +
        "export interface Order { id: string; customer: Customer; total: number; }\n" +
        "api.get('/customers');\n",
    );
    const detected = doDetect(root);
    assert.ok(detected.schemas.some((s) => s.name === "Customer"));
    assert.ok(detected.schemas.some((s) => s.name === "Order"));
    assert.ok(detected.endpoints.some((e) => e.method === "GET" && e.path === "/customers"));

    // As duas devem ser criadas: Order referencia Customer no MESMO lote.
    const first = doCreateDetectedSchemas(root, detected.schemas);
    assert.deepStrictEqual(first.created, ["Customer", "Order"]);
    assert.ok(existsSync(join(devmockDir(root), "schemas", "customer.json")));
    assert.ok(existsSync(join(devmockDir(root), "schemas", "order.json")));

    const second = doCreateDetectedSchemas(root, detected.schemas);
    assert.deepStrictEqual(second.skipped.sort(), ["Customer", "Order"]);
  });
});
