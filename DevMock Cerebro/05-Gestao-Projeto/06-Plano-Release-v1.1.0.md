---
title: "Plano de Release — v1.1.0"
type: gestao
status: aprovado
fase: codigo
tags: [devmock/gestao, devmock/release]
related: ["[[03-MVP-Scope]]", "[[01-EAP]]", "[[PRD-04-Scenarios]]", "[[PRD-02-Mock-Server]]", "[[PRD-05-Docs-Export]]", "[[05-Metricas-Sucesso]]"]
created: 2026-10-17
updated: 2026-10-17
---

# Gestão — 06 Plano de Release v1.1.0

## 1. Objetivo
Fechar os itens **Should do MVP** que ficaram para `v1.x`, com evidência de código rastreável. A v1.1.0 é release de **aprofundamento** (não de feature nova de mercado): completa cenários, observabilidade e integridade de export sobre o que a v1.0.0 já entregou.

- **Tema:** *Cenários completos + Observabilidade + Integridade do export*
- **Versão extension:** `1.0.0` → `1.1.0` (`apps/extension/package.json:5`)
- **Base:** `des` (dias de trabalho); promoção via PR para `main`

## 2. Rastreabilidade — de onde veio cada item
Tudo abaixo foi levantado do vault e **verificado no código** (coluna Status). Nada inventado.

| ID | Item | Origem no vault | Status atual no código |
|----|------|-----------------|------------------------|
| M1 | Expor `Forbidden (403)` e `Rate Limited (429)` na UI | [[03-MVP-Scope]] Should; [[PRD-04-Scenarios]] Fora (v1.1) | Core tem os 7 (`packages/core/src/mock/routes.ts:63-71`); UI expõe só 5 (`apps/extension/src/extension.ts:102,339`) |
| M2 | `error rate %` por endpoint | [[03-MVP-Scope]] Should; [[PRD-02-Mock-Server]] / [[PRD-04-Scenarios]] (v1.1) | Ausente — sem campo em `packages/core/src/types.ts:40-45` |
| M3 | Request log com **body** (request + response, truncado) | [[03-MVP-Scope]] Should | Parcial — `RequestLogEntry` só tem `method/route/status/ms/scenario` (`routes.ts:25-31`); body lido/gerado mas não logado (`server.ts:83,142-193`) |
| M4 | `staleDetector` completo (por artefato + CLI grava hashes) | [[03-MVP-Scope]] Should; [[05-Integracoes-OpenAPI-TS]] | Parcial — 1 snapshot/schema (`export/stale.ts:20-25`); export parcial marca tudo como ok (`ops.ts:89`); CLI promete "+ hashes" mas não grava (`packages/cli/src/cli.ts:307-332`) |
| S1 | Cenários por header/query | [[PRD-04-Scenarios]] Fora (v1.1) | Ausente — **stretch**, pode escorregar p/ 1.1.1 |
| I1 | Suítes de teste + CI (regressão AUD, consolidação, cobertura) | [[07-Estrategia-Testes]] | Ausente — `ci.yml:28-29` roda `vitest run` sem `--coverage`; **0** testes citam `AUD-xx`; `@vitest/coverage-v8` já instalado |

## 3. Escopo

### Must (v1.1.0)
- **M1** — Adicionar `Forbidden` e `Rate Limited` à lista de cenários da UI; garantir switch e request log exibindo o nome correto.
- **M2** — Campo `errorRate` (0–100) no `config.json` (default `0`); aplicação determinística por seed; precedência: cenário ativo > errorRate > default. Registrar em `types.ts` + mock server.
- **M3** — Estender `RequestLogEntry` com `requestBody`/`responseBody` truncados (ex.: 1KB) e flag `truncated`; exibir no `Show Request Log` de forma legível.
- **M4** — `staleDetector` por artefato: `.hashes.json` guarda hash por artefato (`openapiJson/Yaml`, `jsonSchema`, `typesTs`, `markdown`); export parcial só atualiza o artefato exportado; **CLI grava hashes** no `devmock export`.

### Should (stretch — pode ir para 1.1.1)
- **S1** — Cenários condicionais por header/query no CRUD de cenário.

### Infra — Suítes de teste (workstream I1, dono [[Agente-QA-Testes]])
Detalhe e matriz de rastreabilidade em [[07-Estrategia-Testes]].
- **S1** — `regression.test.ts` por pacote: 1 `it('AUD-xx — …')` por entrada do catálogo (11 unit/integração + guard tests).
- **S2** — Consolidar a pirâmide e preencher a matriz `RF do PRD → teste`, zerando aceites órfãos.
- **S3** — `--coverage` no CI com threshold (core ≥90%, cli ≥80%) + artefato; suíte de regressão como *check* obrigatório.
- **Guards** de infra: build-order (AUD-14), `tsconfig` outDir/exclude (AUD-06/11), cjs-esm (AUD-08), ci-build (AUD-15).

