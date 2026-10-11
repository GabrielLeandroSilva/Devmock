---
title: "Riscos"
type: gestao
status: revisao
fase: 4
tags: [devmock/gestao, devmock/riscos]
related: ["[[01-EAP]]", "[[03-MVP-Scope]]"]
created: 2026-10-11
updated: 2026-10-11
---

# Gestão — 04 Riscos

## 1. Objetivo
Mapear riscos com probabilidade, impacto e mitigação — revisar a cada fase.

## 2. Detalhamento
| # | Risco | P | I | Mitigação | Dono |
|---|-------|---|---|-----------|------|
| R-01 | Geradores BR com formato inválido (credibilidade) | M | A | Suite de validação com DV real (aceite PRD-01) | Coder-TS |
| R-02 | Escopo inchando para Validation/CLI no MVP | A | A | MoSCoW travado em [[03-MVP-Scope]]; Arquiteto barra | Arquiteto |
| R-03 | Drift Schema ↔ OpenAPI editado na mão | M | M | `staleDetector` + docs como saída gerada | Coder-TS |
| R-04 | Porta 4010 ocupada / processo zumbi | M | B | Detecção + mensagem acionável (PRD-02 RF-07) | Coder-TS |
| R-05 | Extension lenta com muitos Schemas | B | M | Tree nativa + watcher com debounce (aceite PRD-03) | Coder-TS |
| R-06 | Perda do vault (docs) | B | A | Git `des`+`main` + tags por fase (Guardião) | Guardião |

Legenda: P/I = Alta/Média/Baixa.

## 3. Tasks
- [ ] #task 🔼 Revisar R-01 antes do código 1.1 (suite de geradores) 🏷️ fase/4

## 4. Consulta Tasks (não editar)
```tasks
not done
path includes 05-Gestao-Projeto
sort by priority
```

## 5. Links
- Métricas que detectam R-01/R-04: [[05-Metricas-Sucesso]]
