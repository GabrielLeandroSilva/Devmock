import type { Schema, SchemaField } from "../types.js";
import { mulberry32, pick } from "../rng.js";
import { globalGenerators } from "./global.js";
import { brGenerators } from "./br.js";

const registry = { ...globalGenerators, ...brGenerators };

export function generatorNames(): string[] {
  return Object.keys(registry).sort();
}

/**
 * Gera `records` objetos determinísticos para o Schema com o `seed`
 * (PRD-01 RF-03: mesma entrada → mesmo output).
 */
export function generate(schema: Schema, records: number, seed: number | string): Record<string, unknown>[] {
  const rand = mulberry32(`${seed}:${schema.name}`);
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < records; i++) {
    const row: Record<string, unknown> = {};
    for (const field of schema.fields) {
      row[field.name] = genField(field, rand);
    }
    out.push(row);
  }
  return out;
}

function genField(field: SchemaField, rand: () => number): unknown {
  if (field.generator && registry[field.generator]) {
    return registry[field.generator](rand);
  }
  switch (field.type) {
    case "uuid":
      return registry.uuid(rand);
    case "enum":
      return field.values && field.values.length > 0 ? pick(rand, field.values) : null;
    case "number":
      return registry.number(rand);
    case "boolean":
      return registry.boolean(rand);
    case "date":
      return registry.date(rand);
    case "datetime":
      return registry.datetime(rand);
    case "image":
      return registry.image(rand);
    case "ref":
      return registry.uuid(rand);
    case "array":
      return [];
    default:
      return registry.string(rand);
  }
}
