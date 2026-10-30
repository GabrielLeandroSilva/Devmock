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
**S2 entregue (2026-10-17):** matriz `RF → teste` dos 8 PRDs preenchida; 4 órfãos fechados com testes novos (`prd.test.ts` + `cli.test.ts`); core 86 verdes, CLI 7 verdes. Restam 5 órfãos documentados (§5) — 4 dependem de seam de UI, 1 é o fix M4.
**S3 entregue (2026-10-17):** `packages/core/vitest.config.ts` com gate de cobertura (stmts/lines/funcs ≥ 90, branch ≥ 80; baseline 93.8/85.7); CI roda `--coverage` no Core e publica o artefato. CLI (E2E por spawn) não é gate — limitação documentada em §7.

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

Status atual: **✅ rastreável** — 16/16 IDs do catálogo presente no working tree. Baseline original (pré-S1): 0 referências a `AUD-xx`.

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
| AUD-16 | `close()` aguardava conexões keep-alive | core / mockServer | `regression.test.ts` | unit | ✅ |

**Meta v1.1.0:** 15/15 com teste nomeado (11 unit/integração + 4 guards). **Atingida em 2026-10-17.** AUD-16 foi adicionado depois e também tem regressão nomeada.

## 5. Matriz de rastreabilidade — `RF do PRD → teste`
Cada PRD ([[Indice-PRDs]]) confrontado com os testes existentes. **S2 entregue em 2026-10-17:** 4 órfãos fechados com testes novos (`packages/core/test/prd.test.ts` + 1 em `cli.test.ts`); 4 órfãos de UI do host e 1 de CLI ficam registrados com motivo (abaixo).

