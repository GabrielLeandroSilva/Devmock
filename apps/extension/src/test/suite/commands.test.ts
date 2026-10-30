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

  test("validate avisa quando todos os Schemas são pulados", async () => {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(root, "fixture workspace deve estar aberto");
    const schemaPath = join(root, ".devmock", "schemas", "user.json");
    const originalSchema = readFileSync(schemaPath, "utf8");
    const windowApi = vscode.window as unknown as {
      showInputBox: (...args: unknown[]) => Promise<string | undefined>;
      showWarningMessage: (...args: unknown[]) => Thenable<unknown>;
    };
    const originalShowInputBox = windowApi.showInputBox;
    const originalShowWarningMessage = windowApi.showWarningMessage;
    const warnings: unknown[] = [];

    windowApi.showInputBox = async () => "http://127.0.0.1:1";
    windowApi.showWarningMessage = (...args: unknown[]) => {
      warnings.push(args[0]);
      return Promise.resolve(undefined);
    };
    writeFileSync(
      schemaPath,
      JSON.stringify({
        ...JSON.parse(originalSchema),
        routes: [{ method: "GET", path: "/users/:id", kind: "item" }],
      }),
    );
    try {
      await vscode.commands.executeCommand("devmock.validate");
      assert.ok(
        warnings.some((message) => /nenhum endpoint validado \(1 pulado\(s\)\)/.test(String(message))),
        "deve informar que a validação não fez requests porque o Schema foi pulado",
      );
    } finally {
      windowApi.showInputBox = originalShowInputBox;
      windowApi.showWarningMessage = originalShowWarningMessage;
      writeFileSync(schemaPath, originalSchema);
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

  test("start com Schema inválido mostra erro e não sobe", async () => {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(root, "fixture workspace deve estar aberto");
    const badPath = join(root, ".devmock", "schemas", "bad-routes.json");
    const windowApi = vscode.window as unknown as {
      showErrorMessage: (...args: unknown[]) => Thenable<unknown>;
    };
    const original = windowApi.showErrorMessage;
    const errors: unknown[] = [];
    windowApi.showErrorMessage = (...args) => {
      errors.push(args[0]);
      return Promise.resolve(undefined);
    };
    try {
      writeFileSync(
        badPath,
        JSON.stringify({
          name: "Bad",
          fields: [{ name: "id", type: "uuid", required: true }],
          routes: [{ method: "GET", path: "/bad", kind: "list", response: { status: "abc" } }],
        }),
      );
      await vscode.commands.executeCommand("devmock.start");
      assert.ok(
        errors.some((e) => /inválid/i.test(String(e))),
        "deveria mostrar erro de Schema inválido",
      );
    } finally {
      windowApi.showErrorMessage = original;
      rmSync(badPath, { force: true });
      await vscode.commands.executeCommand("devmock.stop");
    }
  });

  test("switchScenario lista todas as rotas e aplica por método", async () => {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(root, "fixture workspace deve estar aberto");
    const configPath = join(root, ".devmock", "config.json");
    const before = readFileSync(configPath, "utf8");
    const windowApi = vscode.window as unknown as {
      showQuickPick: (...args: unknown[]) => Promise<unknown>;
    };
    const original = windowApi.showQuickPick;
    let endpoints: string[] = [];
    let call = 0;
    windowApi.showQuickPick = async (...args: unknown[]) => {
      call += 1;
      if (call === 1) {
        endpoints = args[0] as string[];
        return "POST /users";
      }
      return "Forbidden";
    };
    try {
      await vscode.commands.executeCommand("devmock.switchScenario");
      assert.deepStrictEqual([...endpoints].sort(), [
        "DELETE /users/:id",
        "GET /users",
        "GET /users/:id",
        "PATCH /users/:id",
        "POST /users",
        "PUT /users/:id",
      ]);
      const cfg = JSON.parse(readFileSync(configPath, "utf8")) as {
        activeScenarios: Record<string, string>;
      };
      assert.strictEqual(cfg.activeScenarios["POST /users"], "Forbidden");
    } finally {
      writeFileSync(configPath, before);
      windowApi.showQuickPick = original;
    }
  });

  test("endpointActions copia cURL de POST com body sem id", async () => {
    const windowApi = vscode.window as unknown as {
      showQuickPick: (...args: unknown[]) => Promise<unknown>;
    };
    const originalShow = windowApi.showQuickPick;
    windowApi.showQuickPick = async (...args: unknown[]) => {
      const items = args[0] as { action?: string }[];
      return items.find((item) => item.action === "curl");
    };
    try {
      await vscode.commands.executeCommand("devmock.endpointActions", "POST /users", "User");
      const copied = await vscode.env.clipboard.readText();
      assert.match(copied, /^curl -X POST 'http:\/\/localhost:4123\/users'/);
      assert.match(copied, /Content-Type: application\/json/);
      assert.match(copied, /-d '/);
      assert.match(copied, /"name":/);
      assert.doesNotMatch(copied, /"id"/);
    } finally {
      windowApi.showQuickPick = originalShow;
    }
  });

  test("endpointActions não oferece browser em GET com :id", async () => {
    const windowApi = vscode.window as unknown as {
      showQuickPick: (...args: unknown[]) => Promise<unknown>;
    };
    const original = windowApi.showQuickPick;
    let actions: string[] = [];
    windowApi.showQuickPick = async (...args: unknown[]) => {
      actions = (args[0] as { action?: string }[]).map((item) => item.action ?? "");
      return undefined;
    };
    try {
      await vscode.commands.executeCommand("devmock.endpointActions", "GET /users/:id", "User");
      assert.deepStrictEqual(actions, ["scenario", "curl"]);
    } finally {
      windowApi.showQuickPick = original;
    }
  });

  test("endpointActions encaminha browser do GET de coleção para a rota", async () => {
    const windowApi = vscode.window as unknown as {
      showQuickPick: (...args: unknown[]) => Promise<unknown>;
    };
    const commandsApi = vscode.commands as unknown as {
      executeCommand: (command: string, ...args: unknown[]) => Thenable<unknown>;
    };
    const originalShow = windowApi.showQuickPick;
    const originalExecute = commandsApi.executeCommand;
    let openedRoute: unknown;
    windowApi.showQuickPick = async (...args: unknown[]) =>
      (args[0] as { action?: string }[]).find((item) => item.action === "browser");
    commandsApi.executeCommand = (command, ...args) => {
      if (command === "devmock.endpointActions") {
        return originalExecute.call(vscode.commands, command, ...args);
      }
      if (command === "devmock.openEndpoint") {
        openedRoute = args[0];
        return Promise.resolve(undefined);
      }
      return originalExecute.call(vscode.commands, command, ...args);
    };
    try {
      await vscode.commands.executeCommand("devmock.endpointActions", "GET /users", "User");
      assert.strictEqual(openedRoute, "GET /users");
    } finally {
      windowApi.showQuickPick = originalShow;
      commandsApi.executeCommand = originalExecute;
    }
  });

  test("endpointActions copia GET :id e DELETE sem expandir $ nem incluir body", async () => {
    const windowApi = vscode.window as unknown as {
      showQuickPick: (...args: unknown[]) => Promise<unknown>;
    };
    const original = windowApi.showQuickPick;
    windowApi.showQuickPick = async (...args: unknown[]) =>
      (args[0] as { action?: string }[]).find((item) => item.action === "curl");
    try {
      await vscode.commands.executeCommand(
        "devmock.endpointActions",
        "GET /users/:id?owner=$HOME",
        "User",
      );
      assert.strictEqual(
        await vscode.env.clipboard.readText(),
        "curl -X GET 'http://localhost:4123/users/:id?owner=$HOME'",
      );

      await vscode.commands.executeCommand("devmock.endpointActions", "DELETE /users/:id", "User");
      const deleted = await vscode.env.clipboard.readText();
      assert.strictEqual(deleted, "curl -X DELETE 'http://localhost:4123/users/:id'");
      assert.doesNotMatch(deleted, /Content-Type|-d /);
    } finally {
      windowApi.showQuickPick = original;
    }
  });

  test("switchScenario com rota do menu aplica direto", async () => {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(root, "fixture workspace deve estar aberto");
    const configPath = join(root, ".devmock", "config.json");
    const before = readFileSync(configPath, "utf8");
    const windowApi = vscode.window as unknown as {
      showQuickPick: (...args: unknown[]) => Promise<unknown>;
    };
    const original = windowApi.showQuickPick;
    windowApi.showQuickPick = async () => "Forbidden";
    try {
      await vscode.commands.executeCommand("devmock.switchScenario", "PATCH /users/:id");
      const cfg = JSON.parse(readFileSync(configPath, "utf8")) as {
        activeScenarios: Record<string, string>;
      };
      assert.strictEqual(cfg.activeScenarios["PATCH /users/:id"], "Forbidden");
    } finally {
      writeFileSync(configPath, before);
      windowApi.showQuickPick = original;
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
