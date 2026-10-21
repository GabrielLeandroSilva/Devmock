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

const USER_SCHEMA: Schema = {
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

async function initEmpty(): Promise<void> {
  freshDir();
  expect((await cli("init", dir)).code).toBe(0);
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

describe("erros e caminhos de borda (T3b)", () => {
  it("sem comando ou comando desconhecido mostra o usage", async () => {
    freshDir();
    const noCmd = await cli();
    expect(noCmd.code).toBe(0);
    expect(noCmd.out).toMatch(/Uso: devmock/);
    const unknown = await cli("nope");
    expect(unknown.code).toBe(0);
    expect(unknown.out).toMatch(/Uso: devmock/);
  });

  it("start sem .devmock, config inválida ou sem schema falha", async () => {
    freshDir();
    const noDir = await cli("start");
    expect(noDir.code).toBe(1);
    expect(noDir.err).toMatch(/rode `devmock init`/);

    await initEmpty();
    writeFileSync(join(dir, ".devmock", "config.json"), "{oops");
    const badConfig = await cli("start");
    expect(badConfig.code).toBe(1);
    expect(badConfig.err).toMatch(/inválido/);

    writeFileSync(join(dir, ".devmock", "config.json"), JSON.stringify({ port: 0 }));
    const noSchema = await cli("start");
    expect(noSchema.code).toBe(1);
    expect(noSchema.err).toMatch(/nenhum Schema/);
  });

  it("generate sem schema/sem .devmock falha e sem --out vai ao stdout", async () => {
    freshDir();
    const noName = await cli("generate");
    expect(noName.code).toBe(1);
    expect(noName.err).toMatch(/informe o schema/);
    const noDir = await cli("generate", "User");
    expect(noDir.code).toBe(1);
    expect(noDir.err).toMatch(/rode `devmock init`/);

    await initWithUser();
    // Config ilegível: gera com o seed default em vez de quebrar.
    writeFileSync(join(dir, ".devmock", "config.json"), "not-json");
    const stdout = await cli("generate", "User", dir, "--records", "2", "--seed", "1");
    expect(stdout.code).toBe(0);
    expect(JSON.parse(stdout.out)).toHaveLength(2);
  });

  it("export sem .devmock ou sem schema falha", async () => {
    freshDir();
    const noDir = await cli("export");
    expect(noDir.code).toBe(1);
    expect(noDir.err).toMatch(/rode `devmock init`/);

    await initEmpty();
    const noSchema = await cli("export");
    expect(noSchema.code).toBe(1);
    expect(noSchema.err).toMatch(/nenhum Schema/);
  });

  it("import sem arquivo, ilegível ou inválido falha; --force sobrescreve", async () => {
    freshDir();
    const noFile = await cli("import");
    expect(noFile.code).toBe(1);
    expect(noFile.err).toMatch(/informe o arquivo/);
    const noDir = await cli("import", "x.json");
    expect(noDir.code).toBe(1);
    expect(noDir.err).toMatch(/rode `devmock init`/);

    await initEmpty();
    const missing = await cli("import", join(dir, "nope.json"));
    expect(missing.code).toBe(1);
    expect(missing.err).toMatch(/não foi possível ler/);

    writeFileSync(join(dir, "bad.json"), "{{{");
    const bad = await cli("import", join(dir, "bad.json"));
    expect(bad.code).toBe(1);
    expect(bad.err).toMatch(/inválid|OpenAPI/);

    const yaml =
      "openapi: 3.0.3\ninfo:\n  title: L\n  version: '1'\npaths: {}\ncomponents:\n  schemas:\n    Customer:\n      type: object\n      required: [id]\n      properties:\n        id:\n          type: string\n";
    writeFileSync(join(dir, "api.yaml"), yaml);
    expect((await cli("import", join(dir, "api.yaml"))).code).toBe(0);
    const forced = await cli("import", join(dir, "api.yaml"), "--force");
    expect(forced.code).toBe(0);
    expect(forced.out).toMatch(/1 schema\(s\) criado\(s\), 0 pulado\(s\)/);
  });

  it("validate sem URL/sem .devmock falha", async () => {
    freshDir();
    const noUrl = await cli("validate");
    expect(noUrl.code).toBe(1);
    expect(noUrl.err).toMatch(/informe a URL/);
    const noDir = await cli("validate", "http://127.0.0.1:1");
    expect(noDir.code).toBe(1);
    expect(noDir.err).toMatch(/rode `devmock init`/);

    await initEmpty();
    const noSchema = await cli("validate", "http://127.0.0.1:1");
    expect(noSchema.code).toBe(1);
    expect(noSchema.err).toMatch(/nenhum Schema válido/);
  });

  it("validate reporta findings de breaking", async () => {
    await initWithUser();
    const contract = {
      ...USER_SCHEMA,
      fields: [...USER_SCHEMA.fields, { name: "score", type: "number", required: true }],
    };
    writeFileSync(join(dir, ".devmock", "schemas", "user.json"), JSON.stringify(contract));
    const server = createMockServer([USER_SCHEMA], { config: { port: 0 } });
    const port = await server.listen();
    try {
      const r = await cli("validate", `http://127.0.0.1:${port}`, dir);
      expect(r.code).toBe(1);
      expect(r.out).toMatch(/breaking/);
      expect(r.out).toMatch(/score/);
    } finally {
      await server.close();
    }
  }, 30000);

  it("loadProject avisa sobre JSON inválido e Schema inválido", async () => {
    await initWithUser();
    writeFileSync(join(dir, ".devmock", "schemas", "bad-schema.json"), "{oops");
    writeFileSync(join(dir, ".devmock", "schemas", "invalid.json"), JSON.stringify({ name: "Bad", fields: [] }));
    writeFileSync(join(dir, ".devmock", "scenarios", "bad-scenario.json"), "{oops");
    writeFileSync(
      join(dir, ".devmock", "scenarios", "empty.json"),
      JSON.stringify({ "GET /users": { Empty: { status: 200, body: { data: [], total: 0 } } } }),
    );
    const r = await cli("export");
    expect(r.code).toBe(0);
    expect(r.err).toMatch(/bad-schema\.json ignorado: JSON inválido/);
    expect(r.err).toMatch(/invalid\.json ignorado: Schema precisa de ao menos um campo/);
    expect(r.err).toMatch(/bad-scenario\.json ignorado: JSON inválido/);
  });
});
