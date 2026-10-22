import * as assert from "node:assert";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as vscode from "vscode";

suite("comandos no host (API real do VS Code)", () => {
  test("init é idempotente na fixture", async () => {
    await vscode.commands.executeCommand("devmock.init");
    await vscode.commands.executeCommand("devmock.init");
    const folders = vscode.workspace.workspaceFolders;
    assert.ok(folders && folders.length > 0);
  });

  test("start sobe HTTP real; stop derruba", async () => {
    await vscode.commands.executeCommand("devmock.start");
    try {
      const res = await fetch("http://127.0.0.1:4123/users?limit=2");
      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as { data: unknown[]; total: number };
      assert.strictEqual(body.data.length, 2);
      assert.ok(body.total >= 2);
    } finally {
      await vscode.commands.executeCommand("devmock.stop");
    }
  });

  test("segundo start informa que já roda (sem duplicar)", async () => {
    await vscode.commands.executeCommand("devmock.start");
    try {
      // Start idempotente: não quebra nem troca a porta.
      await vscode.commands.executeCommand("devmock.start");
      const res = await fetch("http://127.0.0.1:4123/users?limit=1");
      assert.strictEqual(res.status, 200);
    } finally {
      await vscode.commands.executeCommand("devmock.stop");
    }
  });

  test("applyScenario sem argumento escolhe cenário, permite cancelar e recarrega o server vivo", async () => {
    const windowApi = vscode.window as unknown as {
      showQuickPick: (...args: unknown[]) => Promise<unknown>;
    };
    const warningApi = vscode.window as unknown as {
      showWarningMessage: (...args: unknown[]) => Thenable<unknown>;
    };
    const informationApi = vscode.window as unknown as {
      showInformationMessage: (...args: unknown[]) => Thenable<unknown>;
    };
    const originalShowQuickPick = windowApi.showQuickPick;
    const originalShowWarningMessage = warningApi.showWarningMessage;
    const originalShowInformationMessage = informationApi.showInformationMessage;
    let schemaPickCount = 0;
    const warnings: unknown[] = [];
    const information: unknown[] = [];
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(root, "fixture workspace deve estar aberto");
    const configPath = join(root, ".devmock", "config.json");
    const productSchemaPath = join(root, ".devmock", "schemas", "product.json");

    windowApi.showQuickPick = async (...args: unknown[]) => {
      const items = args[0] as Array<{ label: string; route?: string; picked?: boolean }>;
      const options = args[1] as { canPickMany?: boolean };
      if (options.canPickMany) {
        schemaPickCount += 1;
        assert.deepStrictEqual(
          items
            .map((item) => [item.label, item.route])
            .sort((left, right) => String(left[0]).localeCompare(String(right[0]))),
          [
            ["Product", "GET /products"],
            ["User", "GET /users"],
          ],
        );
        assert.ok(items.every((item) => !item.picked));
        // Cancelamento não pode gravar nem alterar a resposta atual.
        if (schemaPickCount === 1) return undefined;
        if (schemaPickCount === 2) return [];
        return items;
      }

      assert.ok((items as unknown as string[]).includes("Empty"));
      return "Empty";
    };
    warningApi.showWarningMessage = (...args: unknown[]) => {
      warnings.push(args[0]);
      return Promise.resolve(undefined);
    };
    informationApi.showInformationMessage = (...args: unknown[]) => {
      information.push(args[0]);
      return Promise.resolve(undefined);
    };

    try {
      writeFileSync(
        productSchemaPath,
        JSON.stringify({ name: "Product", fields: [{ name: "id", type: "uuid", required: true }] }),
      );
      await vscode.commands.executeCommand("devmock.start");
      const before = await fetch("http://127.0.0.1:4123/users?limit=2");
      assert.strictEqual(before.status, 200);
      const beforeBody = (await before.json()) as { data: unknown[] };
      assert.ok(beforeBody.data.length > 0, "fixture deve iniciar no cenário Default");
      assert.strictEqual(
        (JSON.parse(readFileSync(configPath, "utf8")) as { activeScenarios: Record<string, string> })
          .activeScenarios["GET /users"],
        undefined,
      );

      // Sem arg, o primeiro QuickPick escolhe o cenário e o segundo seleciona Schemas.
      await vscode.commands.executeCommand("devmock.applyScenario");
      const afterCancel = await fetch("http://127.0.0.1:4123/users?limit=2");
      assert.strictEqual(afterCancel.status, 200);
      assert.ok(((await afterCancel.json()) as { data: unknown[] }).data.length > 0);
      assert.strictEqual(
        (JSON.parse(readFileSync(configPath, "utf8")) as { activeScenarios: Record<string, string> })
          .activeScenarios["GET /users"],
        undefined,
        "cancelar a multi-seleção não deve gravar config.json",
      );

      await vscode.commands.executeCommand("devmock.applyScenario");
      assert.deepStrictEqual(warnings, ["DevMock: nenhum Schema selecionado."]);
      assert.strictEqual(
        (JSON.parse(readFileSync(configPath, "utf8")) as { activeScenarios: Record<string, string> })
          .activeScenarios["GET /users"],
        undefined,
        "seleção vazia não deve gravar config.json",
      );

      await vscode.commands.executeCommand("devmock.applyScenario");
      const afterApply = await fetch("http://127.0.0.1:4123/users?limit=2");
      assert.strictEqual(afterApply.status, 200);
      const afterBody = (await afterApply.json()) as { data: unknown[]; total: number };
      assert.deepStrictEqual(afterBody, { data: [], total: 0 });
      assert.strictEqual(
        (JSON.parse(readFileSync(configPath, "utf8")) as { activeScenarios: Record<string, string> })
          .activeScenarios["GET /users"],
        "Empty",
      );
      assert.strictEqual(
        (JSON.parse(readFileSync(configPath, "utf8")) as { activeScenarios: Record<string, string> })
          .activeScenarios["GET /products"],
        "Empty",
      );
      const products = await fetch("http://127.0.0.1:4123/products?limit=2");
      assert.deepStrictEqual(await products.json(), { data: [], total: 0 });
      assert.ok(information.includes("DevMock: cenário Empty aplicado a 2 schema(s)."));
      assert.strictEqual(schemaPickCount, 3);
    } finally {
      windowApi.showQuickPick = originalShowQuickPick;
      warningApi.showWarningMessage = originalShowWarningMessage;
      informationApi.showInformationMessage = originalShowInformationMessage;
      await vscode.commands.executeCommand("devmock.stop");
      rmSync(productSchemaPath, { force: true });
    }
  });

  test("refresh não quebra e painel Studio abre", async () => {
    await vscode.commands.executeCommand("devmock.refresh");
    await vscode.commands.executeCommand("devmock.createSchema");
    // Aguarda a UI assentar (webview abre de forma assíncrona no host).
    let studio;
    for (let i = 0; i < 50 && !studio; i++) {
      await new Promise((r) => setTimeout(r, 100));
      const tabs = vscode.window.tabGroups.all.flatMap((g) => g.tabs);
      studio = tabs.find((t) => (t.label || "").includes("DevMock Studio"));
    }
    assert.ok(studio, "painel Studio deveria estar aberto");
    await vscode.window.tabGroups.close(studio!);
  });
});
