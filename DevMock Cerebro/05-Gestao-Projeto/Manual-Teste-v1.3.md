---
title: "Manual de Teste v1.3.0"
type: gestao
status: revisao
fase: codigo
tags: [devmock/qa, devmock/release]
related: ["[[10-Plano-Release-v1.3.0]]", "[[07-Estrategia-Testes]]", "[[Manual-Teste-v1.2]]", "[[PRD-04-Scenarios]]", "[[PRD-09-Detect-From-Project]]"]
created: 2026-10-20
updated: 2026-10-20
---

# Gestão — Manual de Teste v1.3.0

> Foco em T1 (cenário por requisição), T2 (Detect ampliado) e T3a/T3b (qualidade). **[auto]** = suíte; **[UI]** = smoke no host (F5). Regressão herda [[Manual-Teste-v1.2]].

## 0. Preparação
- [x] #task 🔼 Build limpo: `npm run build` 🏷️ fase/codigo ✅ 2026-10-20
- [x] #task 🔼 `tsc --noEmit` core/cli/extension 🏷️ fase/codigo ✅ 2026-10-20
- [x] #task 🔼 Suítes: core **111** · cli **15** · host **27** 🏷️ fase/codigo ✅ 2026-10-20
- [ ] #task 🔼 F5 no host de desenvolvimento (**VS Code ≥ 1.101**) 🏷️ fase/codigo

## T1 — Cenário por requisição
- [x] #task ⏫ **[auto]** `?scenario=Empty` → `{data:[],total:0}`; log registra `Empty` 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** `X-Mock-Scenario: Forbidden` → 403 `{error:"FORBIDDEN"}` e vence o cenário ativo 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** Query vence header; arquivo > embutido 🏷️ fase/codigo
- [x] #task 🔼 **[auto]** Desconhecido cai no ativo/Default sem quebrar; CORS libera `x-mock-scenario` 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** `curl "http://localhost:4010/users?scenario=Empty"` no server do host 🏷️ fase/codigo
- **Evidência auto:** core `mockServer.test.ts` (6 casos)

## T2 — Detect ampliado
- [x] #task ⏫ **[auto]** Clientes `http/https/httpClient/client/ky/got/request`, genéricos `get<T>`, config-object, `fetch` com método, base/URL normalizadas 🏷️ fase/codigo
- [x] #task 🔼 **[auto]** Método inválido → GET; `map.get()` não vira endpoint 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** `Create API… → Detect` continua listando/criando (regressão) 🏷️ fase/codigo
- **Evidência auto:** core `detect.test.ts` (3 casos)

## T3 — Qualidade
- [x] #task ⏫ **[auto]** Builder puro da Tree (8 casos no host) — órfão (a) fechado 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** Cobertura do CLI via c8: **96.46 / 96.46 / 100 / 87.12** (gate 90/90/95/80) 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** Tree renderiza os nós como antes (regressão visual) 🏷️ fase/codigo
- **Evidência auto:** host `tree.test.ts` · cli `test:coverage` · CI artefato `coverage-cli-nodeXX`

## Regressão
- [x] #task 🔼 **[auto]** Host 27: smoke, comandos, ops (Start/Stop, Studio, Export, Validate, Detect) 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** [[Manual-Teste-v1.2]] (W1/W2/W3) continua ✅ 🏷️ fase/codigo

## Resultado
| Data | Passo | ✅/❌ | Observação |
|------|-------|------|------------|
| 2026-10-20 | Build + tsc + suítes | ✅ | core **111** (cob 90.83/82.08) · cli **15** (96.46/87.12) · host **27** |
| 2026-10-21 | Publish | ✅ | run **39524527077** (rerun): host 27 verde antes do `vsce` → **PUBLICADO 1.3.0**; 1ª tentativa caiu por `ETIMEDOUT` no download do VS Code |
| | F5 + T1/T2/T3 (UI) | | smoke visual opcional pós-release |
| | Regressão v1.2 (UI) | | coberta pela suíte do host no publish |

- Todos ✅ → **promove v1.3.0** (tag `ext-v1.3.0` → publish).
