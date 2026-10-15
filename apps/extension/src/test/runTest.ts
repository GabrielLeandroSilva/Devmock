import * as path from "node:path";
import { cpSync, existsSync, rmSync } from "node:fs";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");
    const fixturePath = path.resolve(__dirname, "./fixture");
    // tsc não copia JSON: espelha a fixture para junto dos testes compilados.
    const srcFixture = path.resolve(__dirname, "../../src/test/fixture");
    rmSync(fixturePath, { recursive: true, force: true });
    if (existsSync(srcFixture)) cpSync(srcFixture, fixturePath, { recursive: true });
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [fixturePath, "--disable-extensions"],
    });
  } catch (err) {
    console.error("Falha na rodada de integração:", err);
    process.exit(1);
  }
}

void main();
