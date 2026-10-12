import { digits, int, pick } from "../rng.js";

export type Rand = () => number;

const FIRST = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fabio", "Gabi", "Heitor", "Igor", "Julia"];
const LAST = ["Silva", "Souza", "Oliveira", "Santos", "Costa", "Pereira", "Almeida", "Ribeiro"];

/** Geradores globais (PRD-01 §8). Todos determinísticos via rand. */
export const globalGenerators: Record<string, (rand: Rand) => unknown> = {
  uuid: (rand) => {
    const h = () => Math.floor(rand() * 0xffff).toString(16).padStart(4, "0");
    return `${h()}${h()}-${h()}-4${h().slice(1)}-${h()}-${h()}${h()}${h()}`.slice(0, 36);
  },
  name: (rand) => `${pick(rand, FIRST)} ${pick(rand, LAST)}`,
  email: (rand) =>
    `${pick(rand, FIRST).toLowerCase()}.${pick(rand, LAST).toLowerCase()}${int(rand, 1, 99)}@example.com`,
  phone: (rand) => `+55${int(rand, 11, 99)}9${digits(rand, 8)}`,
  date: (rand) =>
    new Date(Date.UTC(2020, 0, 1) + Math.floor(rand() * 1000 * 86400 * 1000)).toISOString().slice(0, 10),
  datetime: (rand) =>
    new Date(Date.UTC(2020, 0, 1) + Math.floor(rand() * 1000 * 86400 * 1000)).toISOString(),
  image: (rand) => `https://picsum.photos/seed/${digits(rand, 6)}/640/480`,
  number: (rand) => int(rand, 0, 10000),
  boolean: (rand) => rand() > 0.5,
  string: (rand) => `lorem-${digits(rand, 6)}`,
};
