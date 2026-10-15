import * as assert from "node:assert";
import * as vscode from "vscode";

suite("00 fumaça do host", () => {
  test("workspace fixture aberto", () => {
    const folders = vscode.workspace.workspaceFolders;
    assert.ok(folders && folders.length > 0, "sem workspace aberto");
    assert.ok(folders[0].uri.fsPath.endsWith("fixture"), `workspace inesperado: ${folders[0].uri.fsPath}`);
  });

  test("extension ativa e comandos registrados", async () => {
    const ext = vscode.extensions.all.find((e) => e.id.includes("devmock"));
    assert.ok(ext, "extension devmock não encontrada");
    if (!ext.isActive) await ext.activate();
    assert.ok(ext.isActive, "extension não ativou");
    const cmds = await vscode.commands.getCommands(true);
    for (const c of ["devmock.init", "devmock.start", "devmock.stop", "devmock.refresh"]) {
      assert.ok(cmds.includes(c), `comando ausente: ${c}`);
    }
  });
});
