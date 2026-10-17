import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDocFor,
  buildJsonSchemas,
  buildOpenApi,
  buildTypes,
  createMockServer,
  DEFAULT_CONFIG,
  generate,
  importOpenApi,
  mergeExportHashes,
  ALL_ARTIFACTS,
  summarize,
  toYaml,
  validateLive,
  validateSchema,
  type EndpointConfig,
  type Schema,
} from "@devmock/core";

const DIRS = ["schemas", "scenarios", "docs", "openapi"];

function usage(): void {
  console.log(`DevMock — API Contract & Mocking for Front-end

Uso: devmock init [dir]              cria .devmock/ no diretório
      devmock start [dir]             inicia o Mock Server (padrão :${DEFAULT_CONFIG.port})
      devmock import <arquivo> [dir] [--force]   importa OpenAPI → schemas/
      devmock validate <baseUrl> [dir]           valida a API real contra o contrato
      devmock generate <schema> [dir] [--records N] [--seed S] [--out arq]   gera fake data
      devmock export [dir]            exporta o contrato (5 artefatos + hashes)
`);
}

function cmdInit(cwd: string): void {
  const root = join(cwd, ".devmock");
  mkdirSync(root, { recursive: true });
  for (const d of DIRS) mkdirSync(join(root, d), { recursive: true });
  const configPath = join(root, "config.json");
  if (!existsSync(configPath)) {
    writeFileSync(configPath, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`);
  }
  console.log("DevMock: projeto inicializado em .devmock/");
}

async function cmdStart(cwd: string): Promise<void> {
  const dir = join(cwd, ".devmock");
  if (!existsSync(dir)) {
    console.error("DevMock: sem .devmock/ — rode `devmock init` primeiro.");
    process.exitCode = 1;
    return;
  }
  // B7: JSON corrompido vira mensagem acionável em vez de stack.
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(readFileSync(join(dir, "config.json"), "utf8")) as Record<string, unknown>;
  } catch {
    console.error("DevMock: .devmock/config.json inválido — corrija o JSON ou apague o arquivo e rode `devmock init` de novo.");
    process.exitCode = 1;
    return;
  }
  const { schemas, scenarios, warnings } = loadProject(dir);
  for (const w of warnings) console.error(`DevMock: aviso: ${w}`);
  if (schemas.length === 0) {
    console.error("DevMock: nenhum Schema válido em .devmock/schemas/ — crie um via `Create API > From scratch`.");
    process.exitCode = 1;
    return;
  }

  const server = createMockServer(schemas, { config, scenarios });
  let port: number;
  try {
    port = await server.listen();
  } catch (err) {
    console.error(`DevMock: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
    return;
  }
  console.log(`DevMock 🟢 http://localhost:${port}`);
  console.log(`Schemas: ${schemas.length} · cenários ativos: ${Object.keys(config.activeScenarios ?? {}).length}`);
  console.log("Ctrl+C para encerrar.");

  process.on("SIGINT", () => {
    void server.close().then(() => process.exit(0));
  });
}

/** Lê schemas/ e scenarios/ do projeto (1 JSON por Schema/cenário — ADR-002). */
function loadProject(dir: string): {
  schemas: Schema[];
  scenarios: Record<string, Record<string, EndpointConfig>>;
  warnings: string[];
} {
  const schemas: Schema[] = [];
  const scenarios: Record<string, Record<string, EndpointConfig>> = {};
  const warnings: string[] = [];

  const schemasDir = join(dir, "schemas");
  if (existsSync(schemasDir)) {
    for (const f of readdirSync(schemasDir).filter((x) => x.endsWith(".json"))) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(join(schemasDir, f), "utf8")) as unknown;
      } catch {
        warnings.push(`${f} ignorado: JSON inválido.`);
        continue;
      }
      const diags = validateSchema(parsed as Schema);
      if (diags.some((d) => d.severity === "error")) {
        warnings.push(`${f} ignorado: ${diags.find((d) => d.severity === "error")?.message ?? "schema inválido"}`);
        continue;
      }
      schemas.push(parsed as Schema);
    }
  }

  const scenariosDir = join(dir, "scenarios");
  if (existsSync(scenariosDir)) {
    for (const f of readdirSync(scenariosDir).filter((x) => x.endsWith(".json"))) {
      let file: Record<string, Record<string, EndpointConfig>>;
      try {
        file = JSON.parse(readFileSync(join(scenariosDir, f), "utf8")) as Record<
          string,
          Record<string, EndpointConfig>
        >;
      } catch {
        warnings.push(`${f} ignorado: JSON inválido.`);
        continue;
      }
      for (const [endpoint, map] of Object.entries(file)) {
        scenarios[endpoint] = { ...(scenarios[endpoint] ?? {}), ...map };
      }
    }
  }

  return { schemas, scenarios, warnings };
}

