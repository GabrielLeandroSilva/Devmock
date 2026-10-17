---
title: "Log de Versionamento"
type: gestao
status: revisao
fase: 0
tags: [devmock/gestao, devmock/git]
related: ["[[Agente-Git-Guardiao]]"]
created: 2026-10-10
updated: 2026-10-10
---

# Gestão — Log de Versionamento

> Mantido pelo [[Agente-Git-Guardiao]] a cada push. Branch de trabalho: `des`. `main` só via promoção validada.

## Histórico

| Versão | Data | Branch | Fase | Commit | Status |
|--------|------|--------|------|--------|--------|
| v0.1.0 | 2026-10-10 | main + des | Fase 0 — vault, templates, home | `chore(vault): fase 0 — estrutura, templates, home e índices` | ✅ validado, em main |
| v0.1.1 | 2026-10-10 | des | Infra git — guardião + log | `docs(git): infra do guardião + log de versionamento` | ✅ em des |
| v0.1.2 | 2026-10-10 | des | Repo leve — ignora binários plugins | `chore(git): ignora binários dos plugins Obsidian` | ✅ em des |
| v0.2.0 | 2026-10-10 | main + des | Fase 1 — 5 PRDs MVP | `docs(prd): fase 1 — 5 PRDs do MVP` + merge `eb90ddf` | ✅ validado, em main |
| v0.2.1 | 2026-10-10 | des | Pós-promoção + ignora graph.json | `docs(git): registra promoção v0.2.0 em main` | ✅ em des |
| v0.3.0 | 2026-10-10 | main + des | Fase 2 — Arquitetura + Processos | `docs(arq): fase 2 — arquitetura e processos` | ✅ validado, em main |
| v0.3.1 | 2026-10-10 | main + des | Fix mermaid 01 + 05 | `fix(mermaid): corrige diagramas 01-Core-Model e 05-Integracoes` | ✅ validado, em main |
| v0.3.2 | 2026-10-10 | main + des | Fix mermaid 00-Visao + varredura vault | `fix(mermaid): corrige 00-Visao e audita demais diagramas` + merge `292b97c` | ✅ validado, em main |
| v0.3.3 | 2026-10-10 | des | Pós-promoção v0.3.2 | `docs(git): registra promoção v0.3.2 em main` | ✅ em des |
| v0.3.4 | 2026-10-10 | des | Promoção via PR (doc) | `docs(git): promoção passa a ser via Pull Request` | ✅ em des |
| v0.3.5 | 2026-10-11 | main + des | Ruleset + gh PR automático | `docs(git): ruleset ativo e guardião com gh pr create` + PR `nº 3` (merge commit) | ✅ validado, em main |
| v0.3.6 | 2026-10-11 | des | Pós-promoção v0.3.5 (PR nº 3) | `docs(git): registra promoção v0.3.5 em main` | ✅ em des |
| v0.4.0 | 2026-10-11 | main + des | Fase 3 — Prompts + Agentes | `docs(prompt): fase 3 — specs e agentes` + PR `nº 4` (merge commit) | ✅ validado, em main |
| v0.4.1 | 2026-10-11 | des | Pós-promoção v0.4.0 (PR nº 4) | `docs(git): registra promoção v0.4.0 em main` | ✅ em des |
| v0.5.0 | 2026-10-11 | main + des | Fase 4 — Gestão (EAP + Cronograma) | `docs(gestao): fase 4 — charter, eap, cronograma e cia` + PR `nº 5` (merge commit) | ✅ validado, em main |
| v0.5.1 | 2026-10-11 | main + des | Config Tasks Kanban | `fix(obsidian): configura Tasks Kanban com 4 boards` + PR `nº 5` (merge commit) | ✅ validado, em main |
| v0.5.2 | 2026-10-11 | des | Pós-promoção v0.5.1 (PR nº 5) | `docs(git): registra promoção v0.5.1 em main` | ✅ em des |
| v0.6.0 | 2026-10-11 | main + des | Fase 5 — Extras + Costura | `docs(extras): fase 5 — concorrentes, gtm, ux, glossário, adrs` + PR `nº 6` (merge commit) | ✅ validado, em main |
| v0.6.1 | 2026-10-11 | des | Pós-promoção v0.6.0 (PR nº 6) | `docs(git): registra promoção v0.6.0 em main` | ✅ em des |
| v0.7.0 | 2026-10-11 | main + des | Código EAP 1.1 + scaffolds | `feat(core): monorepo, core 1.1 com testes, extension mínima` + PR `nº 7` (merge commit) | ✅ validado, em main |
| v0.7.1 | 2026-10-11 | main + des | CNPJ alfanumérico (Receita 31/07/2026) | `fix(core): genCnpj emite formatos numérico + alfanumérico` + PR `nº 7` | ✅ validado, em main |
| v0.7.2 | 2026-10-11 | main + des | Fix outDir do core | `fix(core): outDir explicito no tsconfig do core` + PR `nº 7` | ✅ validado, em main |
| v0.7.3 | 2026-10-12 | des | Pós-promoção v0.7.2 (PR nº 7) | `docs(git): registra promoção v0.7.2 em main` | ✅ em des |
| v0.8.0 | 2026-10-12 | main + des | Código EAP 1.2 — Mock Server + CLI | `feat(mock): eap 1.2 — mock server, cenários, cli start` + PR `nº 8` (merge commit) | ✅ validado, em main |
| v0.8.1 | 2026-10-12 | main + des | Auditoria 1.2 — 7 bugs corrigidos, 26/26 verdes | `fix(mock): crud persiste, eaddrinuse, nan, case, cli` + PR `nº 8` (merge commit) | ✅ validado, em main |
| v0.8.2 | 2026-10-12 | main + des | Agente Auditor + gate no Guardião | `docs(agente): cria auditor e amarra ao fluxo de promoção` + PR `nº 8` | ✅ validado, em main |
| v0.8.3 | 2026-10-12 | des | Pós-promoção v0.8.2 (PR nº 8) | `docs(git): registra promoção v0.8.2 em main` | ✅ em des |
| v0.9.0 | 2026-10-12 | main + des | Código EAP 1.3–1.5 — exportadores + extension | `feat(export): eap 1.5 + extension 1.3/1.4` + PR `nº 9` (merge commit) | ✅ validado, em main |
| v0.9.1 | 2026-10-12 | main + des | Auditoria 1.5 — reload, YAML, parser real | `fix(auditoria): reload, yaml canônico, swagger-parser` + PR `nº 9` | ✅ validado, em main |
| v0.9.2 | 2026-10-12 | des | Pós-promoção v0.9.1 (PR nº 9) | `docs(git): registra promoção v0.9.1 em main` | ✅ em des |
| v0.9.3 | 2026-10-12 | des | Manual de teste v1.0.0 | `docs(qa): manual de teste passo a passo` | ⏳ em des, em revisão |
| v0.9.4 | 2026-10-12 | des | launch.json F5 da extension | `fix(extension): debug Run Extension via F5` | ⏳ em des, em revisão |
| v0.9.5 | 2026-10-12 | des | Core CJS p/ host VS Code (AUD-08) | `fix(core): emite CJS; host-sim + cli e2e verdes` | ⏳ em des, em revisão |
| v0.9.6 | 2026-10-12 | des | Comando Save Fake Data | `feat(extension): save fake data em docs/examples` | ⏳ em des, em revisão |
| v0.9.7 | 2026-10-12 | des | plural idempotente (AUD-09) | `fix(core): model plural não ganha s extra` | ⏳ em des, em revisão |
| v0.9.8 | 2026-10-12 | des | Built-in scenarios (AUD-10) | `fix(core): cenários default embutidos + 403/429` | ⏳ em des, em revisão |
| v1.0.0 | 2026-10-12 | main + des | MVP — manual 100% ✅ | Manual-Teste-v1 §0–§8 todos ✅ + PR `nº 10` (merge commit) | ✅ validado, em main |
| v1.0.1 | 2026-10-12 | des | Pós-promoção v1.0.0 (PR nº 10) | `docs(git): registra promoção v1.0.0 em main` | ✅ em des |
| v1.1.0 | 2026-10-12 | main + des | Studio: painel Schema+Preview com CSS próprio | `feat(extension): studio com preview, CSP estrito` + PR `nº 11` | ✅ validado, em main |
| v1.1.1 | 2026-10-12 | main + des | Studio: badge oculto + preview automático | `fix(extension): badge e auto-preview com debounce` + PR `nº 11` | ✅ validado, em main |
| v1.1.2 | 2026-10-12 | main + des | Studio: remove badge de registros/seed | `fix(extension): remove badge do preview` + PR `nº 11` | ✅ validado, em main |
| v1.1.3 | 2026-10-12 | main + des | README com comandos + exemplo | `docs(readme): comandos cli/extension + e2e` + PR `nº 11` (merge commit) | ✅ validado, em main |
| v1.1.4 | 2026-10-12 | des | Pós-promoção v1.1.3 (PR nº 11) | `docs(git): registra promoção v1.1.3 em main` | ✅ em des |
| v1.2.0 | 2026-10-12 | main + des | Fecha EAP-1: picker Create API + aviso stale | `feat(extension): create-api picker + stale no export` + PR `nº 12` (merge commit) | ✅ validado, em main + manual host ✅ |
| v1.2.1 | 2026-10-12 | des | Pós-promoção v1.2.0 (PR nº 12) | `docs(git): registra promoção v1.2.0 em main` | ✅ em des |
| v1.2.2 | 2026-10-12 | des | Manual host confirma v1.2.0 | `docs(qa): manual host confirma v1.2.0` | ✅ em des |
| v1.2.3 | 2026-10-12 | des | Context-Mode configurado | `docs(infra): context-mode index + config` | ✅ em des |
| v1.3.0 | 2026-10-12 | main + des | EAP 2.1 — Import OpenAPI | `feat(import): openapi para schemas + cli + extension` + PR `nº 13` (merge commit) | ✅ validado, em main |
| v1.3.1 | 2026-10-13 | des | Pós-promoção v1.3.0 (PR nº 13) | `docs(git): registra promoção v1.3.0 em main` | ✅ em des |
| v1.4.0 | 2026-10-13 | main + des | Studio: editar Schema com rename | `feat(extension): edita schema no mesmo studio` + PR `nº 14` (merge commit) | ✅ validado, em main |
| v1.4.1 | 2026-10-13 | des | Pós-promoção v1.4.0 (PR nº 14) | `docs(git): registra promoção v1.4.0 em main` | ✅ em des |
| v1.5.0 | 2026-10-13 | main + des | EAP 2.2 — Contract Validation | `feat(validate): contrato contra api real + cli + extension` + PR `nº 15` (merge commit) | ✅ validado, em main |
| v1.5.1 | 2026-10-14 | main + des | Cobertura 85→94% (68 testes) | `test(core): fecha gaps — schemaStore, branches, errors` + PR `nº 15` | ✅ validado, em main |
| v1.5.2 | 2026-10-14 | des | Pós-promoção v1.5.1 (PR nº 15) | `docs(git): registra promoção v1.5.1 em main` | ✅ em des |
| v1.6.0 | 2026-10-14 | main + des | EAP 2.3 — CLI generate/export + CI | `feat(cli): generate, export + github actions` + PR `nº 16` | ✅ validado, em main |
| v1.6.1 | 2026-10-14 | main + des | README tabela CLI completa | `docs(readme): tabela CLI completa` + PR `nº 16` | ✅ validado, em main |
| v1.6.2 | 2026-10-14 | main + des | Suíte E2E do CLI (6 testes) | `test(cli): e2e dos 6 comandos via spawn` + PR `nº 16` (merge commit) | ✅ validado, em main |
| v1.6.3 | 2026-10-14 | des | Pós-promoção v1.6.2 (PR nº 16) | `docs(git): registra promoção v1.6.2 em main` | ✅ em des |
| v1.7.0 | 2026-10-15 | main + des | Rodada real no host (12 testes, AUD-11–13) | `test(extension): suite test-electron + ops puros` + PR `nº 17` | ✅ validado, em main |
| v1.7.1 | 2026-10-15 | main + des | Fix build ordenado (CI vermelho) | `fix(build): core antes dos dependentes` + PR `nº 17` | ✅ validado, em main |
| v1.7.2 | 2026-10-15 | main + des | Fix workflow: npm run build (sem --workspaces) | `fix(ci): chama script raiz ordenado` + PR `nº 17` (merge commit) | ✅ validado, em main |
| v1.7.3 | 2026-10-15 | des | Pós-promoção v1.7.2 (PR nº 17) | `docs(git): registra promoção v1.7.2 em main` | ✅ em des |
| v1.8.0 | 2026-10-15 | main + des | Prontidão Marketplace + Docs-Keeper | `feat(release): vsix 1.0.0, publish CI, keeper` + PR `nº 18` (merge commit) | ✅ validado, em main |
| v1.8.1 | 2026-10-16 | des | Pós-promoção v1.8.0 (PR nº 18) | `docs(git): registra promoção v1.8.0 em main` | ✅ em des |
| v1.8.2 | 2026-10-16 | des | README de usuário + publicação | `docs(readme): foco usuário + tag ext-v1.0.0` | ⏳ em des, em revisão |
| v1.8.3 | 2026-10-16 | main + des | Fix publish: cwd + dispatch | `fix(ci)` + PRs `nº 20` e `nº 21` | ✅ validado, em main |
| ext-v1.0.0 | 2026-10-16 | tag em main | 🎉 PUBLICADO na Marketplace | `Published devmock.devmock-vscode v1.0.0` via publish.yml | ✅ ao vivo |
| v1.8.4 | 2026-10-16 | des | About do repo + Agente LinkedIn | `docs(divulg): about + agente-linkedin` | ⏳ em des, em revisão |
| — | 2026-10-16 | — | 📣 Post de lançamento publicado no LinkedIn (texto do Agente-LinkedIn, postagem manual) + About verificado na API | marco de divulgação, sem versão | ✅ no ar |
| v1.8.5 | 2026-10-17 | des | Planejamento da release v1.1.0 (fechar Should do MVP) | `docs(release): plano v1.1.0 + rastreabilidade de pendências` | ⏳ em des, em revisão |
| v1.8.6 | 2026-10-17 | des | Agente-QA-Testes + estratégia de suítes (S1/S2/S3) | `docs(qa): agente qa-testes + estrategia de suites` | ⏳ em des, em revisão |
| v1.8.7 | 2026-10-17 | des | S1 — regressão por AUD (15/15) + 5 guards (core 82 ✅, host 13 ✅) | `test(qa): suites de regressao AUD-01..15 + guards de infra` | ⏳ em des, em revisão |
| v1.8.8 | 2026-10-17 | des | S2 — matriz RF→teste dos 8 PRDs + 4 órfãos fechados (core 86 ✅, cli 7 ✅) | `test(qa): matriz rf->teste + testes de aceite de PRD` | ⏳ em des, em revisão |
| v1.8.9 | 2026-10-17 | des | S3 — gate de cobertura no Core (≥90/80) + artefato no CI | `ci(qa): cobertura do core com threshold + artefato` | ⏳ em des, em revisão |
| v1.9.0 | 2026-10-17 | des | M1 — UI expõe 403/429 via fonte única `SCENARIO_NAMES` (core 87 ✅, host 13 ✅) | `feat(ui): expoe forbidden e rate limited no switch` | ⏳ em des, em revisão |
| v1.9.1 | 2026-10-17 | des | M2 — `errorRate` 0–100 determinístico por seed (core 89 ✅) | `feat(mock): errorRate deterministica + settings` | ⏳ em des, em revisão |
| v1.9.2 | 2026-10-17 | des | M3 — request log com body truncado 1KB (core 90 ✅, host 14 ✅) | `feat(log): request log com body truncado` | ⏳ em des, em revisão |
| v1.9.3 | 2026-10-17 | des | M4 — staleDetector por artefato + CLI grava `.hashes.json` (core 92 ✅, cli 7 ✅, host 15 ✅) | `fix(export): stale por artefato + cli grava hashes` | ⏳ em des, em revisão |
| v1.9.4 | 2026-10-17 | des | Fixa modelo `opencode-go/gpt-6-luna` no subagente qa-testes | `chore(qa): fixa modelo gpt-6-luna no subagente qa-testes` | ⏳ em des, em revisão |
| v1.9.5 | 2026-10-17 | des | Fechamento v1.1.0: Manual-Teste-v1.1, versão `1.1.0`, README+wiki, gate (core 92/cob 94% · cli 7 · host 15) | `docs(release): fecha v1.1.0 — manual, versao e docs` | ⏳ em des, em revisão |

