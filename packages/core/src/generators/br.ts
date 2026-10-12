import { digits, int, pick } from "../rng.js";
import type { Rand } from "./global.js";

const BR_FIRST = [
  "João", "Maria", "José", "Ana", "Carlos", "Fernanda", "Paulo", "Luciana", "Marcos", "Patricia",
  "Rafael", "Camila", "Thiago", "Beatriz", "Gustavo", "Larissa", "Felipe", "Aline", "Bruno", "Daniela",
];
const BR_LAST = [
  "da Silva", "dos Santos", "de Oliveira", "Souza", "Ferreira", "Almeida", "Carvalho", "Araújo",
  "Melo", "Barbosa", "Cardoso", "Teixeira", "Moreira", "Correia",
];
const STREETS = ["Rua das Flores", "Av. Paulista", "Rua XV de Novembro", "Av. Brasil", "Rua do Comércio"];
const CITIES = ["São Paulo/SP", "Belo Horizonte/MG", "Curitiba/PR", "Recife/PE", "Porto Alegre/RS"];
const BANKS = ["001 Banco do Brasil", "033 Santander", "104 Caixa", "237 Bradesco", "341 Itaú", "260 Nu Pagamentos"];

function mod11(digs: number[], startWeight: number): number {
  let sum = 0;
  let w = startWeight;
  for (const d of digs) {
    sum += d * w;
    w = w === 2 ? 9 : w - 1;
  }
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

/** CPF com dígitos verificadores corretos, formato 000.000.000-00. */
export function genCpf(rand: Rand): string {
  const base = Array.from({ length: 9 }, () => int(rand, 0, 9));
  const d1 = mod11(base, 10);
  const d2 = mod11([...base, d1], 11);
  const n = [...base, d1, d2].join("");
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

/**
 * Valor de um caractere no cálculo do DV do CNPJ (IN RFB 2.229/2024):
 * dígitos mantêm o valor, letras usam ASCII - 48 (A=17 … Z=42).
 */
export function cnpjCharValue(ch: string): number {
  return ch.charCodeAt(0) - 48;
}

const ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * CNPJ com dígitos verificadores corretos.
 * Desde 31/07/2026 a Receita emite os dois formatos (coexistência):
 * numérico (ainda o mais comum) e alfanumérico — 12 posições [A-Z0-9] + 2 DV numéricos.
 * Formato: 00.000.000/0001-00 (ex. real alfa: 00.000.000/E08G-12).
 */
export function genCnpj(rand: Rand): string {
  const alphanumeric = rand() >= 0.75;
  const base: string[] = [];
  for (let i = 0; i < 12; i++) {
    base.push(alphanumeric ? ALNUM[int(rand, 0, ALNUM.length - 1)] : String(int(rand, 0, 9)));
  }
  if (alphanumeric && !base.some((c) => c >= "A")) {
    base[int(rand, 0, 11)] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[int(rand, 0, 25)];
  }
  const vals = base.map(cnpjCharValue);
  const d1 = mod11(vals, 5);
  const d2 = mod11([...vals, d1], 6);
  const n = `${base.join("")}${d1}${d2}`;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

/** Geradores brasileiros — diferencial do produto (PRD-01 §8). */
export const brGenerators: Record<string, (rand: Rand) => unknown> = {
  "br.nome": (rand) => `${pick(rand, BR_FIRST)} ${pick(rand, BR_LAST)}`,
  "br.cpf": genCpf,
  "br.cnpj": genCnpj,
  "br.cep": (rand) => `${digits(rand, 5)}-${digits(rand, 3)}`,
  "br.celular": (rand) => `(${digits(rand, 2)}) 9${digits(rand, 4)}-${digits(rand, 4)}`,
  "br.endereco": (rand) =>
    `${pick(rand, STREETS)}, ${int(rand, 1, 9999)} — ${pick(rand, CITIES)}`,
  "br.pix": (rand) =>
    pick(rand, [genCpf(rand), `user${digits(rand, 3)}@example.com`, `+55${digits(rand, 2)}9${digits(rand, 8)}`]),
  "br.banco": (rand) => pick(rand, BANKS),
  "br.agencia": (rand) => digits(rand, 4),
  "br.conta": (rand) => `${digits(rand, 6)}-${digits(rand, 1)}`,
  // BRL é number com 2 casas — nunca string (regra anti-mismatch §22).
  brl: (rand) => Math.round(rand() * 100000) / 100,
};
