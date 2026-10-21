---
title: "Plano de Release — v1.3.0"
type: gestao
status: aprovado
fase: codigo
tags: [devmock/gestao, devmock/release]
related: ["[[PRD-04-Scenarios]]", "[[07-Estrategia-Testes]]", "[[08-Plano-Release-v1.2.0]]", "[[06-Stacks-e-Versoes]]", "[[PRD-09-Detect-From-Project]]"]
created: 2026-10-20
updated: 2026-10-20
---

# Gestão — 10 Plano de Release v1.3.0

## 1. Objetivo
**Tema:** *Cenários por requisição + fechar a dívida de testes da UI.*

Depois da 1.2.0 (Tree UX, Detect, HTML docs), a próxima janela ataca dois pontos: dar ao front um jeito de **forçar um cenário por chamada** (sem trocar o cenário global) e **tornar a Tree testável** (hoje o conteúdo da UI depende do host e não tem teste).

## 2. Escopo

### Must
| ID | Item | Origem | Status atual |
|----|------|--------|--------------|
| **T1** | **Cenários por header/query**: `GET /users?scenario=Empty` e header `X-Mock-Scenario: Forbidden`; precedência **request > cenário ativo > Default**; CORS libera o header; desconhecido cai no ativo/Default | [[PRD-04-Scenarios]] "Fora (futuro)"; S1 que escorregou da 1.1.0 | ✅ v1.3.0 (T1) — 6 testes novos verdes |
| **T3a** | **Seam do Tree**: extrair um **builder puro** do `ProjectProvider.getChildren` (`apps/extension/src/tree.ts`) e testar Schema/Endpoint/Settings/Mock Server no host — fecha o **órfão (a)** | [[07-Estrategia-Testes]] §5 | ✅ v1.3.0 (T3a) — host 27 testes (+8) |

### Should (stretch)
| ID | Item | Origem | Observação |
|----|------|--------|------------|
| **T3b** | **Cobertura do CLI** via `NODE_V8_COVERAGE` (hoje o E2E por spawn mede 0%) | [[07-Estrategia-Testes]] §7 | ✅ v1.3.0 (T3b) — c8; 96.46/87.12/100 (15 testes) |
| **T2** | **Detect: ampliar padrões** (clientes HTTP/frameworks) | [[PRD-09-Detect-From-Project]] "Fora" | ✅ v1.3.0 (T2) — 7 padrões novos |

### Fora (v1.4.0 / roadmap)
- **T4** — Validação: enriquecer relatório (PRD-07 "Fora").
- **T5** — Mínimo **Node 24** (depende de confirmar o Node embutido no VS Code; ver [[06-Stacks-e-Versoes]]).

## 3. Definition of Done (por item)
- **T1:** `?scenario=Empty` → `{data:[],total:0}`; `X-Mock-Scenario: 403` → 403 `{error:FORBIDDEN}`; request > ativo > Default; cenário desconhecido não quebra (cai no ativo); **CORS** inclui `x-mock-scenario`; testes no `mockServer.test.ts` + regressão.
- **T3a:** builder puro retorna os nós (Schemas/Endpoints/Scenarios/Documentation/Settings/Mock Server) com cenário e estado do server; testes no host cobrindo os casos; `getChildren` só adapta o builder para `vscode`.
- **T3b (stretch):** `vitest` do CLI coleta cobertura do processo filho e o CI publica; gate definido (sem quebrar o spawn).
- **T2 (stretch):** novos padrões documentados e testados; sem falso positivo silencioso (warnings).

## 4. Passos de execução (checklist)
- [x] #task ⏫ T1 — core: cenário por header/query + precedência + CORS 🏷️ fase/codigo
- [x] #task ⏫ T1 — testes (query/header/desconhecido) + regressão 🏷️ fase/codigo
- [x] #task ⏫ T3a — extrair builder puro do Tree (`tree.ts`) 🏷️ fase/codigo
- [x] #task ⏫ T3a — testes no host do builder (fecha órfão (a)) 🏷️ fase/codigo
- [x] #task 🔼 T3b — cobertura do CLI via `NODE_V8_COVERAGE` (stretch) 🏷️ fase/codigo
- [x] #task 🔼 T2 — ampliar padrões do Detect (stretch) 🏷️ fase/codigo
- [/] #task 🔼 Manual-Teste-v1.3 + CHANGELOG + `package.json → 1.3.0` 🏷️ fase/codigo
- [/] #task 🔼 Sincronizar README + wiki (Docs-Keeper) 🏷️ fase/codigo
- [/] #task ⏫ Rodar Gate de Release (§5) 🏷️ fase/codigo

## 5. Gate de Release
- [ ] Manual-Teste-v1.3 100% — **auto ✅** (core 111 · cli 15 · host 27); **UI aguarda F5**
- [x] `vitest run` verde + cobertura ≥ gate: core 90.83/82.08 · CLI 96.46/87.12 ✅
- [x] `tsc --noEmit` limpo em todos os workspaces ✅
- [x] CHANGELOG + `package.json` = `1.3.0` ✅
- [x] README (raiz + extension) atualizados; wiki pronta (push no publish)
- [x] `Log-Versionamento` atualizado
- [ ] Tag `ext-v1.3.0` (trava `tag == versão`) → `publish.yml`
- [ ] Post de lançamento ([[Agente-LinkedIn]], postagem manual)

## 6. Riscos e Dependências
- **T1** mexe no contrato de resolução de cenário: manter compatibilidade (sem header/query = comportamento atual) e cobrir precedência.
- **T1** precisa liberar `x-mock-scenario` no CORS, senão o navegador bloqueia.
- **T3a** é refactor de UI: extrair sem mudar comportamento; o teste do builder não substitui o teste do host.
- **T3b** pode exigir mexer no runner do CLI (c8/v8) — por isso é stretch.
- **T2** é heurístico; se gerar falso positivo, fica para 1.3.x.

## 7. Links
- PRDs: [[PRD-04-Scenarios]] · [[PRD-09-Detect-From-Project]] · [[PRD-07-Contract-Validation]]
- Qualidade: [[07-Estrategia-Testes]] · [[Agente-QA-Testes]] | Catálogo: [[Agente-Auditor]]
- Anterior: [[08-Plano-Release-v1.2.0]] | Stacks: [[06-Stacks-e-Versoes]] | Roadmap: [[01-EAP]] · [[00-Home]]
