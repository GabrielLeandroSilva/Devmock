import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards de infra — regressão dos bugs AUD que não são unit-testáveis
 * (build, tsconfig, empacotamento, CI). Ver [[07-Estrategia-Testes]] §6.
 *
 * A raiz do monorepo é localizada subindo do cwd até o package.json com "workspaces"
 * (evita `import.meta`, proibido no build CommonJS do Core).
 */
function findRepoRoot(start: string): string {
  let dir = start;
  for (;;) {
    const pkg = resolve(dir, "package.json");
    if (existsSync(pkg)) {
      try {
        const json = JSON.parse(readFileSync(pkg, "utf8")) as { workspaces?: unknown };
        if (json.workspaces) return dir;
      } catch {
        /* package.json inválido no caminho — segue subindo */
      }
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error("raiz do monorepo não encontrada");
    dir = parent;
  }
}

const REPO = findRepoRoot(process.cwd());

function readJson(rel: string): any {
  return JSON.parse(readFileSync(resolve(REPO, rel), "utf8"));
}

function readText(rel: string): string {
  return readFileSync(resolve(REPO, rel), "utf8");
}

describe("guards de infra (regressão AUD)", () => {
  it("AUD-06 — outDir de cada pacote resolve dentro do próprio pacote", () => {
    for (const pkg of ["packages/core", "packages/cli", "apps/extension"]) {
      const tsc = readJson(`${pkg}/tsconfig.json`);
      const outDir: unknown = tsc.compilerOptions?.outDir;
      expect(outDir, `${pkg} deve declarar outDir`).toBeTruthy();
      const abs = resolve(REPO, pkg, String(outDir));
      expect(abs.startsWith(resolve(REPO, pkg)), `${pkg} outDir vazando para ${abs}`).toBe(true);
    }
  });

  it("AUD-11 — tsconfig de teste da extension não exclui src/test", () => {
    const tsc = readJson("apps/extension/test/tsconfig.test.json");
    const exclude: string[] = tsc.exclude ?? [];
    const excluiTest = exclude.some((e) => e.replace(/^\.\.\//, "").includes("src/test"));
    expect(excluiTest).toBe(false);
    expect(tsc.include).toContain("../src");
  });

  it("AUD-08 — Core empacota CommonJS (sem type:module) para o host VS Code", () => {
    const core = readJson("packages/core/package.json");
    expect(core.type).not.toBe("module");
    expect(String(core.main)).toMatch(/\.js$/);
  });

  it("AUD-14 — build da raiz compila na ordem core → cli → extension", () => {
    const build: string = readJson("package.json").scripts.build;
    const iCore = build.indexOf("@devmock/core");
    const iCli = build.indexOf("devmock-cli");
    const iExt = build.indexOf("devmock-vscode");
    expect(iCore).toBeGreaterThanOrEqual(0);
    expect(iCli).toBeGreaterThan(iCore);
    expect(iExt).toBeGreaterThan(iCli);
  });

  it("AUD-15 — CI usa o script ordenado da raiz (nunca build --workspaces)", () => {
    const ci = readText(".github/workflows/ci.yml");
    expect(ci).not.toMatch(/build\s+--workspaces/);
    expect(ci).toMatch(/run:\s*npm run build/);
  });
});
