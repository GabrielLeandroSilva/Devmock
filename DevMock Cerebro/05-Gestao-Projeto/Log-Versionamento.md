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
| v1.2.0 | 2026-10-12 | main + des | Fecha EAP-1: picker Create API + aviso stale | `feat(extension): create-api picker + stale no export` + PR `nº 12` (merge commit) | ✅ validado, em main |
| v1.2.1 | 2026-10-12 | des | Pós-promoção v1.2.0 (PR nº 12) | `docs(git): registra promoção v1.2.0 em main` | ✅ em des |

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
