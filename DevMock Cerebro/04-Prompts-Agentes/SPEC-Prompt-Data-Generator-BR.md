---
title: "SPEC Prompt Data Generator BR"
type: prompt
status: revisao
fase: 3
tags: [devmock/prompt, devmock/mvp, devmock/brasil]
related: ["[[PRD-01-Core-Schema-Data]]", "[[01-Core-Model]]"]
modelo-sugerido: "Qualquer (lógica determinística; LLM só descreve casos de teste)"
created: 2026-10-11
updated: 2026-10-11
---

# Spec de Prompt — Data Generator BR (diferencial)

## 1. Objetivo
Especificar o comportamento dos 11 geradores `br.*` para que dados pareçam reais e passem em validadores de formato brasileiros.

## 2. Input
- Variáveis: `{{generator}}` (ex: `br.cpf`), `{{seed}}`, `{{count}}`
- Formato: chamada `generate(schema, records, seed)`

## 3. Output esperado
- Formato: `object[]` determinístico; mesmo `seed` → mesmo output
- Exemplo:
```json
[{ "cpf": "123.456.789-09" }]
```

## 4. Prompt base (PT-BR)
```text
Você é o especificador dos geradores brasileiros do DevMock.
Para o gerador {{generator}}, descreva: formato exato, algoritmo (ex: dígitos verificadores de CPF/CNPJ), exemplos válidos/inválidos e casos de borda com seed {{seed}}.
Restrições: determinístico (seeded RNG, nunca Math.random); CPF com DV correto; CNPJ nos dois formatos coexistentes desde 31/07/2026 (numérico majoritário + alfanumérico `[A-Z0-9]{12}[0-9]{2}`, DV mod 11 com letras em ASCII-48, IN RFB 2.229/2024); CEP no formato 00000-000; celular (00) 90000-0000; BRL como number com 2 casas.
Retorne tabela: gerador | formato | exemplo válido | armadilha comum.
```

## 5. Guardrails
- [ ] Todo exemplo de CPF/CNPJ/CEP do vault deve passar em validador real (CNPJ: aceitar `[A-Z0-9]{12}[0-9]{2}`)
- [ ] `brl` sempre `number` (regra anti-mismatch §22)
- [ ] Nomes/endereços plausíveis em PT-BR, sem dados de pessoas reais

## 6. Testes
| Caso | Input | Output esperado |
|------|-------|-----------------|
| 1 | `br.cpf` seed 12345, 100 registros | 100 CPFs com DV válido, repetível |
| 2 | `brl` | `1520.50` (number), nunca `"1520.50"` |
| 3 | Mesmo seed 2x | JSON idêntico byte a byte |

## 7. Links
- Agente que usa: [[Agente-Coder-TS]]
- PRD relacionado: [[PRD-01-Core-Schema-Data]]
- Biblioteca: `Biblioteca-Prompts/Prompt-Gerar-Schema-BR.md`