| PRD | Requisito / Aceite | Teste | Status |
|-----|--------------------|-------|--------|
| 01 | RF-01 CRUD de Schema (arquivo + Studio) | `schemaStore.test.ts` · `ops.test.ts` "studio: …rename" | ✅ |
| 01 | RF-02 Validar Schema por campo | `validator.test.ts` (8 casos) | ✅ |
| 01 | RF-03 `generate` determinístico | `dataGenerator.test.ts` "é determinístico" · `cli.test.ts` "generate …" | ✅ |
| 01 | RF-04 Geradores BR formato válido | `dataGenerator.test.ts` · `regression.test.ts` AUD-07 | ✅ |
| 01 | RF-05 `ref` entre Schemas | `dataGenerator.test.ts` "cobre todos os tipos" · `validator.test.ts` "aceita ref conhecida" | ✅ |
| 01 | RF-06 Preview na Extension | `ops.test.ts` "studio: …preview" · `commands.test.ts` "painel Studio abre" | ✅ |
| 01 | RF-07 `config.json` defaults (4010/pt-BR) | `prd.test.ts` "PRD-01 RF-07" · `cli.test.ts` "init grava config.json" | ✅ |
| 01 | §7 1000 registros < 2s | `prd.test.ts` "PRD-01 §7" | ✅ |
| 02 | RF-01 CRUD REST automático | `mockServer.test.ts` "gera CRUD completo" | ✅ |
| 02 | RF-02 `delayMs` por endpoint | `mockServer.test.ts` "aplica delayMs configurado" | ✅ |
| 02 | RF-03 Paginação envelope | `mockServer.test.ts` "envelope paginado" · "GET /users retorna 20" | ✅ |
| 02 | RF-04 Request log | `mockServer.test.ts` "request log registra método, rota, status e ms" | ✅ |
| 02 | RF-05 Start/stop pelo painel | `commands.test.ts` "start sobe HTTP real; stop derruba" | ✅ |
| 02 | RF-06 `GET /:id` inexistente → 404 | `mockServer.test.ts` "GET /users/:id … 404" | ✅ |
| 02 | RF-07 Porta em uso acionável | `mockServer.test.ts` "porta ocupada…" · `regression.test.ts` AUD-05 | ✅ |
| 02 | RF-08 `Schema.routes` (mapa + validação) | `routes.test.ts` "PRD-02 RF-08 …" (29 casos) | ✅ |
| 02 | RF-09 Router (custom/aninhada/estático) | `router.test.ts` (custom/aninhada, estático × param, colisão, alias) | ✅ |
| 02 | RF-10 Semântica (PUT/PATCH/400/405) | `router.test.ts` "PRD-02 RF-10 …" | ✅ |
| 02 | RF-11 `response` custom/precedência | `router.test.ts` "PRD-02 RF-11 …" | ✅ |
| 02 | §7 Trocar porta + restart sem resíduo | `prd.test.ts` "PRD-02 §7" | ✅ |
| 03 | RF-01 Init idempotente | `commands.test.ts` "init é idempotente" · `00-smoke.test.ts` | ✅ |
| 03 | RF-03 Start/Stop painel | `commands.test.ts` "start sobe HTTP real" | ✅ |
| 03 | RF-04 Studio preview/erro/rename | `ops.test.ts` "studio: save, preview, erro e rename" | ✅ |
| 03 | RF-07 Testabilidade (ops puros, fire-and-forget, `?limit`) | `ops.test.ts` · `regression.test.ts` AUD-12 · AUD-13 | ✅ |
| 03 | RF-02 TreeView lista Schemas/Endpoints | `tree.test.ts` "raiz lista as 6 seções…" · "Schemas mostra…" · "Endpoints…" | ✅ |
| 03 | RF-05 Edição manual do JSON recarrega a Tree | `tree.test.ts` (builder com snapshot fresco; watcher = glue do host) | ✅ |
| 03 | RF-06 Create API (From scratch/Import/Detect) | `detect.test.ts` (core) · `ops.test.ts` (host, W2) | ✅ |
| 03 | §7 CTA sem `.devmock/` | `tree.test.ts` "sem .devmock oferece inicializar" | ✅ |
| 03 | RF-12 Ações no header | `actions.test.ts` · `commands.test.ts` "Ações encaminha…" | ✅ |
| 03 | RF-13 Cenário por clique | `actions.test.ts` "cenário: pick…" · `commands.test.ts` "applyScenario…" | ✅ |
| 03 | RF-14 Nó de cenário com contagem | `tree.test.ts` "Scenarios marca o ativo…" | ✅ |
| 03 | RF-15 Studio edita/restaura rotas e salva | `ops.test.ts` "studio: rotas customizadas salvam, validam e preview ignora" (handler host) | ⚠️ parcial — não exercita a Webview |
| 03 | RF-16 Menu do endpoint/cURL/browser | `actions.test.ts` (menu/cURL) · `commands.test.ts` (cURL/clipboard/browser) | ✅ |
| 03 | RF-17 `Switch Scenario` todas as rotas | `commands.test.ts` "switchScenario lista todas as rotas…" · "com rota do menu…" | ✅ |
| 03 | RF-18 Cenário em todos os métodos + contador | `tree.test.ts` (métodos, contador por rota) | ✅ |
| 04 | RF-01 CRUD de cenário | `ops.test.ts` "switch grava activeScenarios" | ✅ |
| 04 | RF-02 Troca <500ms sem restart | `mockServer.test.ts` "troca de cenário sem restart" | ✅ |
| 04 | RF-03 `Empty` → 200 `{data:[],total:0}` | `mockServer.test.ts` "Empty retorna envelope vazio com 200" | ✅ |
| 04 | RF-04 401/500 body padrão | `mockServer.test.ts` "401 e 500 retornam body padrão" | ✅ |
| 04 | RF-05 Versionável em arquivos | `mockServer.test.ts` "arquivo tem precedência sobre o embutido" | ✅ |
| 04 | §7 `Slow Network` ~5s | `prd.test.ts` "PRD-04 §7" | ✅ |
| 05 | RF-01 Markdown por recurso | `export.test.ts` "segue o template do §15" | ✅ |
| 05 | RF-02 OpenAPI JSON+YAML válidos | `export.test.ts` "gera documento 3.x" · "valida em swagger-parser" | ✅ |
| 05 | RF-03 JSON Schema por model | `export.test.ts` "gera draft-07 com required" | ✅ |
| 05 | RF-04 `types.ts` (enum union, BRL number) | `export.test.ts` "enum vira union, BRL vira number" | ✅ |
| 05 | RF-05 Export Contract (comando único) | `ops.test.ts` · `cli.test.ts` "export gera 5 artefatos" | ✅ |
| 05 | §8 Re-export idempotente | `export.test.ts` "re-export do mesmo Schema gera saída idêntica" | ✅ |
| 05 | RF-07 Export por `Schema.routes` (OpenAPI/MD/HTML, summary) | `export.test.ts` "v1.5.0 — rotas custom no export" | ✅ |
| 06 | RF-01…05 Import OpenAPI (fixture, warnings, YAML, --force) | `import.test.ts` (4) · `cli.test.ts` "import yaml…" · `ops.test.ts` "import cria…" | ✅ |
| 07 | RF-01…06 Contract Validation | `validate.test.ts` (11) · `cli.test.ts` "validate…" · `ops.test.ts` "validate contra mock real" | ✅ |
| 07 | RF-07 Validate na rota list custom; skip com aviso | `validate.test.ts` "v1.5.0 — rotas custom no validate" · `cli.test.ts` "validate pula…" · host (aviso) | ✅ |
| 08 | RF-01 `generate` (records/seed/--out) | `cli.test.ts` "generate é determinístico e --out grava" | ✅ |
| 08 | RF-02 `export` 5 artefatos **+ `.hashes.json`** | `cli.test.ts` "export gera 5 artefatos" (sem hashes) | ⚠️ órfão (c) |
| 08 | RF-03 CI verde no PR | `guards.test.ts` AUD-15 · `.github/workflows/ci.yml` | ✅ |
| 08 | RF-04 Erro acionável + exit codes | `cli.test.ts` "generate sem schema → exit 1" | ✅ |