const [cmd, ...rest] = process.argv.slice(2);

function flag(args: string[], name: string): boolean {
  return args.includes(`--${name}`);
}

switch (cmd) {
  case "init":
    cmdInit(rest[0] ?? process.cwd());
    break;
  case "start":
    void cmdStart(rest[0] ?? process.cwd());
    break;
  case "import":
    void cmdImport(rest);
    break;
  case "validate":
    void cmdValidate(rest);
    break;
  case "generate":
    cmdGenerate(rest);
    break;
  case "export":
    cmdExport(rest);
    break;
  default:
    usage();
}

/** Valida a API real contra o contrato (PRD-07 RF-06: exit 1 com breaking). */
async function cmdValidate(args: string[]): Promise<void> {
  const [baseUrl, maybeDir] = args.filter((a) => !a.startsWith("--"));
  if (!baseUrl) {
    console.error("DevMock: informe a URL — `devmock validate http://api.real [dir]`.");
    process.exitCode = 1;
    return;
  }
  const dir = join(maybeDir ?? process.cwd(), ".devmock");
  if (!existsSync(dir)) {
    console.error("DevMock: sem .devmock/ — rode `devmock init` primeiro.");
    process.exitCode = 1;
    return;
  }
  const { schemas, warnings } = loadProject(dir);
  for (const w of warnings) console.error(`DevMock: aviso: ${w}`);
  if (schemas.length === 0) {
    console.error("DevMock: nenhum Schema válido em .devmock/schemas/.");
    process.exitCode = 1;
    return;
  }
  const reports = await validateLive(schemas, baseUrl);
  for (const r of reports) {
    if (r.error) {
      console.log(`✕ ${r.endpoint} — erro: ${r.error}`);
      continue;
    }
    const icon = r.breaking > 0 ? "✕" : r.warnings > 0 ? "⚠" : "✓";
    console.log(`${icon} ${r.endpoint} — ${r.compatible} compatible, ${r.warnings} warnings, ${r.breaking} breaking (${r.checked} verificados)`);
    for (const f of r.findings) {
      console.log(`    ${f.severity === "breaking" ? "✕" : "⚠"} ${f.path}: esperado ${f.expected}, recebido ${f.received} — ${f.message}`);
    }
  }
  const total = summarize(reports);
  console.log(`\n${total.compatible} compatible, ${total.warnings} warnings, ${total.breaking} breaking.`);
  if (total.breaking > 0) process.exitCode = 1;
}

