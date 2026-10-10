---
title: "Integrações OpenAPI e TypeScript"
type: arquitetura
status: revisao
fase: 2
tags: [devmock/arquitetura, devmock/openapi]
related: ["[[PRD-05-Docs-Export]]", "[[01-Core-Model]]"]
created: 2026-10-10
updated: 2026-10-10
---

# Arquitetura — 05 Integrações OpenAPI e TS

## 1. Visão
Export é função pura `Schema[] → {openapiJson, openapiYaml, jsonSchema, typesTs, markdown}`. Nada de rede; validação local com parser.

## 2. Decisões
| Decisão | Alternativas | Motivo |
|---------|--------------|--------|
| Gerar OpenAPI 3.x a partir do Schema (não o inverso no MVP) | OpenAPI como fonte | Form simples do PRD-01 é a fonte; import vem no PRD-06 |
| `enum → union` TS, `BRL → number` | `BRL → string` | Evita o mismatch clássico do §22 (`"1500.00"` vs `1500.50`) |
| Markdown por recurso com tabela de campos | HTML rico | Diff revisável no PR do time |

## 3. Componentes
- `openapiBuilder`: paths CRUD por Schema + `components.schemas`
- `tsBuilder`: `export interface <Model> {...}` com `status: "ACTIVE" | "BLOCKED" | "PENDING"`
- `mdBuilder`: descrição, query params, response 200, tabela de campos
- `staleDetector` (Fase 2, simples): compara hash do Schema com artefatos e avisa "desatualizado"

## 4. Modelo de Dados
```yaml
paths:
  /users:
    get:
      parameters: [{name: page, in: query, schema: {type: number}}]
      responses: { '200': { description: Returns a list of users. } }
```

## 5. Diagrama (Mermaid)
```mermaid
flowchart LR
  S[Schema[]] --> O[openapiBuilder]
  S --> T[tsBuilder]
  S --> M[mdBuilder]
  O --> V{swagger-parser ok?}
  V -->|sim| Out[.devmock/openapi + docs/]
```

## 6. Implicações
- OpenAPI deve validar sem erros e importar no Postman/Swagger UI (aceite PRD-05)
- `types.ts` compila com `tsc --noEmit` sem ajuste

## 7. Links
- PRD: [[PRD-05-Docs-Export]]
- Processo: `BPM-05` (Fase 2)
