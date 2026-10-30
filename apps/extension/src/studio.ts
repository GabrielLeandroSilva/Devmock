import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generate, validateSchema, type Schema, type SchemaRoute } from "@devmock/core";

export interface StudioMessage {
  kind: string;
  model: string;
  fields: Record<string, unknown>[];
  routes?: SchemaRoute[];
  records?: number;
  seed?: number | string;
  silent?: boolean;
}

export type StudioReply =
  | { kind: "error"; text: string }
  | { kind: "previewResult"; text: string }
  | { kind: "ok"; text: string }
  | { kind: "noop" };

export interface StudioEnv {
  root: string;
  seedDefault: number;
  initial?: Schema;
  isRunning?: () => boolean;
  onSaved?: () => void;
}

/**
 * Lógica do Studio sem dependência do vscode (testável no host com fs real).
 * O handler da webview é só um wrapper fino sobre esta função.
 */
export function handleStudioMessage(msg: StudioMessage, env: StudioEnv): StudioReply {
  const base = { name: (msg.model || "").trim(), fields: msg.fields } as unknown as Schema;
  const schema: Schema =
    msg.routes !== undefined ? { ...base, routes: msg.routes } : base;

  if (msg.kind === "preview") {
    // Preview usa só model+campos (rotas não afetam os dados).
    const errors = validateSchema(base).filter((d) => d.severity === "error");
    if (errors.length > 0) {
      return msg.silent
        ? { kind: "noop" }
        : { kind: "error", text: errors.map((d) => `${d.field}: ${d.message}`).join("\n") };
    }
    const seed = msg.seed === undefined || msg.seed === "" ? env.seedDefault : msg.seed;
    const rows = generate(base, msg.records ?? 5, seed);
    return { kind: "previewResult", text: JSON.stringify(rows, null, 2) };
  }

  if (msg.kind !== "preview" && Array.isArray(msg.routes) && msg.routes.length === 0) {
    return {
      kind: "error",
      text: "Adicione ao menos 1 rota ou desmarque \"Customizar rotas\" para usar o CRUD padrão.",
    };
  }

  const errors = validateSchema(schema).filter((d) => d.severity === "error");
  if (errors.length > 0) {
    return { kind: "error", text: errors.map((d) => `${d.field}: ${d.message}`).join("\n") };
  }
  const dir = `${env.root}/.devmock`;
  const file = join(dir, "schemas", `${schema.name.toLowerCase()}.json`);
  writeFileSync(file, `${JSON.stringify(schema, null, 2)}\n`);
  // Modo edição com rename: apaga o arquivo antigo e avisa.
  const notes: string[] = [`Salvo em schemas/${schema.name.toLowerCase()}.json`];
  if (env.initial && env.initial.name.toLowerCase() !== schema.name.toLowerCase()) {
    const oldFile = join(dir, "schemas", `${env.initial.name.toLowerCase()}.json`);
    if (existsSync(oldFile)) {
      unlinkSync(oldFile);
      notes.push(`renomeado de schemas/${env.initial.name.toLowerCase()}.json`);
    }
  }
  // Schema em disco ≠ servidor vivo: vale após restart (sem hot-reload, por escopo).
  if (env.isRunning?.()) {
    notes.push("reinicie o servidor (stop → start) para aplicar");
  }
  env.onSaved?.();
  return { kind: "ok", text: notes.join(" · ") };
}
