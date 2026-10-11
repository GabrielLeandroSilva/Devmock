---
title: "MVP Scope MoSCoW"
type: gestao
status: revisao
fase: 4
tags: [devmock/gestao, devmock/mvp]
related: ["[[01-EAP]]", "[[DevMock-Produto-e-Fluxos]]"]
created: 2026-10-11
updated: 2026-10-11
---

# Gestão — 03 MVP Scope (MoSCoW, §29)

## 1. Objetivo
Travar o que entra no `v1.0.0` e o que fica para depois — anti-inchamento.

## 2. Detalhamento
**Must (v1.0.0):** Init Project, Schema, Fake Data + `br.*`, Mock REST `:4010`, config de endpoint básica, Scenarios (Default/Empty/401/500/Slow), export OpenAPI + Markdown + TS, request log básico.
**Should (v1.x):** Forbidden/Rate Limited, error rate %, logs com body, `staleDetector` completo.
**Could (pós):** Import OpenAPI, Detect from project, HTML docs.
**Won't (nesta janela):** Contract Validation, CLI, CI/CD, team features — viram PRD-06/07/08.

## 3. Tasks
- [ ] #task ⏫ Confirmar que nenhum Must está sem PRD correspondente 🏷️ fase/4

## 4. Consulta Tasks (não editar)
```tasks
not done
path includes 01-PRDs
group by filename
```

## 5. Links
- PRDs: `01-PRDs/` | Riscos de escopo: [[04-Riscos]]
