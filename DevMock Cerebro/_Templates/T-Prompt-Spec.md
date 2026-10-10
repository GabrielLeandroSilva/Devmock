---
title: "<% tp.file.title %>"
type: prompt
status: rascunho
fase: 3
tags: [devmock/prompt]
related: []
modelo-sugerido: ""
created: <% tp.file.creation_date("YYYY-MM-DD HH:mm") %>
updated: <% tp.file.creation_date("YYYY-MM-DD HH:mm") %>
---

# Spec de Prompt — <% tp.file.title %>

## 1. Objetivo
<!-- Ex: Gerar Schema a partir de descrição em linguagem natural -->

## 2. Input
- Variáveis: `{{schema_name}}`, `{{fields}}`, `{{locale}}`
- Formato:

## 3. Output esperado
- Formato: JSON / YAML / Markdown
- Exemplo:
```json
{
  "exemplo": true
}
```

## 4. Prompt base (PT-BR)
```text
Você é um especialista em API Contract...
Contexto: DevMock, Schema-first...
Tarefa: ...
Restrições: ...
Retorne apenas JSON válido.
```

## 5. Guardrails
- [ ] Validar JSON Schema antes de aceitar
- [ ] Não inventar campos não pedidos
- [ ] Preservar termos técnicos em inglês

## 6. Testes
| Caso | Input | Output esperado |
|------|-------|-----------------|
| 1 | | |

## 7. Links
- Agente que usa:
- PRD relacionado:
