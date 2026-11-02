import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { generate } from "../generators/index.js";
import { mulberry32 } from "../rng.js";
import { DEFAULT_CONFIG, type DevMockConfig, type Schema, type SchemaRoute } from "../types.js";
import { validateProject, validateSchema } from "../validator.js";
import {
  ERROR_BODY,
  NOT_FOUND_BODY,
  paginate,
  resolveEndpoint,
  routeKey,
  SCENARIO_HEADER,
  SCENARIO_QUERY,
  schemaRoutes,
  type MockServerOptions,
  type RequestLogEntry,
} from "./routes.js";

export type { MockServerOptions, RequestLogEntry, EndpointConfig } from "./routes.js";
export { routesFor } from "./routes.js";

export interface MockServer {
  listen(): Promise<number>;
  close(): Promise<void>;
  /** Aplica nova config/cenários sem restart (PRD-04: troca imediata). */
  reload(next?: MockServerOptions): void;
  readonly port: number;
  logs(): RequestLogEntry[];
}

interface StoreEntry {
  schema: Schema;
  rows: Record<string, unknown>[];
}

interface Ctx {
  method: string;
  route: string;
  started: number;
  status: number;
  scenario: string;
  delayMs: number;
  headers?: Record<string, string>;
  reqBody?: string;
}

interface Reply {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}
const SEED_RECORDS = 20;
const CORS_ALLOW_HEADERS = `content-type, ${SCENARIO_HEADER}`;
const INVALID_JSON_BODY = { error: "INVALID_JSON", message: "Corpo JSON inválido." };

interface CompiledRoute {
  schema: Schema;
  route: SchemaRoute;
  /** Chave canônica de config/cenário/log. */
  key: string;
  segments: string[];
  /** Alias singular do base path — só no CRUD padrão (compat). */
  alias?: string;
}