/** Importa OpenAPI → schemas/*.json (PRD-06 RF-05). */
async function cmdImport(args: string[]): Promise<void> {
  const [file, maybeDir] = args.filter((a) => !a.startsWith("--"));
  const force = flag(args, "force");
  if (!file) {
    console.error("DevMock: informe o arquivo — `devmock import openapi.json [dir] [--force]`.");
    process.exitCode = 1;
    return;
  }
  const dir = join(maybeDir ?? process.cwd(), ".devmock");
  if (!existsSync(dir)) {
    console.error("DevMock: sem .devmock/ — rode `devmock init` primeiro.");
    process.exitCode = 1;
    return;
  }
  let content: string;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    console.error(`DevMock: não foi possível ler "${file}".`);
    process.exitCode = 1;
    return;
  }
  let imported;
  try {
    imported = await importOpenApi(content);
  } catch (err) {
    console.error(`DevMock: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
    return;
  }
  const schemasDir = join(dir, "schemas");
  mkdirSync(schemasDir, { recursive: true });
  let created = 0;
  let skipped = 0;
  for (const s of imported.schemas) {
    const target = join(schemasDir, `${s.name.toLowerCase()}.json`);
    if (existsSync(target) && !force) {
      console.log(`Pulando ${s.name} (já existe — use --force para sobrescrever).`);
      skipped++;
      continue;
    }
    writeFileSync(target, `${JSON.stringify(s, null, 2)}\n`);
    created++;
  }
  for (const w of imported.warnings) console.error(`DevMock: aviso: ${w}`);
  console.log(`DevMock: ${created} schema(s) criado(s), ${skipped} pulado(s).`);
}

function opt(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

function toPositiveIntOr(value: string | undefined, fallback: number): number {
  const n = value === undefined ? NaN : Number(value);
  return Number.isInteger(n) && (n as number) > 0 ? (n as number) : fallback;
}

/** Gera fake data no stdout ou em arquivo (PRD-08 RF-01). */
function cmdGenerate(args: string[]): void {
  const positional = args.filter((a) => !a.startsWith("--"));
  const [schemaName, maybeDir] = positional;
  if (!schemaName) {
    console.error("DevMock: informe o schema — `devmock generate User [dir] [--records N] [--seed S] [--out arq]`.");
    process.exitCode = 1;
    return;
  }
  const dir = join(maybeDir ?? process.cwd(), ".devmock");
  if (!existsSync(dir)) {
    console.error("DevMock: sem .devmock/ — rode `devmock init` primeiro.");
    process.exitCode = 1;
    return;
  }
  const { schemas, warnings } = loadProject(dir);
  for (const w of warnings) console.error(`DevMock: aviso: ${w}`);
  const schema = schemas.find((s) => s.name.toLowerCase() === schemaName.toLowerCase());
  if (!schema) {
    console.error(`DevMock: schema "${schemaName}" não encontrado em .devmock/schemas/.`);
    process.exitCode = 1;
    return;
  }
  let seed: number | string = DEFAULT_CONFIG.seedDefault;
  try {
    const cfg = JSON.parse(readFileSync(join(dir, "config.json"), "utf8")) as { seedDefault?: number };
    if (typeof cfg.seedDefault === "number") seed = cfg.seedDefault;
  } catch {
    // config ilegível: segue com o default (start já acusa com mensagem própria).
  }
  const seedArg = opt(args, "seed");
  if (seedArg !== undefined) seed = /^\d+$/.test(seedArg) ? Number(seedArg) : seedArg;
  const rows = generate(schema, toPositiveIntOr(opt(args, "records"), 20), seed);
  const out = opt(args, "out");
  const text = `${JSON.stringify(rows, null, 2)}\n`;
  if (out) {
    writeFileSync(out, text);
    console.log(`DevMock: ${rows.length} registro(s) em ${out} (seed ${seed}).`);
  } else {
    process.stdout.write(text);
  }
}

/** Exporta o contrato: 5 artefatos + hashes (PRD-08 RF-02, paridade com a extension). */
function cmdExport(args: string[]): void {
  const positional = args.filter((a) => !a.startsWith("--"));
  const dir = join(positional[0] ?? process.cwd(), ".devmock");
  if (!existsSync(dir)) {
    console.error("DevMock: sem .devmock/ — rode `devmock init` primeiro.");
    process.exitCode = 1;
    return;
  }
  const { schemas, warnings } = loadProject(dir);
  for (const w of warnings) console.error(`DevMock: aviso: ${w}`);
  if (schemas.length === 0) {
    console.error("DevMock: nenhum Schema válido em .devmock/schemas/.");
    process.exitCode = 1;
    return;
  }
  mkdirSync(join(dir, "openapi"), { recursive: true });
  mkdirSync(join(dir, "docs"), { recursive: true });
  writeFileSync(join(dir, "openapi", "generated.json"), `${JSON.stringify(buildOpenApi(schemas), null, 2)}\n`);
  writeFileSync(join(dir, "openapi", "generated.yaml"), toYaml(buildOpenApi(schemas)));
  writeFileSync(join(dir, "openapi", "schemas.json"), `${JSON.stringify(buildJsonSchemas(schemas), null, 2)}\n`);
  writeFileSync(join(dir, "docs", "types.ts"), buildTypes(schemas));
  for (const s of schemas) {
    writeFileSync(join(dir, "docs", `${s.name.toLowerCase()}.md`), buildDocFor(s));
  }
  const hashes = mergeExportHashes(undefined, schemas, ALL_ARTIFACTS);
  writeFileSync(join(dir, "openapi", ".hashes.json"), `${JSON.stringify(hashes, null, 2)}\n`);
  console.log(`DevMock: contrato exportado (${schemas.length} schema(s), 5 artefatos + .hashes.json).`);
}
