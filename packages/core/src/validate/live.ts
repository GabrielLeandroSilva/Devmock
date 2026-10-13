import { plural } from "../mock/routes.js";
import type { Schema } from "../types.js";
import { compare, type Finding } from "./compare.js";

export interface EndpointReport {
  endpoint: string;
  checked: number;
  compatible: number;
  warnings: number;
  breaking: number;
  findings: Finding[];
  error?: string;
}

export interface ValidationOptions {
  /** Itens por endpoint (default 5, PRD-07 RF-03). */
  sample?: number;
  /** Timeout por request em ms (default 10000). */
  timeoutMs?: number;
}

const SAMPLE_DEFAULT = 5;
const TIMEOUT_DEFAULT = 10_000;

/**
 * Valida a API real contra o contrato: GET em cada base path + até N itens
 * (PRD-07 RF-03). Só leitura; falha de rede vira finding de erro (RF-05).
 */
export async function validateLive(
  schemas: Schema[],
  baseUrl: string,
  opts: ValidationOptions = {},
): Promise<EndpointReport[]> {
  const sample = opts.sample ?? SAMPLE_DEFAULT;
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_DEFAULT;
  const base = baseUrl.replace(/\/+$/, "");
  const reports: EndpointReport[] = [];

  for (const schema of schemas) {
    const endpoint = `GET /${plural(schema.name)}`;
    const report: EndpointReport = {
      endpoint,
      checked: 0,
      compatible: 0,
      warnings: 0,
      breaking: 0,
      findings: [],
    };
    let payload: unknown;
    try {
      const res = await fetch(`${base}/${plural(schema.name)}`, { signal: AbortSignal.timeout(timeoutMs) });
      const text = await res.text();
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        report.error = `Resposta não-JSON (status ${res.status}).`;
        reports.push(report);
        continue;
      }
      if (!res.ok) {
        report.error = `HTTP ${res.status} ao buscar ${endpoint}.`;
        reports.push(report);
        continue;
      }
    } catch (err) {
      report.error = `Falha de rede/timeout em ${endpoint}: ${err instanceof Error ? err.message : String(err)}`;
      reports.push(report);
      continue;
    }

    const items = unwrap(payload).slice(0, sample);
    report.checked = items.length;
    for (const item of items) {
      const findings = compare(schema, item);
      for (const f of findings) {
        report.findings.push(f);
        if (f.severity === "warning") report.warnings++;
        else if (f.severity === "breaking") report.breaking++;
      }
      if (findings.length === 0) report.compatible++;
    }
    reports.push(report);
  }
  return reports;
}

/** Aceita objeto direto, envelope {data} ou array. */
function unwrap(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const data = (payload as Record<string, unknown>).data;
    if (Array.isArray(data)) return data;
    return [payload];
  }
  return [];
}

/** Agregado no formato do §23: "X compatible, Y warnings, Z breaking". */
export function summarize(reports: EndpointReport[]): { compatible: number; warnings: number; breaking: number } {
  return {
    compatible: reports.reduce((n, r) => n + r.compatible, 0),
    warnings: reports.reduce((n, r) => n + r.warnings, 0),
    breaking: reports.reduce((n, r) => n + r.breaking, 0) + reports.filter((r) => r.error).length,
  };
}
