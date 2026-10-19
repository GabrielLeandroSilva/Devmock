import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createMockServer, type Schema } from "@devmock/core";

const run = promisify(execFile);
const BIN = fileURLToPath(new URL("../bin/devmock.js", import.meta.url));

let dir = "";

function freshDir(): string {
  dir = mkdtempSync(join(tmpdir(), "devmock-cli-"));
  return dir;
}

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = "";
});

async function cli(...args: string[]): Promise<{ code: number; out: string; err: string }> {
  try {
    const { stdout, stderr } = await run(process.execPath, [BIN, ...args], { cwd: dir });
    return { code: 0, out: stdout, err: stderr };
  } catch (e: unknown) {
    const err = e as { code?: number; stdout?: string; stderr?: string };
    return { code: err.code ?? 1, out: err.stdout ?? "", err: err.stderr ?? "" };
  }
}

const USER_SCHEMA = {
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true },
    { name: "name", type: "string", generator: "br.nome" },
  ],
};

async function initWithUser(): Promise<void> {
  freshDir();
  const r = await cli("init", dir);
  expect(r.code).toBe(0);
  writeFileSync(join(dir, ".devmock", "schemas", "user.json"), JSON.stringify(USER_SCHEMA));
  writeFileSync(
    join(dir, ".devmock", "config.json"),
    JSON.stringify({ port: 0, seedDefault: 7, localeDefault: "pt-BR", activeScenarios: {} }),
  );
}

describe("devmock cli (E2E)", () => {
  beforeAll(async () => {
    if (!existsSync(fileURLToPath(new URL("../dist/cli.js", import.meta.url)))) {
      throw new Error(" Rode `npm run build --prefix packages/cli` antes dos testes.");
    }
  });

  it("init cria .devmock/ completo", async () => {
    freshDir();
    const r = await cli("init", dir);
    expect(r.code).toBe(0);
    for (const p of ["config.json", "schemas", "scenarios", "docs", "openapi"]) {
      expect(existsSync(join(dir, ".devmock", p))).toBe(true);
    }
  });

  it("init grava config.json com os defaults (PRD-01 RF-07 / PRD-03 RF-01)", async () => {
    freshDir();
    const r = await cli("init", dir);
    expect(r.code).toBe(0);
    const cfg = JSON.parse(readFileSync(join(dir, ".devmock", "config.json"), "utf8"));
    expect(cfg).toMatchObject({ port: 4010, seedDefault: 12345, localeDefault: "pt-BR" });
  });

  it("generate é determinístico e --out grava", async () => {
    await initWithUser();
    const a = await cli("generate", "User", dir, "--records", "3", "--seed", "42", "--out", "a.json");
    expect(a.code).toBe(0);
    const b = await cli("generate", "User", dir, "--records", "3", "--seed", "42", "--out", "b.json");
    expect(b.code).toBe(0);
    expect(readFileSync(join(dir, "a.json"), "utf8")).toBe(readFileSync(join(dir, "b.json"), "utf8"));
    expect(JSON.parse(readFileSync(join(dir, "a.json"), "utf8"))).toHaveLength(3);
  });

  it("generate sem schema → exit 1 com mensagem", async () => {
    await initWithUser();
    const r = await cli("generate", "NaoExiste", dir);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/não encontrado/);
  });

  it("export gera 6 artefatos", async () => {
    await initWithUser();
    const r = await cli("export", dir);
    expect(r.code).toBe(0);
    for (const f of ["openapi/generated.json", "openapi/generated.yaml", "openapi/schemas.json", "docs/types.ts", "docs/user.md", "docs/index.html", "openapi/.hashes.json"]) {
      expect(existsSync(join(dir, ".devmock", f))).toBe(true);
    }
  });

  it("import yaml cria schema e respeita --force", async () => {
    await initWithUser();
    const yaml = "openapi: 3.0.3\ninfo:\n  title: L\n  version: '1'\npaths: {}\ncomponents:\n  schemas:\n    Customer:\n      type: object\n      required: [id]\n      properties:\n        id:\n          type: string\n";
    writeFileSync(join(dir, "api.yaml"), yaml);
    const r1 = await cli("import", join(dir, "api.yaml"), dir);
    expect(r1.code).toBe(0);
    expect(existsSync(join(dir, ".devmock", "schemas", "customer.json"))).toBe(true);
    const r2 = await cli("import", join(dir, "api.yaml"), dir);
    expect(r2.out).toMatch(/Pulando Customer/);
  });

  it("validate: compatível exit 0, quebrado exit 1", async () => {
    await initWithUser();
    const schema = { ...USER_SCHEMA, fields: [...USER_SCHEMA.fields] } as Schema;
    const server = createMockServer([schema], { config: { port: 0 } });
    const port = await server.listen();
    try {
      const ok = await cli("validate", `http://127.0.0.1:${port}`, dir);
      expect(ok.code).toBe(0);
      expect(ok.out).toMatch(/breaking/);

      const bad = await cli("validate", "http://127.0.0.1:1", dir);
      expect(bad.code).toBe(1);
    } finally {
      await server.close();
    }
  }, 30000);
});