function splitPath(path: string): string[] {
  return String(path ?? "").split("/").filter(Boolean);
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Estático vence `:param`; empate mantém a ordem de declaração. */
function compareRoutes(a: CompiledRoute, b: CompiledRoute): number {
  const len = Math.min(a.segments.length, b.segments.length);
  for (let i = 0; i < len; i++) {
    const aParam = a.segments[i].startsWith(":");
    const bParam = b.segments[i].startsWith(":");
    if (aParam !== bParam) return aParam ? 1 : -1;
  }
  return b.segments.length - a.segments.length;
}

function matchSegments(
  compiled: CompiledRoute,
  pathSegments: string[],
  aliased: boolean,
): Record<string, string> | undefined {
  if (compiled.segments.length !== pathSegments.length) return undefined;
  const params: Record<string, string> = {};
  for (let i = 0; i < compiled.segments.length; i++) {
    const pattern = compiled.segments[i];
    if (pattern.startsWith(":")) {
      params[pattern.slice(1)] = decodeSegment(pathSegments[i]);
      continue;
    }
    if (aliased && i === 0 && compiled.alias && decodeSegment(pathSegments[0]).toLowerCase() === compiled.alias) {
      continue;
    }
    if (pattern.toLowerCase() !== decodeSegment(pathSegments[i]).toLowerCase()) return undefined;
  }
  return params;
}

/**
 * Mock Server embutido no Core (http nativo, sem framework).
 * Precedência: cenário ativo > config do endpoint > defaults (PRD-02 §6).
 */
export function createMockServer(schemas: Schema[], opts: MockServerOptions = {}): MockServer {
  const config: DevMockConfig = { ...DEFAULT_CONFIG, ...opts.config };
  let liveOpts: MockServerOptions = { ...opts, config };

  const routeIssues = validateProject(schemas);
  const known = schemas
    .filter((schema) => schema && typeof schema === "object")
    .map((schema) => schema.name)
    .filter((name) => typeof name === "string" && name.length > 0);
  const schemaIssues: string[] = [];
  for (const schema of schemas) {
    if (!schema || typeof schema !== "object") {
      schemaIssues.push("(sem nome): Schema inválido.");
      continue;
    }
    for (const diagnostic of validateSchema(schema, known)) {
      if (diagnostic.severity === "error") {
        schemaIssues.push(`${schema.name || "(sem nome)"}: ${diagnostic.field}: ${diagnostic.message}`);
      }
    }
  }
  const issues = [...schemaIssues, ...routeIssues.map((d) => `${d.field}: ${d.message}`)];
  if (issues.length > 0) {
    throw new Error(`DevMock: schemas/rotas inválidos — ${issues.join(" ")}`);
  }

  const compiledRoutes: CompiledRoute[] = [];
  for (const schema of schemas) {
    const isDefault = !schema.routes;
    for (const route of schemaRoutes(schema)) {
      compiledRoutes.push({
        schema,
        route,
        key: routeKey(route),
        segments: splitPath(route.path),
        alias: isDefault ? schema.name.toLowerCase() : undefined,
      });
    }
  }
  compiledRoutes.sort(compareRoutes);

  const stores = new Map<string, StoreEntry>();
  for (const s of schemas) {
    stores.set(s.name.toLowerCase(), {
      schema: s,
      rows: generate(s, SEED_RECORDS, config.seedDefault),
    });
  }

  const entries: RequestLogEntry[] = [];
  const server: Server = createServer((req, res) => void handle(req, res));
  let actualPort = config.port;

  // RNG dedicado à errorRate — determinístico por seedDefault, sem tocar no RNG de dados.
  const errorRng = mulberry32(`error-rate:${config.seedDefault}`);

  function matchRoute(
    method: string,
    pathSegments: string[],
  ): { compiled: CompiledRoute; params: Record<string, string> } | undefined {
    for (const compiled of compiledRoutes) {
      if (String(compiled.route.method).toUpperCase() !== method) continue;
      const params = matchSegments(compiled, pathSegments, false);
      if (params !== undefined) return { compiled, params };
    }
    // Compat: CRUD padrão aceitava o singular do base path (/user, /user/:id).
    for (const compiled of compiledRoutes) {
      if (String(compiled.route.method).toUpperCase() !== method || !compiled.alias) continue;
      const params = matchSegments(compiled, pathSegments, true);
      if (params !== undefined) return { compiled, params };
    }
    return undefined;
  }

  /** Métodos válidos para o path (para 405 com Allow). */
  function allowedMethods(pathSegments: string[]): string[] {
    const methods = new Set<string>();
    for (const compiled of compiledRoutes) {
      const exact = matchSegments(compiled, pathSegments, false);
      const aliased = compiled.alias ? matchSegments(compiled, pathSegments, true) : undefined;
      if (exact !== undefined || aliased !== undefined) {
        methods.add(String(compiled.route.method).toUpperCase());
      }
    }
    return [...methods];
  }

  /** Injeção de falha determinística: só sobre o Default (cenário ativo tem precedência). */
  function applyErrorRate(reply: Reply, errorRate: number, scenario: string): Reply {
    if (errorRate <= 0 || scenario !== "Default") return reply;
    if (errorRng() * 100 < errorRate) {
      return { status: 500, body: ERROR_BODY[500] };
    }
    return reply;
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const started = Date.now();
    const method = (req.method ?? "GET").toUpperCase();

    if (method === "OPTIONS") {
      sendPreflight(res);
      entries.push({
        method,
        route: req.url ?? "/",
        status: 204,
        ms: Date.now() - started,
        scenario: "Default",
      });
      return;
    }
    const { text: rawBody, tooLarge } = await drain(req);
    if (tooLarge) {
      logAndSend(res, {
        method,
        route: `${method} ${req.url ?? "/"}`,
        started,
        status: 413,
        scenario: "Default",
        delayMs: 0,
        reqBody: rawBody,
      }, { status: 413, body: { error: "PAYLOAD_TOO_LARGE", message: "Corpo acima de 1MB." } });
      return;
    }

    const url = new URL(req.url ?? "/", `http://localhost:${actualPort}`);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const matched = matchRoute(method, pathSegments);

    if (!matched) {
      const route = `${method} /${pathSegments.join("/")}`;
      const allowed = allowedMethods(pathSegments);
      if (allowed.length > 0) {
        logAndSend(res, {
          method,
          route,
          started,
          status: 405,
          scenario: "Default",
          delayMs: 0,
          reqBody: rawBody,
        }, {
          status: 405,
          body: { error: "METHOD_NOT_ALLOWED", message: "Método não permitido para esta rota." },
          headers: {
            allow: [...allowed, ...(allowed.includes("OPTIONS") ? [] : ["OPTIONS"])].join(", "),
          },
        });
        return;
      }
      logAndSend(res, {
        method,
        route,
        started,
        status: 404,
        scenario: "Default",
        delayMs: 0,
        reqBody: rawBody,
      }, { status: 404, body: NOT_FOUND_BODY });
      return;
    }

    const { compiled, params } = matched;
    const store = stores.get(compiled.schema.name.toLowerCase());
    if (!store) {
      logAndSend(res, {
        method,
        route: compiled.key,
        started,
        status: 404,
        scenario: "Default",
        delayMs: 0,
        reqBody: rawBody,
      }, { status: 404, body: NOT_FOUND_BODY });
      return;
    }

    // JSON inválido em escrita → 400 antes de cenário/endpoint mascararem (RF-10).
    const isWrite = method === "POST" || method === "PUT" || method === "PATCH";
    const parsedBody = isWrite ? parseJsonBody(rawBody) : {};
    if (parsedBody === undefined) {
      logAndSend(res, {
        method,
        route: compiled.key,
        started,
        status: 400,
        scenario: "Default",
        delayMs: 0,
        reqBody: rawBody,
      }, { status: 400, body: INVALID_JSON_BODY });
      return;
    }

    // Cenário por requisição: query vence header; ambos vencem o cenário ativo (PRD-04 RF-06/07).
    const scenarioOverride =
      url.searchParams.get(SCENARIO_QUERY)?.trim() || headerValue(req.headers[SCENARIO_HEADER]);
    const resolved = resolveEndpoint(compiled.key, liveOpts, scenarioOverride);
    const { cfg, scenario } = resolved;
    const errorRate = cfg.errorRate ?? liveOpts.config?.errorRate ?? 0;
    const reply = applyErrorRate(
      buildReply(
        compiled.route,
        params,
        store,
        url,
        cfg,
        parsedBody,
        resolved.statusExplicit,
        resolved.bodyExplicit,
      ),
      errorRate,
      scenario,
    );

    logAndSend(
      res,
      {
        method,
        route: compiled.key,
        started,
        status: reply.status,
        scenario,
        delayMs: cfg.delayMs,
        headers: cfg.headers,
        reqBody: rawBody,
      },
      reply,
    );
  }

  function buildReply(
    route: SchemaRoute,
    params: Record<string, string>,
    store: StoreEntry,
    url: URL,
    cfg: ReturnType<typeof resolveEndpoint>["cfg"],
    body: Record<string, unknown>,
    statusExplicit: boolean,
    bodyExplicit: boolean,
  ): Reply {
    if (!Number.isInteger(cfg.status) || cfg.status < 200 || cfg.status > 599) {
      return { status: 500, body: ERROR_BODY[500] };
    }

    const fallbackStatus = (): number => {
      switch (route.kind) {
        case "create":
          return 201;
        case "delete":
          return 204;
        case "custom":
          return route.response?.status ?? 200;
        default:
          return 200;
      }
    };
    const statusFor = (fallback: number): number => (statusExplicit ? cfg.status : fallback);

    // Corpo e status são independentes: cada override vence só o seu campo.
    if (bodyExplicit) {
      return { status: statusFor(fallbackStatus()), body: cfg.body };
    }
    if (statusExplicit && cfg.status >= 400) {
      const routeBody =
        route.kind === "custom" && route.response && route.response.body !== undefined
          ? route.response.body
          : undefined;
      return {
        status: cfg.status,
        body: routeBody !== undefined ? routeBody : (ERROR_BODY[cfg.status] ?? NOT_FOUND_BODY),
      };
    }

    const values = Object.values(params);
    const id = params.id ?? values[values.length - 1];

    switch (route.kind) {
      case "list": {
        const total = store.rows.length;
        const rows = store.rows.slice(0, cfg.records);
        const p = url.searchParams;
        const wantsPagination = cfg.pagination?.enabled || p.has("page") || p.has("limit");
        if (wantsPagination) {
          // B3: page/limit inválidos caem para os defaults em vez de NaN.
          const page = toPositiveInt(p.get("page") ?? cfg.pagination?.page, 1);
          const limit = toPositiveInt(p.get("limit") ?? cfg.pagination?.limit, cfg.records);
          const env = paginate(rows, page, limit);
          return { status: statusFor(200), body: { ...env, total } };
        }
        return { status: statusFor(200), body: { data: rows, total } };
      }
      case "item": {
        if (id === undefined) return { status: 404, body: NOT_FOUND_BODY };
        const row = store.rows.find((r) => String(r.id ?? "") === id);
        return row ? { status: statusFor(200), body: row } : { status: 404, body: NOT_FOUND_BODY };
      }
      case "create": {
        // B1: POST cria na sessão (201 + objeto aparece no GET seguinte).
        const created = { ...(store.rows[0] ?? {}), ...body, id: randomUUID() };
        store.rows.unshift(created);
        return {
          status: statusFor(201),
          body: created,
          headers: { location: `${route.path}/${created.id}` },
        };
      }
      case "update":
      case "patch": {
        if (id === undefined) return { status: 404, body: NOT_FOUND_BODY };
        const idx = store.rows.findIndex((r) => String(r.id ?? "") === id);
        if (idx === -1) return { status: 404, body: NOT_FOUND_BODY };
        const current = store.rows[idx];
        // PUT substitui (mantém o id); PATCH faz merge (id imutável).
        store.rows[idx] =
          route.kind === "update"
            ? { ...body, id: current.id }
            : { ...current, ...body, id: current.id };
        return { status: statusFor(200), body: store.rows[idx] };
      }
      case "delete": {
        if (id === undefined) return { status: 404, body: NOT_FOUND_BODY };
        const idx = store.rows.findIndex((r) => String(r.id ?? "") === id);
        if (idx === -1) return { status: 404, body: NOT_FOUND_BODY };
        // B1: DELETE remove da sessão (até o restart).
        store.rows.splice(idx, 1);
        return { status: statusFor(204), body: undefined };
      }
      case "custom": {
        const bodyOut =
          route.response && route.response.body !== undefined ? route.response.body : {};
        return { status: statusFor(route.response?.status ?? 200), body: bodyOut };
      }
      default:
        return { status: 404, body: NOT_FOUND_BODY };
    }
  }

  /** Corpo JSON: vazio = {}, inválido/não-objeto = undefined (400). */
  function parseJsonBody(raw: string): Record<string, unknown> | undefined {
    if (!raw.trim()) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
      return parsed as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }

  function toPositiveInt(value: unknown, fallback: number): number {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isInteger(n) && n > 0 ? n : fallback;
  }

  function logAndSend(res: ServerResponse, ctx: Ctx, reply: Reply): void {
    const send = (): void => {
      const headers: Record<string, string> = {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": CORS_ALLOW_HEADERS,
        "access-control-expose-headers": "location, allow",
        ...ctx.headers,
        ...reply.headers,
      };
      for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
      const status =
        Number.isInteger(reply.status) && reply.status >= 200 && reply.status <= 599
          ? reply.status
          : 500;
      res.statusCode = status;
      if (status === 204 || status === 304 || reply.body === undefined) {
        res.end();
      } else {
        res.end(JSON.stringify(reply.body));
      }
      const responseText = reply.body === undefined ? undefined : JSON.stringify(reply.body);
      const req = truncateBody(ctx.reqBody);
      const resBody = truncateBody(responseText);
      entries.push({
        method: ctx.method,
        route: ctx.route,
        status,
        ms: Date.now() - ctx.started,
        scenario: ctx.scenario,
        requestBody: req.text,
        responseBody: resBody.text,
        truncated: req.truncated || resBody.truncated,
      });
    };
    if (ctx.delayMs && ctx.delayMs > 0) setTimeout(send, ctx.delayMs);
    else send();
  }

  return {
    get port() {
      return actualPort;
    },
    logs: () => [...entries],
    reload: (next: MockServerOptions = {}): void => {
      liveOpts = {
        ...liveOpts,
        ...next,
        config: { ...liveOpts.config, ...next.config },
        scenarios: next.scenarios ?? liveOpts.scenarios,
        endpoints: next.endpoints ?? liveOpts.endpoints,
      };
    },
    listen: () =>
      new Promise<number>((resolve, reject) => {
        const onError = (err: unknown): void => {
          // B4: porta ocupada vira mensagem acionável (PRD-02 RF-07).
          if (err && typeof err === "object" && (err as { code?: string }).code === "EADDRINUSE") {
            reject(
              new Error(
                `DevMock: porta ${config.port} já está em uso. ` +
                  `Troque "port" em .devmock/config.json ou encerre o processo que a ocupa e tente de novo.`,
              ),
            );
            return;
          }
          reject(err);
        };
        // B5: remove o listener após sucesso para não vazar unhandled em erros tardios.
        server.once("error", onError);
        server.listen(config.port, "127.0.0.1", () => {
          server.removeListener("error", onError);
          const addr = server.address();
          actualPort = typeof addr === "object" && addr ? addr.port : config.port;
          resolve(actualPort);
        });
      }),
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        // AUD-16: encerra conexões keep-alive (navegador/fetch) para o stop não travar ~5s.
        server.closeAllConnections();
      }),
  };
}

function sendPreflight(res: ServerResponse): void {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", CORS_ALLOW_HEADERS);
  res.statusCode = 204;
  res.end();
}

/** Valor único de header (duplicados: vale o primeiro); vazio vira undefined. */
function headerValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/** Lê o corpo até o fim e o devolve como texto (B1: POST/PUT/PATCH precisam dele). */
async function drain(req: IncomingMessage): Promise<{ text: string; tooLarge: boolean }> {
  const chunks: Buffer[] = [];
  let size = 0;
  let tooLarge = false;
  await new Promise<void>((resolve) => {
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", resolve);
    req.on("close", resolve);
  });
  return { text: Buffer.concat(chunks).toString("utf8"), tooLarge };
}

const MAX_BODY_BYTES = 1024 * 1024;
const MAX_LOG_BODY = 1024;

/** Trunca o corpo do log em 1KB, sinalizando corte (PRD-02 logs com body). */
function truncateBody(text: string | undefined): { text: string | undefined; truncated: boolean } {
  if (!text) return { text: undefined, truncated: false };
  if (text.length <= MAX_LOG_BODY) return { text, truncated: false };
  return { text: text.slice(0, MAX_LOG_BODY), truncated: true };
}
