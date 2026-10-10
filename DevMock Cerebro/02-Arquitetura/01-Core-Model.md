---
title: "Core Model — Schema, Validação e Geração"
type: arquitetura
status: revisao
fase: 2
tags: [devmock/arquitetura, devmock/schema]
related: ["[[PRD-01-Core-Schema-Data]]", "[[00-Visao-Arquitetura]]"]
created: 2026-10-10
updated: 2026-10-10
---

# Arquitetura — 01 Core Model

## 1. Visão
Módulo `schemaStore + validator + dataGenerator`: carrega `schemas/*.json`, valida e gera dados determinísticos (`seed`). Sem I/O de editor; recebe paths e retorna objetos/strings.

## 2. Decisões
| Decisão | Alternativas | Motivo |
|---------|--------------|--------|
| Schema como JSON Schema-like próprio (não OpenAPI direto) | Adotar OpenAPI como formato nativo | Form mais simples para o form da Extension; OpenAPI é artefato de export (PRD-05) |
| RNG com seed (`mulberry32` ou similar) | `Math.random` | Determinismo byte a byte exigido pelo PRD-01 |
| Geradores BR como registry `br.*` plugável | Hardcode no generator | Diferencial evoluível sem tocar o Core |

## 3. Componentes
- `schemaStore.load(dir) → Schema[]`: lê e ordena keys para diff estável
- `validator.validate(schema) → Diagnostic[]`: `{field, message, severity}`; ex: enum fora da lista, `ref` quebrada
- `dataGenerator.generate(schema, records, seed) → object[]`: aplica `generator` por campo
- `brRegistry`: `br.cpf (dígito verificador), br.cnpj, br.cep (00000-000), br.celular, br.nome, br.endereco, br.pix, br.banco, br.agencia, br.conta, brl (number, 2 casas)`

## 4. Modelo de Dados
```json
{
  "name": "User",
  "fields": [
    { "name": "id", "type": "uuid", "required": true },
    { "name": "status", "type": "enum", "values": ["ACTIVE","BLOCKED","PENDING"] },
    { "name": "balance", "type": "number", "format": "BRL" },
    { "name": "orders", "type": "array", "ref": "Order" }
  ]
}
```
Tipos: `uuid|string|number|boolean|date|datetime|image|enum|ref|array`. `required` default `false`.

## 5. Diagrama (Mermaid)
```mermaid
flowchart LR
  JSON[schemas/*.json] --> Store[schemaStore]
  Store --> Val[validator]
  Val -->|ok| Gen[dataGenerator + seed]
  Val -->|erro| Diag[Diagnostic campo + motivo]
  Gen --> Out[object[] determinístico]
```

## 6. Implicações
- Git-friendly: keys ordenadas na escrita; `generate` nunca escreve arquivo (só retorna)
- Performance: meta 1000 registros <2s (PRD-01); geradores BR O(1) por campo
- Segurança: sem rede; `image` gera placeholder local (não baixa nada)

## 7. Links
- PRD: [[PRD-01-Core-Schema-Data]]
- Processo: `BPM-02` (Fase 2)
- Prompt: `SPEC-Prompt-Data-Generator-BR` (Fase 3)
