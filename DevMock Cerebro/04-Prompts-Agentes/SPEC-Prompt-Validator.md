---
title: "SPEC Prompt Validator"
type: prompt
status: revisao
fase: 3
tags: [devmock/prompt]
related: ["[[BPM-06-Validate-Real-API]]", "[[PRD-07-Contract-Validation]]"]
created: 2026-10-11
updated: 2026-10-13
---

# Spec de Prompt — Validator

> Implementado na v1.5.0 (`packages/core/src/validate/`). Regras validadas: extra = Warning, required/tipo/enum = Breaking, `balance` string = Breaking clássico.

## 1. Objetivo
Comparar respostas da API real contra o contrato e classificar `Compatible / Warning / Breaking Change` (stub — detalhar com PRD-07).

## 2. Input
- Variáveis: `{{schema_json}}`, `{{real_response}}`, `{{endpoint}}`
- Formato: JSON ambos

## 3. Output esperado
- Relatório por campo: `esperado x recebido x severidade`, ex: `balance number x string → Breaking`

## 4. Prompt base (PT-BR)
```text
Você é o validador de contrato do DevMock. Compare {{real_response}} de {{endpoint}} com {{schema_json}}.
Classifique por campo: Compatible, Warning (campo extra, formato tolerável) ou Breaking Change (tipo divergente, required ausente, enum fora da lista).
Seja estrito com tipos e enums; tolerante com campos extras (Warning, não Breaking).
```

## 5. Guardrails
- [ ] Campo extra nunca é Breaking (é Warning)
- [ ] `balance` string vs number é sempre Breaking (caso clássico §22)

## 6. Links
- Processo: [[BPM-06-Validate-Real-API]]
