---
title: "SPEC Prompt OpenAPI Importer"
type: prompt
status: revisao
fase: 3
tags: [devmock/prompt]
related: ["[[BPM-03-Import-OpenAPI]]", "[[PRD-06-Import-OpenAPI]]"]
created: 2026-10-11
updated: 2026-10-12
---

# Spec de Prompt — OpenAPI Importer

> Implementado na v1.3.0 (`packages/core/src/import/`). Regras validadas: âncora no primeiro campo com aviso, `format` vira tipo quando existe, lacunas em `warnings[]`.

## 1. Objetivo
Converter `openapi.yaml` do backend em Schemas + endpoints + cenários Default (stub — detalhar com PRD-06).

## 2. Input
- Variáveis: `{{openapi_yaml}}`
- Formato: OpenAPI 3.x

## 3. Output esperado
- `schemas/*.json` + rotas + cenário Default por endpoint; relatório de campos sem mapeamento direto

## 4. Prompt base (PT-BR)
```text
Você é o importador OpenAPI do DevMock. Converta {{openapi_yaml}} em Schemas DevMock.
Mapeie components.schemas para fields (tipo, required, enum); paths para endpoints CRUD.
O que não mapear 1:1, liste em "revisão humana necessária" em vez de inventar.
```

## 5. Guardrails
- [ ] Nunca inventar campo; listar lacunas para revisão humana
- [ ] Gerar cenário Default por endpoint importado

## 6. Links
- Processo: [[BPM-03-Import-OpenAPI]]
