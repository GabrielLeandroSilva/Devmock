---
title: "SPEC Prompt Doc Generator"
type: prompt
status: revisao
fase: 3
tags: [devmock/prompt, devmock/mvp]
related: ["[[PRD-05-Docs-Export]]", "[[05-Integracoes-OpenAPI-TS]]"]
modelo-sugerido: "Claude Sonnet ou similar"
created: 2026-10-11
updated: 2026-10-11
---

# Spec de Prompt — Doc Generator

## 1. Objetivo
Gerar `docs/<model>.md` e os 5 artefatos de export (OpenAPI JSON/YAML, JSON Schema, `types.ts`, Markdown) a partir do Schema, no template do §15.

## 2. Input
- Variáveis: `{{schema_json}}`, `{{artifacts}}` (checklist de export)
- Formato: Schema JSON válido

## 3. Output esperado
- Formato: Markdown com descrição, query params, response 200 e tabela de campos; `types.ts` com unions
- Exemplo:
```markdown
## GET /users
Returns a list of users.
| Campo | Tipo | Obrigatório |
| name | string | não |
| status | ACTIVE \| BLOCKED \| PENDING | não |
```

## 4. Prompt base (PT-BR)
```text
Você é o gerador de documentação do DevMock.
Input: {{schema_json}} | Artefatos: {{artifacts}}
Gere docs em PT-BR (termos técnicos em inglês) seguindo o template: descrição, query params (page/limit), response 200, tabela de campos.
Para types.ts: enum vira union literal, BRL vira number, required vira campo não-opcional.
Nunca altere o Schema — ele é a fonte; docs são derivadas. Se houver enum novo, apenas reflita.
```

## 5. Guardrails
- [ ] OpenAPI gerado deve validar em `swagger-parser` sem erros
- [ ] `types.ts` deve compilar com `tsc --noEmit`
- [ ] Re-export sem mudança no Schema → diff vazio

## 6. Testes
| Caso | Input | Output esperado |
|------|-------|-----------------|
| 1 | Schema User do PRD-01 | `user.md` + 5 artefatos, OpenAPI válido |
| 2 | Re-export idêntico | Diff vazio |
| 3 | Schema com `ref` | Tipo importado, não duplicado |

## 7. Links
- Agente que usa: [[Agente-Coder-TS]]
- PRD relacionado: [[PRD-05-Docs-Export]]
