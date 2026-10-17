---
title: "Estratégia de Testes"
type: gestao
status: aprovado
fase: codigo
tags: [devmock/gestao, devmock/qualidade, devmock/testes]
related: ["[[Agente-QA-Testes]]", "[[Agente-Auditor]]", "[[06-Plano-Release-v1.1.0]]", "[[05-Metricas-Sucesso]]"]
created: 2026-10-17
updated: 2026-10-17
---

# Gestão — 07 Estratégia de Testes

## 1. Objetivo
Transformar a cobertura atual (que existe mas **não é rastreável**) em suítes que **provam** o produto: cada bug do catálogo tem teste, cada aceite de PRD tem teste, e o CI barra regressão. Dono: [[Agente-QA-Testes]].

**Baseline hoje (2026-10-17):** 11 arquivos de teste, ~86 casos. Referências a `AUD-xx`: **0**.
**S1 entregue (2026-10-17):** +3 arquivos (`regression.test.ts` core e extension + `guards.test.ts`), 15/15 AUD rastreáveis; suíte core 82 testes verdes, host 13 verdes. Configuração/threshold de cobertura (S3): **pendente**.

## 2. Pirâmide e onde cada suíte mora

| Camada | Pacote | Runner | Arquivos |
|--------|--------|--------|----------|
| Unit | `packages/core` | vitest | `test/*.test.ts` |
| E2E | `packages/cli` | vitest (spawn) | `test/cli.test.ts` |
| Integração | `apps/extension` | `@vscode/test-electron` | `src/test/suite/*.test.ts` |
| Guard (infra) | raiz | script + CI | `scripts/guards/*` (novo) |

## 3. Catálogo das suítes

- **S1 — Regressão por bug.** Um `it('AUD-xx — …')` por linha do catálogo do [[Agente-Auditor]] §5. Bugs de código entram em `regression.test.ts` do pacote; bugs de infra viram *guard tests* (§6).
- **S2 — Consolidação da pirâmide.** Padronizar nomes/fixtures/helpers e fechar os aceites de PRD sem teste (matriz §5).
- **S3 — CI.** `--coverage` (o `@vitest/coverage-v8` já está instalado) com threshold (§7), upload de artefato e suíte de regressão como *check* obrigatório.

## 4. Matriz de rastreabilidade — `AUD-xx → teste`

Status atual: **✅ rastreável** — S1 entregue (15/15). Baseline original (pré-S1): 0 referências a `AUD-xx`.

| ID | Bug (resumo) | Área | Teste | Tipo | Status |
|----|--------------|------|-------|------|--------|
| AUD-01 | POST/DELETE/PUT sem persistência em sessão | core / mockServer | `regression.test.ts` | unit | ✅ |
| AUD-02 | `total` contando o slice em vez do store | core / mockServer | `regression.test.ts` | unit | ✅ |
| AUD-03 | `page`/`limit` inválidos → NaN | core / mockServer | `regression.test.ts` | unit | ✅ |
| AUD-04 | routeKey com case original não casa config | core / routes | `regression.test.ts` | unit | ✅ |
| AUD-05 | EADDRINUSE cru, sem mensagem acionável | core / server | `regression.test.ts` | unit | ✅ |
| AUD-06 | `outDir` herdado resolvendo fora do pacote | infra / tsconfig | `guards.test.ts` | guard | ✅ |
| AUD-07 | CNPJ só numérico (regra mudou 31/07/2026) | core / br | `regression.test.ts` | unit | ✅ |
| AUD-08 | Extension CJS × Core ESM (host rejeita) | infra / packaging | `guards.test.ts` | guard | ✅ |
| AUD-09 | `plural()` duplicando "s" (`Users` → `/userss`) | core / routes | `regression.test.ts` | unit | ✅ |
| AUD-10 | Cenário sem definição caía no default; faltavam 403/429 | core / routes | `regression.test.ts` | unit | ✅ |
| AUD-11 | `exclude: src/test` herdado — suíte stale | infra / tsconfig | `guards.test.ts` | guard | ✅ |
| AUD-12 | `await showInformationMessage` trava o host | extension / commands | `suite/regression.test.ts` | integração | ✅ |
| AUD-13 | `?limit` sozinho não paginava | core / mockServer | `regression.test.ts` | unit | ✅ |
| AUD-14 | `build --workspaces` compilava CLI antes do Core | infra / build | `guards.test.ts` | guard | ✅ |
| AUD-15 | Workflow ignorava o script ordenado da raiz | infra / CI | `guards.test.ts` | guard | ✅ |

**Meta v1.1.0:** 15/15 com teste nomeado (11 unit/integração + 4 guards). **Atingida em 2026-10-17.**

## 5. Matriz de rastreabilidade — `RF do PRD → teste`
Fechar os critérios de aceite sem teste. Cada PRD ([[Indice-PRDs]]) tem seção "7. Critérios de Aceite"; a matriz lista `PRD / RF` → arquivo de teste. Tarefa: preencher e zerar órfãos antes do Gate de Release.

## 6. Guard tests (bugs de infra)
Não são unit-testáveis; vivem em `packages/core/test/guards.test.ts` e falham o CI se o invariante quebrar:
- **AUD-14** — ordem `core → cli → extension` no script de build da raiz
- **AUD-06** — nenhum `outDir` resolve fora do próprio pacote
- **AUD-11** — tsconfig de teste da extension não exclui `src/test`
- **AUD-08** — Core empacota CommonJS (sem `type: module`)
- **AUD-15** — CI chama o script ordenado da raiz (nunca `build --workspaces`)

## 7. Política de cobertura
| Pacote | Threshold (linhas) | Observação |
|--------|--------------------|------------|
| `packages/core` | ≥ 90% | baseline histórico ≈ 94% |
| `packages/cli` | ≥ 80% | E2E via spawn cobre o fluxo |
| `apps/extension` | sem % — integração | smoke + commands verdes obrigatórios |

Regra: o CI **falha** abaixo do threshold. Novo código não pode **baixar** a cobertura do pacote.

## 8. Convenções
- Nome de teste: `it('AUD-xx — <descrição>')` para regressão; descritivo normal para os demais.
- Arquivos: `<área>.test.ts`; regressão em `regression.test.ts` por pacote.
- Fixtures/helpers: `test/fixtures/` e `test/helpers/` (sem duplicar setup).
- Determinismo obrigatório: seed fixa, sem rede, sem `Date.now()` real.
- Teste que não falha quando o bug volta **não conta**.

## 9. Tasks
- [x] #task ⏫ Definir agentes: criar [[Agente-QA-Testes]] (vault + `.opencode/agent/qa-testes.md`) 🏷️ fase/codigo
- [x] #task ⏫ S1 — `regression.test.ts` por pacote (1 `it` por AUD-xx) 🏷️ fase/codigo
- [ ] #task ⏫ S2 — preencher matriz `RF → teste` e zerar aceites órfãos 🏷️ fase/codigo
- [ ] #task 🔼 S3 — `--coverage` + threshold + artefato no CI 🏷️ fase/codigo
- [x] #task 🔼 Guards de infra (build-order, tsconfig, cjs-esm, ci-build) 🏷️ fase/codigo
- [ ] #task 🔼 Rodar varredura de flaky e remover `skip` silencioso 🏷️ fase/codigo

## 10. Links
- Agentes: [[Agente-QA-Testes]] (dono) · [[Agente-Auditor]] (catálogo `AUD-*`) · [[Agente-Git-Guardiao]] (CI/PR)
- Release: [[06-Plano-Release-v1.1.0]] | Métricas: [[05-Metricas-Sucesso]] | Índices: [[Indice-Gestao]]