**Órfãos conscientes (não são falhas silenciosas):**
- **(a) UI do host — TreeView/watch/CTA (PRD-03 RF-02, RF-05, §7):** ✅ **resolvido na v1.3.0 (T3a)** — `ProjectProvider.getChildren` virou o builder puro `apps/extension/src/tree.ts`, testado em `suite/tree.test.ts` (8 casos); o watcher/reload é glue do host. → [[10-Plano-Release-v1.3.0]]
- **(b) Create API (PRD-03 RF-06):** ✅ **resolvido na v1.2.0** — Detect implementado ([[PRD-09-Detect-From-Project]]) com testes em `detect.test.ts` (core) e `ops.test.ts` (host).
- **(c) CLI `export` sem `.hashes.json` (PRD-08 RF-02):** **bug de produto**, não de teste — tratado em **M4** do [[06-Plano-Release-v1.1.0]] (staleDetector completo + CLI grava hashes); o teste é adicionado junto do fix.
- **(d) Studio Webview (PRD-03 RF-15):** o teste atual cobre `handleStudioMessage` no host, mas não executa o IIFE `media/form.js`; `toUi`/`toRoutes`, parsing do body, erro de linha sem path, preservação de `summary` durante edição e os cliques de customizar/adicionar/remover/restaurar/salvar permanecem sem regressão automatizada. `jsonForHtml` também não tem teste para `<`/U+2028/U+2029. Dívida: criar seam testável para conversores e cobrir o fluxo da Webview sem depender de relógio/rede; não extrair nesta alteração porque isso mudaria código de produção.

## 6. Guard tests (bugs de infra)
Não são unit-testáveis; vivem em `packages/core/test/guards.test.ts` e falham o CI se o invariante quebrar:
- **AUD-14** — ordem `core → cli → extension` no script de build da raiz
- **AUD-06** — nenhum `outDir` resolve fora do próprio pacote
- **AUD-11** — tsconfig de teste da extension não exclui `src/test`
- **AUD-08** — Core empacota CommonJS (sem `type: module`)
- **AUD-15** — CI chama o script ordenado da raiz (nunca `build --workspaces`)

## 7. Política de cobertura (S3 2026-10-17 · CLI T3b 2026-10-20)
| Pacote | Gate no CI | Baseline medido | Observação |
|--------|-----------|-----------------|------------|
| `packages/core` | **sim** — stmts/lines/funcs ≥ 90, branch ≥ 80 (`vitest.config.ts`) | 93.8 / 93.8 / 94.3 / 85.7 | gate ativo; falha o CI abaixo |
| `packages/cli` | **sim** — c8 no processo filho (`NODE_V8_COVERAGE`); stmts/lines ≥ 90, funcs ≥ 95, branch ≥ 80 | 96.46 / 96.46 / 100 / 87.12 | `npm run test:coverage`; remapeia `dist/cli.js` → `src/cli.ts` via sourcemap |
| `apps/extension` | **não** — integração | — | smoke + commands + ops verdes obrigatórios no host |

Artefatos `coverage-core-nodeXX` e `coverage-cli-nodeXX` publicados no CI. Regra: novo código não pode **baixar** a cobertura abaixo do gate.

## 8. Convenções
- Nome de teste: `it('AUD-xx — <descrição>')` para regressão; descritivo normal para os demais.
- Arquivos: `<área>.test.ts`; regressão em `regression.test.ts` por pacote.
- Fixtures/helpers: `test/fixtures/` e `test/helpers/` (sem duplicar setup).
- Determinismo obrigatório: seed fixa, sem rede, sem `Date.now()` real.
- Teste que não falha quando o bug volta **não conta**.

## 9. Tasks
- [x] #task ⏫ Definir agentes: criar [[Agente-QA-Testes]] (vault + `.opencode/agent/qa-testes.md`) 🏷️ fase/codigo
- [x] #task ⏫ S1 — `regression.test.ts` por pacote (1 `it` por AUD-xx) 🏷️ fase/codigo
- [x] #task ⏫ S2 — preencher matriz `RF → teste` e zerar aceites órfãos 🏷️ fase/codigo
- [x] #task 🔼 Seam de testabilidade da Tree (extrair builder puro) — fecha PRD-03 RF-02/RF-05/§7 — **v1.3.0 T3a** 🏷️ fase/codigo
- [x] #task 🔼 Cobertura do CLI via `NODE_V8_COVERAGE` — **v1.3.0 T3b** 🏷️ fase/codigo
- [x] #task 🔼 Teste de `.hashes.json` no CLI export — junto do fix M4 🏷️ fase/codigo
- [x] #task 🔼 S3 — `--coverage` + threshold + artefato no CI 🏷️ fase/codigo
- [x] #task 🔼 Guards de infra (build-order, tsconfig, cjs-esm, ci-build) 🏷️ fase/codigo
- [ ] #task 🔼 Rodar varredura de flaky e remover `skip` silencioso 🏷️ fase/codigo

## 10. Links
- Agentes: [[Agente-QA-Testes]] (dono) · [[Agente-Auditor]] (catálogo `AUD-*`) · [[Agente-Git-Guardiao]] (CI/PR)
- Release: [[06-Plano-Release-v1.1.0]] | Métricas: [[05-Metricas-Sucesso]] | Índices: [[Indice-Gestao]]
