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
| v1.9.6 | 2026-10-17 | des | Fix F5: task usa `npm run build:host` (evita yarn) | `fix(dev): task do F5 usa npm explicito (evita yarn)` | ⏳ em des, em revisão |
| v1.9.7 | 2026-10-17 | des | Manual v1.1.0 100% ✅ no host (M1–M4 + regressão §1–§7) | `docs(qa): manual v1.1.0 100% aprovado no host` | ⏳ em des → promove |
| v1.9.8 | 2026-10-17 | main + des | 🚀 Promoção v1.1.0 (PR nº 23) + tag `ext-v1.1.0` | merge `42e8466` + tag `ext-v1.1.0` | ✅ validado, em main |
| ext-v1.1.0 | 2026-10-17 | tag em main | 🎉 PUBLICADO na Marketplace | `Published devmock.devmock-vscode v1.1.0` via publish.yml (run 39055951657) | ✅ ao vivo |
| — | 2026-10-17 | — | 📣 Post de lançamento v1.1.0 (texto do [[Agente-LinkedIn]], postagem manual) | marco de divulgação, sem versão | ✅ entregue |
| v1.9.9 | 2026-10-17 | des | ✅ Gate da v1.1.0 fechado — release concluída (M1–M4 + suítes S1–S3) | `docs(release): fecha gate da v1.1.0` | ✅ concluído |
| v1.9.10 | 2026-10-17 | des | Planejamento v1.2.0 (+v1.1.1): PRD-09 Detect, plano 08, RFs Tree UX, HTML docs, AUD-16 | `docs(release): planeja v1.2.0 + prd-09 detect` | ⏳ em des, em revisão |
| v1.9.11 | 2026-10-17 | des | v1.1.1 — fix Stop lento (AUD-16): `closeAllConnections` (core 93 ✅) + versão `1.1.1` | `fix(mock): stop encerra conexoes keep-alive (AUD-16)` | ⏳ em des, em revisão |
| v1.9.12 | 2026-10-17 | main + des | 🚀 Promoção v1.1.1 (PR nº 24) + tag `ext-v1.1.1` | merge `558a23a` + tag `ext-v1.1.1` | ✅ validado, em main |
| ext-v1.1.1 | 2026-10-17 | tag em main | 🎉 PUBLICADO na Marketplace (patch Stop) | `Published devmock.devmock-vscode v1.1.1` via publish.yml (run 39059635257) | ✅ ao vivo |
| v1.9.14 | 2026-10-17 | des | Organização: AGENTS.md + convenção Kanban (planejado=In Progress); wiki `Correções` + `Roadmap`; README "Em breve"; Docs-Keeper | `docs(org): agents + kanban + wiki correcoes/roadmap` | ⏳ em des, em revisão |
| v1.9.15 | 2026-10-17 | des | R1 stacks — Node ≥22 (CI 22/24), runtime extension Node 22 (VS Code ≥1.101), `@types/node ^22`; doc `06-Stacks-e-Versoes` | `chore(stacks): node >=22 + runtime extension node22` | ⏳ em des, em revisão |
| v1.9.16 | 2026-10-17 | des | R2 batch A — esbuild 0.28 · vsce 4 · test-electron 3 | `chore(deps): esbuild 0.28 + vsce 4 + test-electron 3` | ⏳ em des |
| v1.9.17 | 2026-10-17 | des | R2 batch B — mocha 12 · glob 13 (host 15 ✅) | `chore(deps): mocha 12 + glob 13` | ⏳ em des |
| v1.9.18 | 2026-10-17 | des | R2 batch C — vitest 5 + coverage 5 (core 93, gate ✅) | `chore(deps): vitest 5 + coverage 5` | ⏳ em des |
| v1.9.19 | 2026-10-17 | des | R2 batch D — TypeScript 7.0 (+ `types:["node"]`); gate completo verde | `chore(deps): typescript 7 + tsconfig types node` | ⏳ em des, em revisão |
| v1.9.20 | 2026-10-17 | des | W1 Tree UX — editar `errorRate` na Settings, cenário no Schema/Endpoints, abrir GET no navegador, ícones Start/Stop (host 18 ✅) | `feat(extension): tree ux — errorRate, cenario, open endpoint, start/stop` | ⏳ em des, em revisão |
| v1.9.21 | 2026-10-17 | des | W3 HTML docs — página única offline (`docs/index.html`) + artefato `html` no export/stale (core 96 ✅, cli 7 ✅, host 18 ✅) | `feat(export): html docs em pagina unica` | ⏳ em des, em revisão |
| v1.9.22 | 2026-10-17 | des | W2 Detect from project — varre `src/`, interfaces TS → Schemas, chamadas HTTP → endpoints, multi-seleção; `Create API → Detect` (core 100 ✅, host 19 ✅) | `feat(detect): detect from project` | ⏳ em des, em revisão |
| v1.9.23 | 2026-10-17 | des | Fechamento v1.2.0: Manual-Teste-v1.2, versão `1.2.0`, CHANGELOG, README+wiki; gate automático (core 100/cob 90.6 · cli 7 · host 19) | `docs(release): fecha v1.2.0 — manual, versao e docs` | ⏳ em des, em revisão |
| v1.9.24 | 2026-10-17 | des | Fix F5: `--disable-extensions` (tentativa de evitar 1.1.1 publicada sombrear) | `fix(dev): F5 carrega apenas a extensao dev` | ⏳ em des |
| v1.9.25 | 2026-10-17 | des | Reverte `--disable-extensions`; diagnóstico: VS Code do mantenedor **1.95 < 1.101** (mínimo p/ Node 22). Manual exige VS Code ≥1.101 | `fix(dev): reverte disable-extensions + requisito VS Code 1.101` | ⏳ em des |
| v1.9.26 | 2026-10-19 | des | Fix docs: `Response 200` vira **JSON válido** com 1 registro real (Markdown e HTML); remove o placeholder `"data": "Model[]"` | `fix(export): exemplo de response 200 valido` | ⏳ em des |
| v1.9.27 | 2026-10-19 | des | Fix W2: Detect valida refs entre os Schemas do lote (Order→Customer não é mais "quebrada"); ambos são criados | `fix(detect): refs entre schemas do lote` | ⏳ em des |
| v1.9.28 | 2026-10-19 | des | UX: **Start/Stop no topo da view** (context key `devmock.serverRunning`); nó Mock Server sem botões inline | `feat(ui): start/stop no titulo da view` | ⏳ em des |
| v1.9.29 | 2026-10-20 | main + des | 🚀 Promoção v1.2.0 (PR nº 25) + tag `ext-v1.2.0` | merge `082e0fa` + tag `ext-v1.2.0` | ✅ validado, em main |
| ext-v1.2.0 | 2026-10-20 | tag em main | 🎉 PUBLICADO na Marketplace (Tree UX, Detect, HTML docs) | `Published devmock.devmock-vscode v1.2.0` via publish.yml (run 39352777569) | ✅ ao vivo |
| — | 2026-10-20 | — | 📣 Post de lançamento v1.2.0 (texto do [[Agente-LinkedIn]], postagem manual) | marco de divulgação, sem versão | ✅ entregue |
| v1.9.30 | 2026-10-20 | des | ✅ Gate da v1.2.0 fechado (W1–W3 + P0 publicados; post entregue) | `docs(release): fecha gate da v1.2.0` | ✅ concluído |
| v1.9.31 | 2026-10-20 | des | Planejamento v1.3.0: skill `roadmap-update`, plano 10 (T1 header/query + T3 testes da UI), PRD-04, roadmap (Home/EAP/wiki/README) | `docs(release): planeja v1.3.0 + skill roadmap-update` | ✅ concluído |
| v1.9.32 | 2026-10-20 | des | T1 entregue: cenário por `?scenario=` / `X-Mock-Scenario` (request > ativo > Default, fallback, CORS); core 108 testes, cobertura 90.76/82.02 | `feat(mock): cenário por header/query na requisição (T1)` | ✅ em des, em revisão |
| v1.9.33 | 2026-10-20 | des | T3a entregue: builder puro da Tree (`tree.ts`) + 8 testes no host (27); órfão (a) fechado | `refactor(extension): builder puro da Tree (T3a)` | ✅ em des, em revisão |
| v1.9.34 | 2026-10-20 | des | T3b entregue: c8 no CLI (filho via `NODE_V8_COVERAGE`), 15 testes, 96.46/87.12/100; gate 90/80/95/90 no CI + artefato | `test(cli): cobertura do processo filho com c8 (T3b)` | ✅ em des, em revisão |
| v1.9.35 | 2026-10-20 | des | T2 entregue: Detect com clientes variados/genéricos, config-object, `fetch` com método e base/URL normalizada; core 111 testes | `feat(detect): amplia padrões de chamadas HTTP (T2)` | ✅ em des, em revisão |
| v1.9.36 | 2026-10-20 | des | Fechamento v1.3.0: Manual-Teste-v1.3, versão `1.3.0`, CHANGELOG, README; gate automático (core 111/cob 90.83 · cli 15/cob 96.46 · host 27); wiki pronta p/ publish | `docs(release): fecha v1.3.0 - manual, versao e docs` | ✅ concluído |
| ext-v1.3.0 | 2026-10-21 | tag em des | 🚀 PUBLICADO na Marketplace (cenário por requisição, Detect ampliado, qualidade) | `Published devmock.devmock-vscode v1.3.0` via publish.yml (run 39524527077; 1ª tentativa caiu por ETIMEDOUT no download do VS Code; rerun ok) | ✅ ao vivo |
| v1.9.37 | 2026-10-21 | des | Pós-publicação v1.3.0: wiki, Log, Home/EAP; PR `#26` (des→main) | `docs(release): publica v1.3.0 e sincroniza docs` | ✅ em main (PR #26, merge `9df6dac`) |
| v1.9.38 | 2026-10-21 | des | Pós-promoção v1.3.0 (PR #26) | `docs(git): registra promoção v1.3.0 em main` | ✅ em des |
| - | 2026-10-21 | - | 📝 Texto do post de lançamento v1.3.0 gerado ([[Agente-LinkedIn]]: curto + completo + hashtags + CTA + arte); postagem manual pendente | marco de divulgação, sem versão | ⏳ aguarda postagem |
| v1.9.40 | 2026-10-21 | des | Agentes: **Code-Reviewer** (read-only, 2 eixos) e **DevOps-Automator** (CI/CD/release enxuto) a partir dos anexos; `AGENTS.md`; anexos removidos após a criação | `docs(agentes): adiciona code-reviewer e devops-automator` | ✅ em des |
| v1.9.41 | 2026-10-21 | des | Planejamento v1.4.0: **Ações** no header + **cenário por clique** (mouse-first); plano 11, PRD-03 (RF-12..14), PRD-04, Home/EAP, wiki/README | `docs(release): planeja v1.4.0 - acoes e cenario por clique` | ✅ em des |
| v1.9.42 | 2026-10-21 | des | M1 v1.4.0: botão **Ações** (QuickPick agrupado, estado dinâmico, New Schema fora do header); host **36** testes; Code-Reviewer + QA-Testes | `feat(extension): botão Ações na Tree (M1)` | ✅ em des |
| v1.9.43 | 2026-10-21 | des | M2 v1.4.0: **cenário por clique** (multi-seleção de Schemas, GET de coleção, reload vivo, dedupe); host **41** testes; Code-Reviewer + QA-Testes | `feat(extension): cenário por clique na Tree (M2)` | ✅ em des |
| v1.9.44 | 2026-10-21 | des | Fechamento v1.4.0: Manual-Teste-v1.4 (só-mouse), versão `1.4.0`, CHANGELOG, README; gate core 111 · cli 15 · host 41 | `docs(release): fecha v1.4.0 - manual, versao e docs` | ✅ concluído |
| ext-v1.4.0 | 2026-10-22 | tag em des | 🚀 PUBLICADO na Marketplace (**Ações** no header + **cenário por clique**, mouse-first) | `Published devmock.devmock-vscode v1.4.0` via publish.yml (run 39709686570) | ✅ ao vivo |
| v1.9.45 | 2026-10-22 | des | Pós-publicação v1.4.0: wiki, Log, Home/EAP; PR `#27` (des→main) | `docs(release): publica v1.4.0 e sincroniza docs` | ✅ em main (PR #27, merge `c6b15f3`) |
| v1.9.46 | 2026-10-22 | des | Pós-promoção v1.4.0 (PR #27) | `docs(git): registra promoção v1.4.0 em main` | ✅ em des |
| v1.9.47 | 2026-10-22 | des | Agente **Technical-Writer** (Divio, README 5s, exemplos executáveis) + fronteira no Docs-Keeper; anexo removido após a criação | `docs(agentes): adiciona technical-writer` | ✅ em des |
| v1.9.48 | 2026-10-22 | des | Agente **LinkedIn** atualizado (pilares, 3 ganchos, tipos de post, link no 1º comentário) + subagente; anexo removido | `docs(agentes): atualiza linkedin e adiciona subagente` | ✅ em des |
| v1.9.49 | 2026-10-22 | des | Planejamento v1.5.0: **mapa de rotas por Schema** (custom), POST/PATCH/DELETE na Tree, semântica PUT/400/405; plano 12, PRD-02/03/04/05, Home/EAP, wiki/README | `docs(release): planeja v1.5.0 - rotas completas` | ✅ em des |
| v1.9.50 | 2026-10-22 | des | M1 v1.5.0: `Schema.routes` + defaults + validação (path/kind/params/duplicatas) + `routeKey` canônico; core **140**/host **44**; Code-Reviewer + QA-Testes | `feat(core): mapa de rotas por Schema (M1)` | ✅ em des |
| v1.9.51 | 2026-10-22 | des | M2/M3 v1.5.0: router por Schema (custom/aninhada, aliases), validação/400/405, PUT replace/PATCH merge, precedência status/body; core **180** · CLI **18** · host **45**; Code-Reviewer + QA-Testes | `feat(core): router e semântica das rotas (M2/M3)` | ✅ em des |
| v1.9.52 | 2026-10-22 | des | M4 v1.5.0: menu do endpoint (cenário/cURL/browser), `Switch Scenario` todas as rotas, cenário por método, contador por rota; host **60**; Code-Reviewer + QA-Testes | `feat(extension): menu de ações do endpoint (M4)` | ✅ em des |
| v1.9.53 | 2026-10-22 | des | M5 v1.5.0: editor de rotas no Studio (toggle/tabela, add/reset, `summary` passthrough, `jsonForHtml`); host **61**; review+QA; **dívida Webview** registrada | `feat(extension): editor de rotas no Studio (M5)` | ⏳ em des, aguarda Manual-Teste |
| v1.9.54 | 2026-10-22 | des | M6 v1.5.0: OpenAPI/MD/HTML por rota, validate `kind: list` + skip, `Location`/expose, `summary`; core **193** · CLI **20** · host **62**; review+QA | `feat(core): export e validate com rotas custom (M6)` | ✅ em des |

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
