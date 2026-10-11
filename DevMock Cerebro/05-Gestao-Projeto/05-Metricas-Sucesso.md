---
title: "Métricas de Sucesso"
type: gestao
status: revisao
fase: 4
tags: [devmock/gestao, devmock/metricas]
related: ["[[00-Project-Charter]]", "[[04-Riscos]]"]
created: 2026-10-11
updated: 2026-10-11
---

# Gestão — 05 Métricas de Sucesso

## 1. Objetivo
Definir como saber se o MVP funcionou — DX mensurável, sem telemetria invasiva (tudo local/opt-in).

## 2. Detalhamento
| Métrica | Meta MVP | Como medir |
|---------|----------|------------|
| Time-to-first-mock (Init → GET 200) | <5 min | Roteiro manual cronometrado |
| % CPF/CNPJ/CEP válidos gerados | 100% | Suite R-01 |
| Reprodutibilidade (mesmo seed) | 100% idêntico | Teste PRD-01 |
| Boot do Mock Server | <1s | Script de bench |
| OpenAPI válido no parser | 100% dos exports | CI futuro / check manual |
| `types.ts` compila limpo | 100% | `tsc --noEmit` |
| Docs: todo Must com aceite verde | 100% | Tasks do vault |

## 3. Tasks
- [ ] #task 🔼 Criar roteiro cronometrado do time-to-first-mock 🏷️ fase/4

## 4. Consulta Tasks (não editar)
```tasks
not done
path includes 05-Gestao-Projeto
sort by priority
```

## 5. Links
- Charter: [[00-Project-Charter]]
