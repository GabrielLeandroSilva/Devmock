import * as assert from "node:assert";
import * as vscode from "vscode";
import { buildActions, buildQuickPickItems, type ActionState } from "../../actions.js";

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

  test("comando Ações registrado no host", async () => {
    const all = await vscode.commands.getCommands(true);
    assert.ok(all.includes("devmock.actions"), "comando devmock.actions não registrado");
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