### Fora do escopo → v1.2.0
- **Detect from project** (hoje placeholder em `apps/extension/src/extension.ts:274`) — exige **PRD-09** novo.
- **HTML docs** (hoje só Markdown em `packages/core/src/export/md.ts`).

## 4. Definition of Done (por item)
- **M1** Manual-Teste: switch 403 e 429 aplica em <500ms; log mostra o cenário. Teste de UI/ops.
- **M2** `errorRate: 50` com seed fixa → distribuição reproduzível; `0` mantém comportamento atual. Teste unitário no core.
- **M3** Log expõe bodies truncados; body > limite marca `truncated: true`. Teste unitário.
- **M4** Exportar só Markdown não marca OpenAPI como sincronizado; `devmock export` gera `.hashes.json`. Testes por artefato + suite CLI.
- **I1** Matriz `AUD → teste` 100% verde (15/15 com teste nomeado); CI publica cobertura e falha abaixo do threshold; guards de infra rodando.

## 5. Passos de execução (checklist ordenado)
- [x] #task 🔼 S1 — `regression.test.ts` por pacote (1 `it` por AUD-xx) 🏷️ fase/codigo
- [x] #task 🔼 S2 — matriz `RF → teste` e aceites órfãos zero 🏷️ fase/codigo
- [x] #task 🔼 S3 — cobertura + threshold + artefato no CI 🏷️ fase/codigo
- [x] #task 🔼 Guards de infra (build-order, tsconfig, cjs-esm, ci-build) 🏷️ fase/codigo
- [x] #task ⏫ M1 — expõe 403/429 na UI da extension 🏷️ fase/codigo
- [x] #task ⏫ M2 — `errorRate` no core + UI/config 🏷️ fase/codigo
- [x] #task ⏫ M3 — request log com body truncado 🏷️ fase/codigo
- [x] #task ⏫ M4 — staleDetector por artefato + CLI grava hashes 🏷️ fase/codigo
- [ ] #task 🔼 S1 (stretch) — cenários por header/query — **não entrou na 1.1.0**; candidato a v1.2.0 🏷️ fase/codigo
- [x] #task 🔼 Atualizar Manual-Teste com os casos novos 🏷️ fase/codigo
- [x] #task 🔼 CHANGELOG + `package.json` → `1.1.0` 🏷️ fase/codigo
- [x] #task 🔼 Sincronizar README + wiki (Docs-Keeper) 🏷️ fase/codigo
- [x] #task ⏫ Rodar Gate de Release (§6) — automático ✅ + host (UI) ✅ 🏷️ fase/codigo

## 6. Gate de Release (apto a commitar a versão)
- [x] Manual-Teste 100% ✅ (incluindo casos de M1–M4) — validado no host
- [x] `vitest run` verde + cobertura ≥ threshold (I1) + matriz `AUD → teste` 100%
- [x] `tsc --noEmit` limpo em todos os workspaces
- [x] CHANGELOG da extension + `package.json` = `1.1.0`
- [x] README (raiz + extension) e wiki sincronizados
- [x] `Log-Versionamento` atualizado
- [x] Tag `ext-v1.1.0` (trava `tag == versão`) → `publish.yml` — publicada ✅
- [x] Post de lançamento (texto do [[Agente-LinkedIn]], postagem manual) ✅

> **Regra:** nenhum push de tag `ext-v1.1.0` antes de todas as caixas acima.

## 7. Riscos e Dependências
- **R-01 (geradores BR)** — revisar antes de qualquer mudança no core (task em [[04-Riscos]]).
- **M4** toca o contrato de `.hashes.json` — retrocompatível (`{}` vazio = tudo stale).
- **M2** interage com cenários (precedência) — cobrir no teste de switch.
- **S1** pode escorregar sem bloquear a release (é stretch).

## 8. Links
- Escopo MoSCoW: [[03-MVP-Scope]] | EAP: [[01-EAP]] | Métricas: [[05-Metricas-Sucesso]] | Riscos: [[04-Riscos]]
- PRDs: [[PRD-02-Mock-Server]] · [[PRD-03-VSCode-Extension]] · [[PRD-04-Scenarios]] · [[PRD-05-Docs-Export]]
- Arquitetura: [[05-Integracoes-OpenAPI-TS]]
- Qualidade/suítes: [[07-Estrategia-Testes]] · [[Agente-QA-Testes]] | Catálogo: [[Agente-Auditor]]
- Próxima rodada: **v1.2.0** — Detect from project (PRD-09) + HTML docs