## Consulta (Dataview — notas de gestão)

```dataview
TABLE status AS Status, fase AS Fase
FROM "05-Gestao-Projeto"
SORT file.name ASC
```

## Tasks
- [x] #task ⏫ Revisar os 5 PRDs da Fase 1 e aprovar 🏷️ fase/1
- [x] #task 🔼 Promover v0.2.0 para main após aprovação 🏷️ fase/1
- [x] #task 🔼 Iniciar Fase 2 — Arquitetura + Processos 🏷️ fase/2
- [x] #task ⏫ Revisar Arquitetura + Processos da Fase 2 🏷️ fase/2
- [x] #task 🔼 Promover v0.3.2 para main após aprovação 🏷️ fase/2
- [x] #task 🔼 Iniciar Fase 3 — Prompts + Agentes 🏷️ fase/3
- [x] #task ⏫ Revisar SPECs + agentes da Fase 3 🏷️ fase/3
- [x] #task 🔼 Promover v0.4.0 para main após aprovação 🏷️ fase/3
- [x] #task 🔼 Iniciar Fase 4 — Gestão (EAP + Cronograma) 🏷️ fase/4
- [x] #task ⏫ Revisar Gestão da Fase 4 🏷️ fase/4
- [x] #task 🔼 Promover v0.5.0 para main após aprovação 🏷️ fase/4
- [x] #task 🔼 Iniciar Fase 5 — Extras e Costura 🏷️ fase/5
- [x] #task ⏫ Revisar Extras da Fase 5 🏷️ fase/5
- [x] #task 🔼 Promover v0.6.0 para main após aprovação 🏷️ fase/5
- [x] #task ⏫ Revisar código v0.7.0 (core 1.1 + scaffolds) 🏷️ fase/codigo
- [x] #task 🔼 Promover v0.7.0 para main após aprovação 🏷️ fase/codigo
- [x] #task 🔼 Seguir EAP 1.2 — Mock Server 🏷️ fase/codigo
- [x] #task ⏫ Revisar código v0.8.x (mock server + auditoria) 🏷️ fase/codigo
- [x] #task 🔼 Promover v0.8.2 para main após aprovação (PR nº 8) 🏷️ fase/codigo
- [x] #task 🔼 Seguir EAP 1.3–1.5 — Extension + Export 🏷️ fase/codigo
- [x] #task ⏫ Revisar código v0.9.0 (export + extension) 🏷️ fase/codigo
- [x] #task 🔼 Promover v0.9.0 para main após aprovação 🏷️ fase/codigo
- [ ] #task ⏫ Teste manual passo a passo (host VS Code real) antes da v1.0.0 🏷️ fase/codigo
- [x] #task ⏫ Executar Manual-Teste-v1 e preencher tabela de Resultado 🏷️ fase/codigo
- [x] #task 🔼 Promover v1.0.0 para main após manual 100% (PR nº 10) 🏷️ fase/codigo
- [ ] #task ⏫ Executar o plano da v1.1.0 (M1–M4 + gate de cobertura) 🏷️ fase/codigo
- [ ] #task ⏫ Levantar suítes de teste (S1 regressão AUD + S2 consolidação + S3 CI) 🏷️ fase/codigo
