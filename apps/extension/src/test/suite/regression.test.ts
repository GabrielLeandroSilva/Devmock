import * as assert from "node:assert";
import * as vscode from "vscode";

/**
 * Suíte de regressão por bug (host VS Code) — 1 teste por AUD.
 * Convenção: `it('AUD-xx — …')`. Ver [[07-Estrategia-Testes]].
 */
suite("regressão no host (catálogo AUD)", () => {
  // A suíte do VS Code usa interface TDD (`suite`/`test`); expõe `it` local
  // para manter a convenção de rastreabilidade AUD sem mudar a interface global.
  const it = test;
  it("AUD-12 — executeCommand não trava aguardando notificação (fire-and-forget)", async () => {
    // Thenable que falha se for aguardado: prova fire-and-forget sem timeout/relógio real.
    const windowApi = vscode.window as unknown as {
      showInformationMessage: (...args: unknown[]) => PromiseLike<unknown>;
    };
    const original = windowApi.showInformationMessage;
    const forbiddenAwait = {
      then: () => {
        throw new Error("showInformationMessage foi aguardada");
      },
    } as unknown as PromiseLike<unknown>;
    windowApi.showInformationMessage = () => forbiddenAwait;
    try {
      await assert.doesNotReject(Promise.resolve(vscode.commands.executeCommand("devmock.init")));
    } finally {
      windowApi.showInformationMessage = original;
    }
  });
});
