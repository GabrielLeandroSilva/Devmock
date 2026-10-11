---
title: "SPEC Prompt Schema Builder"
type: prompt
status: revisao
fase: 3
tags: [devmock/prompt, devmock/mvp]
related: ["[[PRD-01-Core-Schema-Data]]", "[[01-Core-Model]]"]
modelo-sugerido: "Claude Sonnet ou similar (bom em JSON estruturado)"
created: 2026-10-11
updated: 2026-10-11
---

# Spec de Prompt — Schema Builder

## 1. Objetivo
Gerar `schemas/<model>.json` válido a partir de descrição em linguagem natural (ex: "usuário com nome brasileiro, email, CPF e status").

## 2. Input
- Variáveis: `{{model_name}}`, `{{description}}`, `{{locale}}` (default `pt-BR`)
- Formato: texto livre PT-BR

## 3. Output esperado
- Formato: JSON do Schema (ver [[01-Core-Model]] §4) + resumo em 3 bullets
- Exemplo:
```json
{
  "name": "User",
  "fields": [
    { "name": "id", "type": "uuid", "required": true },
    { "name": "name", "type": "string", "generator": "br.nome" },
    { "name": "status", "type": "enum", "values": ["ACTIVE", "BLOCKED", "PENDING"] }
  ]
}
```

## 4. Prompt base (PT-BR)
```text
Você é um especialista em API Contract do projeto DevMock (princípio Schema First).
Tarefa: converta a descrição abaixo em um Schema DevMock JSON.
Model: {{model_name}} | Locale: {{locale}} | Descrição: {{description}}
Regras:
- Tipos permitidos: uuid, string, number, boolean, date, datetime, image, enum, ref, array.
- Todo Schema tem ao menos 1 campo required (âncora de identidade).
- Para dados brasileiros use geradores br.* (br.nome, br.cpf, br.cnpj, br.cep, br.celular, brl).
- Enum deve ser fechado e em UPPER_SNAKE_CASE.
- Balance/valores monetários: type number + format BRL (nunca string).
- Retorne o JSON válido primeiro e depois um resumo de 3 bullets das decisões.
```

## 5. Guardrails
- [ ] Validar o JSON contra o validador do Core antes de aceitar (PRD-01 RF-02)
- [ ] Não inventar campos não pedidos; dúvida → campo opcional + nota no resumo
- [ ] Preservar termos técnicos em inglês (`Schema`, `required`, `seed`)

## 6. Testes
| Caso | Input | Output esperado |
|------|-------|-----------------|
| 1 | "produto com nome, preço em reais e estoque" | `Product` com `price: number/BRL`, `stock: number` |
| 2 | "pedido ligado a usuário" | `Order` com `userId: ref User` |
| 3 | Descrição vazia | Pede model + ao menos 1 campo (não gera) |

## 7. Links
- Agente que usa: [[Agente-Coder-TS]]
- PRD relacionado: [[PRD-01-Core-Schema-Data]]
