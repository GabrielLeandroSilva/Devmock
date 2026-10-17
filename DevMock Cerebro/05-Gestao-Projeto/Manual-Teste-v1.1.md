---
title: "Manual de Teste v1.1.0"
type: gestao
status: revisao
fase: codigo
tags: [devmock/qa, devmock/release]
related: ["[[06-Plano-Release-v1.1.0]]", "[[07-Estrategia-Testes]]", "[[Manual-Teste-v1]]", "[[Agente-QA-Testes]]"]
created: 2026-10-17
updated: 2026-10-17
---

# Gestão — Manual de Teste v1.1.0 (portão da v1.1.0)

> Foco nos itens **M1–M4**. A regressão plena herda o [[Manual-Teste-v1]] (§1–§8). Itens marcados **[auto]** já são cobertos por suíte automatizada; os **[UI]** devem ser confirmados no host (F5).

## 0. Preparação
- [x] #task 🔼 Build limpo: `npm run build` sem erro 🏷️ fase/codigo ✅ 2026-10-17
- [x] #task 🔼 Suítes verdes: core + cli + extension 🏷️ fase/codigo ✅ 2026-10-17
- [ ] #task 🔼 F5 no host de desenvolvimento (`.vscode/launch.json`) 🏷️ fase/codigo

## M1 — Cenários 403/429 na UI (PRD-04)
- [auto] #task ⏫ Switch Scenario lista os 7 (Default, Empty, Unauthorized, Forbidden, Server Error, Slow Network, Rate Limited) 🏷️ fase/codigo
- [UI] #task ⏫ Aplicar **Forbidden** → `GET /users` responde **403** `{error: FORBIDDEN}` em <500ms, sem restart 🏷️ fase/codigo
- [UI] #task ⏫ Aplicar **Rate Limited** → **429** `{error: RATE_LIMITED}` 🏷️ fase/codigo
- **Evidência:** `packages/core/test/prd.test.ts` (M1 — `SCENARIO_NAMES` = 7) · `regression.test.ts` AUD-10 · host 15 ✅

## M2 — `errorRate` determinístico (MVP-Scope Should)
- [auto] #task ⏫ `errorRate: 0` → nenhuma falha; `errorRate: 50` → ~50% das chamadas 500 🏷️ fase/codigo
- [auto] #task ⏫ Cenário ativo (ex. Empty) **ignora** o errorRate 🏷️ fase/codigo
- [UI] #task 🔼 Settings mostra `errorRate: <valor>` na Tree 🏷️ fase/codigo
- **Evidência:** `packages/core/test/prd.test.ts` (M2 — distribuição reproduzível por seed + precedência)

## M3 — Request log com body (MVP-Scope Should)
- [UI] #task ⏫ `Show Request Log` mostra `→` (request) e `←` (response) 🏷️ fase/codigo
- [auto] #task 🔼 Body > 1KB aparece truncado, com marca `…(truncado)` 🏷️ fase/codigo
- **Evidência:** `packages/core/test/prd.test.ts` (M3) · host `ops.test.ts` (M3 — `formatLogEntry`)

## M4 — staleDetector por artefato + CLI hashes (MVP-Scope Should)
- [auto] #task ⏫ Exportar só Markdown após mudar o Schema → os demais artefatos seguem desatualizados 🏷️ fase/codigo
- [auto] #task ⏫ `devmock export` gera `.devmock/openapi/.hashes.json` 🏷️ fase/codigo
- **Evidência:** `packages/core/test/export.test.ts` (M4) · host `ops.test.ts` (M4) · `packages/cli/test/cli.test.ts` (export + `.hashes.json`)

## Regressão (herdada)
- [UI] #task 🔼 [[Manual-Teste-v1]] §1–§7 continuam ✅ (Init, Schema, Fake Data, Mock CRUD, cenários, export, log/stop) 🏷️ fase/codigo

## Resultado
| Data | Passo | ✅/❌ | Observação |
|------|-------|------|------------|
| 2026-10-17 | Build + tsc (core/cli/extension) | ✅ | `npm run build` e 3 `tsc --noEmit` limpos |
| 2026-10-17 | Suítes automatizadas | ✅ | core **92** (cobertura 94.05% ≥ gate) · cli **7** · host **15** |
| 2026-10-17 | M1–M4 (auto) | ✅ | testados em `prd.test.ts` / `export.test.ts` / `ops.test.ts` / `cli.test.ts` |
| | 0 F5 (host) | | aguarda confirmação humana |
| | M1 (UI switch) | | aguarda host |
| | M2 (UI Settings) | | aguarda host |
| | M3 (UI log) | | aguarda host |
| | M4 (UI export parcial) | | aguarda host |
| | Regressão §1–§7 | | aguarda host |

- Todos ✅ (auto + UI) → dizer **"promove v1.1.0"** (PR `des`→`main` + tag `ext-v1.1.0`).
- Qualquer ❌ → descrever aqui e devolver ao Coder; o [[Agente-QA-Testes]] re-roda o ritual.
