---
title: "Prompt Gerar Schema BR"
type: prompt
status: revisao
fase: 3
tags: [devmock/prompt, devmock/biblioteca]
related: ["[[SPEC-Prompt-Schema-Builder]]", "[[SPEC-Prompt-Data-Generator-BR]]"]
created: 2026-10-11
updated: 2026-10-11
---

# Biblioteca — Prompt Gerar Schema BR (pronto para uso)

> Copie e cole em qualquer LLM. Derivado de [[SPEC-Prompt-Schema-Builder]] + [[SPEC-Prompt-Data-Generator-BR]].

```text
Você é um especialista em API Contract do projeto DevMock (Schema First).
Gere o Schema DevMock JSON para o modelo abaixo.
MODELO: {{MODEL}} | LOCALE: pt-BR | DESCRIÇÃO: {{DESCRICAO}}
Regras: tipos uuid/string/number/boolean/date/datetime/image/enum/ref/array; ao menos 1 required; dados BR com br.* (br.nome, br.cpf, br.cnpj, br.cep, br.celular, brl);
enum UPPER_SNAKE_CASE fechado; monetário = number + format BRL (nunca string); ref para relacionamentos.
Retorne: 1) JSON válido 2) 3 bullets de decisões 3) comando de geração sugerido: generate({{MODEL}}, 20, seed=12345).
```
