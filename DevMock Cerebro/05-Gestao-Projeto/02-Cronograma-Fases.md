---
title: "Cronograma por Fases"
type: gestao
status: revisao
fase: 4
tags: [devmock/gestao, devmock/cronograma]
related: ["[[01-EAP]]", "[[00-Project-Charter]]"]
created: 2026-10-11
updated: 2026-10-11
---

# Gestão — 02 Cronograma por Fases

## 1. Objetivo
Sequenciar docs → código → validação, alinhado às 4 fases do produto (§30: Mocking → Contract → Validation → Platform).

## 2. Detalhamento
| Fase | Entrega | Marco | Dono | Status |
|------|---------|-------|------|--------|
| 0 | Vault + templates + git | `v0.1.0` em main | Guardião | ✅ feito |
| 1 | 5 PRDs MVP | `v0.2.0` em main (PR) | PRD-Writer | ✅ feito |
| 2 | Arquitetura (6) + Processos (7) | `v0.3.2` em main (PR) | Arquiteto | ✅ feito |
| 3 | 5 SPECs + 4 agentes + biblioteca | `v0.4.0` em main (PR #4) | — | ✅ feito |
| 4 | Gestão (7 docs, este) | `v0.5.0` em `des` → PR | — | ⏳ em curso |
| 5 | Extras (concorrentes, GTM, UX, glossário, ADRs) | `v0.6.0` | Arquiteto | ◻️ próxima |
| 6 | Código 1.1–1.2 (Core + Mock) | pacote com testes verdes | Coder-TS | ◻️ pós-docs |
| 7 | Código 1.3–1.5 (Extension + export) | `v1.0.0` MVP | Coder-TS | ◻️ pós-docs |

Regra: fase de docs só promove com seu "aprovado"; código só começa com Fases 1–5 em `main`.

## 3. Tasks
- [ ] #task ⏫ Aprovar Cronograma (trava sequência docs → código) 🏷️ fase/4

## 4. Consulta Tasks (não editar)
```tasks
not done
path includes 05-Gestao-Projeto
sort by priority
```

## 5. Links
- Métricas: [[05-Metricas-Sucesso]] | Kanban: [[Kanban-Tasks]]
