import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { generate } from "../generators/index.js";
import { DEFAULT_CONFIG, type DevMockConfig, type Schema } from "../types.js";
import {
  ERROR_BODY,
  NOT_FOUND_BODY,
  paginate,
  plural,
  resolveEndpoint,
  type MockServerOptions,
  type RequestLogEntry,
} from "./routes.js";

export type { MockServerOptions, RequestLogEntry, EndpointConfig } from "./routes.js";
export { routesFor } from "./routes.js";

export interface MockServer {
  listen(): Promise<number>;
  close(): Promise<void>;
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
}

interface Reply {
  status: number;
  body: unknown;
}
const SEED_RECORDS = 20;

/**
 * Mock Server embutido no Core (http nativo, sem framework).
 * Precedência: cenário ativo > config do endpoint > defaults (PRD-02 §6).
 */
export function createMockServer(schemas: Schema[], opts: MockServerOptions = {}): MockServer {
  const config: DevMockConfig = { ...DEFAULT_CONFIG, ...opts.config };

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
    const rawBody = await drain(req);

    const url = new URL(req.url ?? "/", `http://localhost:${actualPort}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const store = resolveStore(parts);

    if (!store) {
      const route = `${method} /${parts.join("/")}`;
      logAndSend(res, {
        method,
        route,
        started,
        status: 404,
        scenario: "Default",
        delayMs: 0,
      }, { status: 404, body: NOT_FOUND_BODY });
      return;
    }

    // B2: routeKey sempre em minúsculas para casar com a config ("GET /users").
    const route = `${method} /${parts[0].toLowerCase()}` + (parts.length >= 2 ? "/:id" : "");
    const { cfg, scenario } = resolveEndpoint(route, { ...opts, config });
    const reply = buildReply(method, parts, store, url, cfg, rawBody);

    logAndSend(
      res,
      {
        method,
        route,
        started,
        status: reply.status,
        scenario,
        delayMs: cfg.delayMs,
        headers: cfg.headers,
      },
      reply,
    );
  }

  function buildReply(
    method: string,
    parts: string[],
    store: StoreEntry,
    url: URL,
    cfg: ReturnType<typeof resolveEndpoint>["cfg"],
    rawBody: string,
  ): Reply {
    // Cenário com corpo explícito tem precedência sobre o comportamento default.
    if (cfg.body !== undefined && cfg.body !== null) {
      return { status: cfg.status, body: cfg.body };
    }

    if (cfg.status >= 400) {
      return { status: cfg.status, body: ERROR_BODY[cfg.status] ?? NOT_FOUND_BODY };
    }

    if ((method === "GET" || method === "DELETE" || method === "PUT" || method === "PATCH") && parts.length >= 2) {
      const idx = store.rows.findIndex((r) => String(r.id ?? "") === parts[1]);
      if (idx === -1) {
        return { status: 404, body: NOT_FOUND_BODY };
      }
      if (method === "GET") {
        return { status: 200, body: store.rows[idx] };
      }
      if (method === "DELETE") {
        // B1: DELETE remove da sessão (até o restart).
        store.rows.splice(idx, 1);
        return { status: 204, body: undefined };
      }
      const patch = parseJsonBody(rawBody);
      store.rows[idx] = { ...store.rows[idx], ...patch };
      return { status: 200, body: store.rows[idx] };
    }

    if (method === "GET") {
      const total = store.rows.length;
      const rows = store.rows.slice(0, cfg.records);
      const p = url.searchParams;
      const wantsPagination =
        cfg.pagination?.enabled || (p.has("page") && p.has("limit"));
      if (wantsPagination) {
        // B3: page/limit inválidos caem para os defaults em vez de NaN.
        const page = toPositiveInt(p.get("page") ?? cfg.pagination?.page, 1);
        const limit = toPositiveInt(p.get("limit") ?? cfg.pagination?.limit, cfg.records);
        const env = paginate(rows, page, limit);
        return { status: 200, body: { ...env, total } };
      }
      return { status: 200, body: { data: rows, total } };
    }

    if (method === "POST") {
      // B1: POST cria na sessão (201 + objeto aparece no GET seguinte).
      const created = { ...(store.rows[0] ?? {}), ...parseJsonBody(rawBody), id: randomUUID() };
      store.rows.unshift(created);
      return { status: 201, body: created };
    }
    if (method === "DELETE") {
      return { status: 204, body: undefined };
    }
    return { status: 200, body: store.rows[0] ?? {} };
  }

  /** Corpo JSON best-effort: inválido/ausente vira objeto vazio (nunca quebra o mock). */
  function parseJsonBody(raw: string): Record<string, unknown> {
    if (!raw) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
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
        "access-control-allow-headers": "content-type",
        ...ctx.headers,
      };
      for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
      res.statusCode = reply.status;
      if (reply.status === 204 || reply.body === undefined) {
        res.end();
      } else {
        res.end(JSON.stringify(reply.body));
      }
      entries.push({
        method: ctx.method,
        route: ctx.route,
        status: res.statusCode,
        ms: Date.now() - ctx.started,
        scenario: ctx.scenario,
      });
    };
    if (ctx.delayMs && ctx.delayMs > 0) setTimeout(send, ctx.delayMs);
    else send();
  }

  /** Aceita singular ou plural na URL (/user e /users resolvem para o Schema User). */
  function resolveStore(parts: string[]): StoreEntry | undefined {
    if (parts.length === 0) return undefined;
    const first = parts[0].toLowerCase();
    for (const [name, entry] of stores) {
      if (name === first || plural(name) === first) return entry;
    }
    return undefined;
  }

  return {
    get port() {
      return actualPort;
    },
    logs: () => [...entries],
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
      }),
  };
}

function sendPreflight(res: ServerResponse): void {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
  res.statusCode = 204;
  res.end();
}

/** Lê o corpo até o fim e o devolve como texto (B1: POST/PUT/PATCH precisam dele). */
async function drain(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  await new Promise<void>((resolve) => {
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", resolve);
    req.on("close", resolve);
  });
  return Buffer.concat(chunks).toString("utf8");
}

const MAX_BODY_BYTES = 1024 * 1024;
