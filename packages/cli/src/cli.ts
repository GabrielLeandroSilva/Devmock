import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createMockServer,
  DEFAULT_CONFIG,
  validateSchema,
  type EndpointConfig,
  type Schema,
} from "@devmock/core";

const DIRS = ["schemas", "scenarios", "docs", "openapi"];

function usage(): void {
  console.log(`DevMock — API Contract & Mocking for Front-end

Uso: devmock init       cria .devmock/ no diretório atual
      devmock start     inicia o Mock Server (padrão :${DEFAULT_CONFIG.port})
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
const cwd = rest[0] ?? process.cwd();

switch (cmd) {
  case "init":
    cmdInit(cwd);
    break;
  case "start":
    void cmdStart(cwd);
    break;
  default:
    usage();
}
