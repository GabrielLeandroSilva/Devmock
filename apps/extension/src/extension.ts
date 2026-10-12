import * as vscode from "vscode";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIRS = ["schemas", "scenarios", "docs", "openapi"];

class ProjectProvider implements vscode.TreeDataProvider<string> {
  private emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(label: string): vscode.TreeItem {
    return new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
  }

  getChildren(): string[] {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return ["Abra uma pasta para começar"];
    const root = join(folders[0].uri.fsPath, ".devmock");
    if (!existsSync(root)) return ["Sem configuração — rode DevMock: Initialize Project"];
    return ["Schemas", "Endpoints", "Scenarios", "Documentation", "Settings"];
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new ProjectProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("devmock.project", provider),
    vscode.commands.registerCommand("devmock.init", async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders) {
        await vscode.window.showErrorMessage("DevMock: abra uma pasta primeiro.");
        return;
      }
      const root = join(folders[0].uri.fsPath, ".devmock");
      mkdirSync(root, { recursive: true });
      for (const d of DIRS) mkdirSync(join(root, d), { recursive: true });
      const configPath = join(root, "config.json");
      if (!existsSync(configPath)) {
        writeFileSync(
          configPath,
          JSON.stringify({ port: 4010, seedDefault: 12345, localeDefault: "pt-BR", activeScenarios: {} }, null, 2),
        );
      }
      provider.refresh();
      await vscode.window.showInformationMessage("DevMock: projeto inicializado em .devmock/");
    }),
    vscode.commands.registerCommand("devmock.start", async () => {
      await vscode.window.showInformationMessage("DevMock: Mock Server chega no EAP 1.2 (PRD-02).");
    }),
    vscode.commands.registerCommand("devmock.stop", async () => {
      await vscode.window.showInformationMessage("DevMock: nada em execução (EAP 1.2).");
    }),
  );
}

export function deactivate(): void {}
