import * as assert from "node:assert";
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
