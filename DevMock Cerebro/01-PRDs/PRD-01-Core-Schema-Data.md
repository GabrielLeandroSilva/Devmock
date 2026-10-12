---
title: "PRD-01 Core Schema e Fake Data"
type: prd
status: revisao
fase: 1
tags: [devmock/mvp, devmock/schema]
related: ["[[DevMock-Produto-e-Fluxos]]"]
created: 2026-10-10
updated: 2026-10-10
---

# PRD-01 — Core: Schema e Fake Data

> Deriva de: [[DevMock-Produto-e-Fluxos]] §§ 4, 7, 8, 9, 21, 24. Princípio: **Schema é a fonte única da verdade**.

## 1. Contexto e Problema
O front-end depende do backend para conhecer formato dos dados, testar estados e alinhar tipos. O Core resolve isso com um **Schema** versionável em `.devmock/schemas/*.json` de onde derivam Fake Data, Mock API, docs e tipos.

## 2. Personas
- [x] Front-end (cria Schema do zero)
- [x] Full Stack (versiona `.devmock/` no Git)
- [ ] Backend (consome contrato exportado — ver PRD-05)

## 3. Escopo
### Dentro do escopo (MVP)
- CRUD de Schema: `name, fields[]` com `name, type, required, generator, format, enum, ref`
- Tipos base: `uuid, string, number, boolean, date, datetime, image, enum, ref, array`
- Geradores globais (§8): name, email, phone, date, image, number, boolean, string, uuid
- Geradores BR (§8, diferencial): `br.cpf, br.cnpj, br.cep, br.celular, br.nome, br.endereco, br.pix, br.banco, br.agencia, br.conta, brl`
- Geração determinística com `seed` + `records` (§9)
- Validação do Schema (campos obrigatórios, enum fechado, ref existente)
- Arquivos em `.devmock/schemas/<model>.json` + `config.json` com `seedDefault`

### Fora do escopo (futuro)
- Detecção automática do projeto (§20) — pós-MVP
- Validação da API real contra contrato (§22) — PRD-07
- Geradores com IA / faker remoto

## 4. Requisitos Funcionais
| ID | Requisito | Prioridade | Origem |
|----|-----------|------------|--------|
| RF-01 | Criar/editar/excluir Schema via Extension e via arquivo JSON | Must | §7 |
| RF-02 | Validar Schema e exibir erro por campo (tipo, required, enum, ref quebrada) | Must | §7, §21 |
| RF-03 | Gerar N registros com seed: `generate(schema, records, seed)` determinístico | Must | §9 |
| RF-04 | Biblioteca de geradores BR com formato válido (CPF com dígito, CNPJ numérico + alfanumérico desde 31/07/2026, CEP `00000-000`, BRL `number`) | Must | §8 |
| RF-05 | Suportar `ref` entre Schemas (ex: `Order.userId → User.id`) | Should | §24 |
| RF-06 | Preview dos dados gerados na Extension antes de subir o Mock | Should | §9 |
| RF-07 | `config.json` com `localeDefault: pt-BR`, `seedDefault`, `port: 4010` | Must | §5.2 |

Exemplo de Schema (`user.json`):
```json
{
  "name": "User",
  "fields": [
    { "name": "id", "type": "uuid", "required": true },
    { "name": "name", "type": "string", "generator": "br.nome" },
    { "name": "email", "type": "string", "generator": "email" },
    { "name": "cpf", "type": "string", "generator": "br.cpf" },
    { "name": "status", "type": "enum", "values": ["ACTIVE","BLOCKED","PENDING"] },
    { "name": "balance", "type": "number", "format": "BRL" }
  ]
}
```

## 5. Requisitos Não-Funcionais
- Performance: gerar 1000 registros em <2s local
- DX: erro de Schema aponta arquivo + campo + motivo, sem jargão
- Git-friendly: JSON estável (keys ordenadas), diff legível
- Reprodutibilidade: mesmo `seed` → mesmo output, byte a byte

## 6. Regras de Negócio
- `balance` com `format: BRL` é `number` (nunca string `"1500.00"` — evita o mismatch do §22)
- `enum` é fechado: valor fora da lista é erro de validação, não warning
- Todo Schema tem ao menos 1 campo `required: true` (âncora de identidade)
- `seed` default em `config.json`; override por chamada

## 7. Critérios de Aceite
- [ ] #task ⏫ Schema User do exemplo valida sem erros 🏷️ fase/1
- [ ] #task ⏫ `generate(User, 20, seed=12345)` duas vezes retorna JSON idêntico 🏷️ fase/1
- [ ] #task ⏫ CPF/CNPJ/CEP gerados passam em validador de formato 🏷️ fase/1
- [ ] #task 🔼 Ref quebrada (`Order.userId → X`) exibe erro com arquivo e campo 🏷️ fase/1
- [ ] #task 🔼 1000 registros gerados em <2s 🏷️ fase/1

## 8. Riscos e Dependências
- Geradores BR com formato inválido viram piada pronta — mitigar com suite de validação de formato
- Depende de: `config.json` (PRD-03 Init) para `seedDefault`/`locale`

## 9. Links
- Arquitetura: `02-Arquitetura/01-Core-Model` (Fase 2)
- Processo: `03-Processos/BPM-02-Create-From-Scratch` (Fase 2)
- Prompt: `SPEC-Prompt-Data-Generator-BR` (Fase 3)
