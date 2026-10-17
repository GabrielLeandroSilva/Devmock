import * as assert from "node:assert";
import * as vscode from "vscode";

/**
 * Suíte de regressão por bug (host VS Code) — 1 teste por AUD.
 * Convenção: `test('AUD-xx — …')`. Ver [[07-Estrategia-Testes]].
 */
suite("regressão no host (catálogo AUD)", () => {
  test("AUD-12 — executeCommand não trava aguardando notificação (fire-and-forget)", async () => {
    // Antes do fix, `await showInformationMessage` bloqueava o comando até o clique.
    const outcome = await Promise.race([
      vscode.commands.executeCommand("devmock.init").then(() => "ok" as const),
      new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 5000)),
    ]);
    assert.strictEqual(outcome, "ok", "devmock.init travou aguardando a notificação");
  });
});
