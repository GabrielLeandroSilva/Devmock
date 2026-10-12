import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
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
      send(res, 204, undefined);
      entries.push({
        method,
        route: req.url ?? "/",
        status: 204,
        ms: Date.now() - started,
        scenario: "Default",
      });
      return;
    }
    await drain(req);

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

    const route = `${method} /${parts[0]}` + (parts.length >= 2 ? "/:id" : "");
    const { cfg, scenario } = resolveEndpoint(route, { ...opts, config });
    const reply = buildReply(method, parts, store, url, cfg);

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
  ): Reply {
    // Cenário com corpo explícito tem precedência sobre o comportamento default.
    if (cfg.body !== undefined && cfg.body !== null) {
      return { status: cfg.status, body: cfg.body };
    }

    if (cfg.status >= 400) {
      return { status: cfg.status, body: ERROR_BODY[cfg.status] ?? NOT_FOUND_BODY };
    }

    if (method === "GET" && parts.length >= 2) {
      const found = store.rows.find((r) => String(r.id ?? "") === parts[1]);
      return found
        ? { status: 200, body: found }
        : { status: 404, body: NOT_FOUND_BODY };
    }

    if (method === "GET") {
      const rows = store.rows.slice(0, cfg.records);
      const p = url.searchParams;
      const wantsPagination =
        cfg.pagination?.enabled || (p.has("page") && p.has("limit"));
      if (wantsPagination) {
        const page = Number(p.get("page") ?? cfg.pagination?.page ?? 1);
        const limit = Number(p.get("limit") ?? cfg.pagination?.limit ?? cfg.records);
        return { status: 200, body: paginate(rows, page, limit) };
      }
      return { status: 200, body: { data: rows, total: rows.length } };
    }

    if (method === "POST") {
      return { status: 201, body: store.rows[0] ?? {} };
    }
    if (method === "DELETE") {
      return { status: 204, body: undefined };
    }
    return { status: 200, body: store.rows[0] ?? {} };
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

  function push(entry: RequestLogEntry): void {
    entries.push(entry);
  }

  return {    get port() {
      return actualPort;
    },
    logs: () => [...entries],
    listen: () =>
      new Promise<number>((resolve, reject) => {
        server.once("error", reject);
        server.listen(config.port, "127.0.0.1", () => {
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

function send(res: ServerResponse, status: number, body: unknown): void {
  res.setHeader("access-control-allow-origin", "*");
  res.statusCode = status;
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

async function drain(req: IncomingMessage): Promise<void> {
  await new Promise<void>((resolve) => {
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) req.destroy();
    });
    req.on("end", resolve);
    req.on("close", resolve);
  });
}

const MAX_BODY_BYTES = 1024 * 1024;
