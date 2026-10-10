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
| v0.3.0 | 2026-10-10 | des | Fase 2 — Arquitetura + Processos | `docs(arq): fase 2 — arquitetura e processos` | ⏳ em des, em revisão |
| v0.3.1 | 2026-10-10 | des | Fix mermaid 01 + 05 | `fix(mermaid): corrige diagramas 01-Core-Model e 05-Integracoes` | ✅ em des |
| v0.3.2 | 2026-10-10 | des | Fix mermaid 00-Visao + varredura vault | `fix(mermaid): corrige 00-Visao e audita demais diagramas` | ⏳ em des, em revisão |

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
- [ ] #task ⏫ Revisar Arquitetura + Processos da Fase 2 🏷️ fase/2
- [ ] #task 🔼 Promover v0.3.0 para main após aprovação 🏷️ fase/2
