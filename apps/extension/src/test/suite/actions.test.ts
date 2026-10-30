import * as assert from "node:assert";
import { type Schema } from "@devmock/core";
import * as vscode from "vscode";
import { buildActions, buildCurl, buildEndpointMenu, buildQuickPickItems, buildScenarioPick, type ActionState } from "../../actions.js";

function commands(state: ActionState): string[] {
  return buildActions(state).map((a) => a.command);
}

suite("Ações da Tree (M1)", () => {
  test("sem projeto: Initialize + Refresh", () => {
    assert.deepStrictEqual(commands({ initialized: false, schemaCount: 0, serverRunning: false }), [
      "devmock.init",
      "devmock.refresh",
    ]);
  });

  test("com projeto e sem Schema: esconde ações que exigem Schema", () => {
    const cmds = commands({ initialized: true, schemaCount: 0, serverRunning: false });
    for (const c of [
      "devmock.editSchema",
      "devmock.generate",
      "devmock.saveFakeData",
      "devmock.export",
      "devmock.validate",
      "devmock.start",
      "devmock.switchScenario",
      "devmock.showLog",
    ]) {
      assert.ok(!cmds.includes(c), `${c} não deveria aparecer sem Schema`);
    }
    for (const c of [
      "devmock.createSchema",
      "devmock.createApi",
      "devmock.importApi",
      "devmock.setErrorRate",
      "devmock.refresh",
    ]) {
      assert.ok(cmds.includes(c), `${c} deveria aparecer`);
    }
  });

  test("parado com Schemas: Start (não Stop), log oculto e contrato disponível", () => {
    const cmds = commands({ initialized: true, schemaCount: 2, serverRunning: false });
    for (const c of [
      "devmock.start",
      "devmock.editSchema",
      "devmock.generate",
      "devmock.saveFakeData",
      "devmock.export",
      "devmock.validate",
      "devmock.switchScenario",
    ]) {
      assert.ok(cmds.includes(c), `${c} deveria aparecer`);
    }
    assert.ok(!cmds.includes("devmock.stop"));
    assert.ok(!cmds.includes("devmock.showLog"));
  });

  test("rodando: Stop + Show Log, sem Start", () => {
    const cmds = commands({ initialized: true, schemaCount: 2, serverRunning: true });
    assert.ok(cmds.includes("devmock.stop"));
    assert.ok(cmds.includes("devmock.showLog"));
    assert.ok(!cmds.includes("devmock.start"));
  });

  test("ações não duplicam comandos", () => {
    const cmds = commands({ initialized: true, schemaCount: 2, serverRunning: true });
    assert.strictEqual(new Set(cmds).size, cmds.length);
  });

  test("QuickPick: sem separador no topo e um por grupo", () => {
    const items = buildQuickPickItems(buildActions({ initialized: true, schemaCount: 2, serverRunning: true }));
    assert.strictEqual(items[0].kind, "item");
    assert.deepStrictEqual(
      items.filter((i) => i.kind === "separator").map((i) => i.label),
      ["Dados & contrato", "Servidor", "View"],
    );
    items.forEach((item, i) => {
      if (item.kind === "separator") assert.strictEqual(items[i + 1]?.kind, "item");
    });
  });

  test("QuickPick sem projeto: Initialize, separador View, Refresh", () => {
    const items = buildQuickPickItems(buildActions({ initialized: false, schemaCount: 0, serverRunning: false }));
    assert.deepStrictEqual(items.map((i) => i.kind), ["item", "separator", "item"]);
    assert.strictEqual(items[1].label, "View");
    assert.strictEqual(items[2].command, "devmock.refresh");
  });

  test("cenário: pick lista Schemas, rota de coleção e pré-seleciona o atual", () => {
    const schemas: Schema[] = [
      { name: "User", fields: [{ name: "id", type: "uuid", required: true }] },
      { name: "Order", fields: [{ name: "id", type: "uuid", required: true }] },
    ];
    const picks = buildScenarioPick(schemas, { activeScenarios: { "GET /users": "Empty" } }, "Empty");
    assert.deepStrictEqual(picks.map((p) => p.label), ["User", "Order"]);
    assert.deepStrictEqual(picks.map((p) => p.route), ["GET /users", "GET /orders"]);
    assert.deepStrictEqual(picks.map((p) => p.picked), [true, false]);
    assert.match(picks[0].description, /cenário: Empty · GET \/users/);
    assert.match(picks[1].description, /cenário: Default · GET \/orders/);
  });

  test("cenário: respeita a rota list customizada (canônica)", () => {
    const schema: Schema = {
      name: "User",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [
        { method: "GET", path: "/v1/Users", kind: "list" },
        { method: "GET", path: "/v1/Users/:id", kind: "item" },
      ],
    };
    const picks = buildScenarioPick([schema], { activeScenarios: { "GET /v1/users": "Empty" } }, "Empty");
    assert.deepStrictEqual(picks.map((p) => p.route), ["GET /v1/users"]);
    assert.match(picks[0].description, /GET \/v1\/Users/);
    assert.strictEqual(picks[0].picked, true);
  });

  test("cenário: Schema sem rota de coleção é omitido do pick", () => {
    const schema: Schema = {
      name: "User",
      fields: [{ name: "id", type: "uuid", required: true }],
      routes: [{ method: "GET", path: "/v1/users/:id", kind: "item" }],
    };
    assert.deepStrictEqual(buildScenarioPick([schema], { activeScenarios: {} }, "Empty"), []);
  });

  test("menu do endpoint: 3 ações no GET de coleção, 2 nos demais", () => {
    assert.deepStrictEqual(
      buildEndpointMenu("GET", "/users").map((a) => a.action),
      ["scenario", "curl", "browser"],
    );
    assert.deepStrictEqual(
      buildEndpointMenu("GET", "/users/:id").map((a) => a.action),
      ["scenario", "curl"],
    );
    assert.deepStrictEqual(
      buildEndpointMenu("POST", "/users").map((a) => a.action),
      ["scenario", "curl"],
    );
  });

  test("menu do endpoint descreve body conforme o método", () => {
    for (const method of ["POST", "PUT", "PATCH"]) {
      const curl = buildEndpointMenu(method, "/users").find((item) => item.action === "curl");
      assert.strictEqual(curl?.description, "Copiar comando com body de exemplo", method);
    }
    for (const method of ["GET", "DELETE"]) {
      const curl = buildEndpointMenu(method, "/users").find((item) => item.action === "curl");
      assert.strictEqual(curl?.description, "Copiar comando (sem body)", method);
    }
  });

  test("buildCurl monta GET e POST com body", () => {
    assert.strictEqual(
      buildCurl("GET", "http://localhost:4010/users"),
      `curl -X GET 'http://localhost:4010/users'`,
    );
    assert.strictEqual(
      buildCurl("post", "http://localhost:4010/users", `{"name":"A"}`),
      `curl -X POST 'http://localhost:4010/users' -H "Content-Type: application/json" -d '{"name":"A"}'`,
    );
  });

  test("buildCurl preserva :id e $ no path dentro de aspas POSIX", () => {
    assert.strictEqual(
      buildCurl("GET", "http://localhost:4010/users/:id?owner=$HOME"),
      "curl -X GET 'http://localhost:4010/users/:id?owner=$HOME'",
    );
  });

  test("buildCurl escapa aspas simples no body para POSIX", () => {
    assert.strictEqual(
      buildCurl("POST", "http://localhost:4010/users", `{"name":"O'Brien"}`),
      String.raw`curl -X POST 'http://localhost:4010/users' -H "Content-Type: application/json" -d '{"name":"O'\''Brien"}'`,
    );
  });

  test("buildCurl GET e DELETE sem body não adiciona header nem -d", () => {
    for (const method of ["GET", "DELETE"]) {
      const curl = buildCurl(method, "http://localhost:4010/users/:id");
      assert.strictEqual(curl, `curl -X ${method} 'http://localhost:4010/users/:id'`);
      assert.doesNotMatch(curl, /Content-Type|-d /);
    }
  });

  test("comandos Ações e Apply Scenario registrados no host", async () => {
    const all = await vscode.commands.getCommands(true);
    assert.ok(all.includes("devmock.actions"), "comando devmock.actions não registrado");
    assert.ok(all.includes("devmock.applyScenario"), "comando devmock.applyScenario não registrado");
    assert.ok(all.includes("devmock.endpointActions"), "comando devmock.endpointActions não registrado");
  });

  test("Ações encaminha a seleção Create API ao comando", async () => {
    const windowApi = vscode.window as unknown as {
      showQuickPick: (...args: unknown[]) => Promise<unknown>;
    };
    const commandsApi = vscode.commands as unknown as {
      executeCommand: (command: string, ...args: unknown[]) => Thenable<unknown>;
    };
    const originalShowQuickPick = windowApi.showQuickPick;
    const originalExecuteCommand = commandsApi.executeCommand;
    let dispatched: string | undefined;
    let childCommandSettled = false;

    windowApi.showQuickPick = async (...args: unknown[]) => {
      const picks = args[0] as Array<{ commandId?: string }>;
      const createApi = picks.find((pick) => pick.commandId === "devmock.createApi");
      assert.ok(createApi, "Create API deveria estar disponível no QuickPick");
      return createApi;
    };
    commandsApi.executeCommand = (command, ...args) => {
      if (command === "devmock.actions") {
        return originalExecuteCommand.call(vscode.commands, command, ...args);
      }
      dispatched = command;
      return new Promise<void>((resolve) => {
        setImmediate(() => {
          childCommandSettled = true;
          resolve();
        });
      });
    };

    try {
      await vscode.commands.executeCommand("devmock.actions");
      assert.strictEqual(dispatched, "devmock.createApi");
      assert.strictEqual(childCommandSettled, false, "Ações não deve aguardar o QuickPick aninhado");
    } finally {
      windowApi.showQuickPick = originalShowQuickPick;
      commandsApi.executeCommand = originalExecuteCommand;
    }
  });
});
