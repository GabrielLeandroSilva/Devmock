import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createMockServer, DEFAULT_CONFIG, type EndpointConfig, type Schema } from "@devmock/core";

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
  const config = JSON.parse(readFileSync(join(dir, "config.json"), "utf8"));
  const { schemas, scenarios } = loadProject(dir);

  const server = createMockServer(schemas, { config, scenarios });
  const port = await server.listen();
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
} {
  const schemas: Schema[] = [];
  const scenarios: Record<string, Record<string, EndpointConfig>> = {};

  const schemasDir = join(dir, "schemas");
  if (existsSync(schemasDir)) {
    for (const f of readdirSync(schemasDir).filter((x) => x.endsWith(".json"))) {
      schemas.push(JSON.parse(readFileSync(join(schemasDir, f), "utf8")) as Schema);
    }
  }

  const scenariosDir = join(dir, "scenarios");
  if (existsSync(scenariosDir)) {
    for (const f of readdirSync(scenariosDir).filter((x) => x.endsWith(".json"))) {
      const file = JSON.parse(readFileSync(join(scenariosDir, f), "utf8")) as Record<
        string,
        Record<string, EndpointConfig>
      >;
      for (const [endpoint, map] of Object.entries(file)) {
        scenarios[endpoint] = { ...(scenarios[endpoint] ?? {}), ...map };
      }
    }
  }

  return { schemas, scenarios };
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
