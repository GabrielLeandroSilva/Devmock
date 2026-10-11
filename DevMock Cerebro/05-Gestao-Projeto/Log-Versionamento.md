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
| v0.4.0 | 2026-10-11 | des | Fase 3 — Prompts + Agentes | `docs(prompt): fase 3 — specs e agentes` | ⏳ em des, em revisão |

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
- [ ] #task ⏫ Revisar SPECs + agentes da Fase 3 🏷️ fase/3
- [ ] #task 🔼 Promover v0.4.0 para main após aprovação 🏷️ fase/3
