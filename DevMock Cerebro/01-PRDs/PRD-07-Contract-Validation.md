---
title: "PRD-07 Contract Validation"
type: prd
status: revisao
fase: 3
tags: [devmock/pos-mvp, devmock/validation]
related: ["[[PRD-01-Core-Schema-Data]]", "[[BPM-06-Validate-Real-API]]", "[[SPEC-Prompt-Validator]]"]
created: 2026-10-13
updated: 2026-10-13
---

# PRD-07 — Contract Validation (EAP 2.2)

> Deriva de: [[DevMock-Produto-e-Fluxos]] §§ 22–23. Fecha o loop: o contrato que gerou o mock agora cobra a API real.

## 1. Contexto e Problema
Com o backend pronto, o front precisa saber se a API real cumpre o contrato — sem isso, a troca mock→real quebra em produção (caso clássico: `balance` string vs number, §22).

## 2. Personas
- [x] Front-end (valida antes de trocar a `baseURL`)
- [x] Backend (recebe a lista exata de divergências)

## 3. Escopo
### Dentro (v1.5.0)
- `compare(schema, valor)` por campo: `Compatible / Warning / Breaking Change`
- `validateLive(schemas, baseUrl)`: GET em cada base path + primeiros N itens, relatório por endpoint
- CLI `devmock validate <baseUrl> [dir]` (exit 1 se houver breaking) + `DevMock: Validate Real API…` (input URL + OutputChannel)
- Severidades: required ausente/tipo divergente/enum fora = Breaking; campo extra = Warning (nunca Breaking)

### Fora (futuro)
- POST/PUT com body de teste, auth (headers custom), CI gate com threshold, diff de OpenAPI

## 4. Requisitos Funcionais
| ID | Requisito | Prioridade | Origem |
|----|-----------|------------|--------|
| RF-01 | Comparar objeto contra Schema campo a campo com path (`endereco.cep`) | Must | §22 |
| RF-02 | `balance` string vs number = Breaking (caso clássico) | Must | §22 |
| RF-03 | `validateLive` busca `GET <base>` e valida até 5 itens por endpoint | Must | §23 |
| RF-04 | Relatório agregado: `X compatible, Y warnings, Z breaking` por endpoint | Must | §23 |
| RF-05 | Falha de rede/timeout vira finding `error`, não crash | Must | — |
| RF-06 | CLI exit 1 se qualquer Breaking; 0 caso contrário | Should | — |

## 5. Requisitos Não-Funcionais
- Timeout de 10s por request; valida no máximo 5 itens por endpoint (tempo limitado)
- Leitura apenas: nunca POST/PUT/DELETE na API real

## 6. Regras de Negócio
- Campo extra na resposta = Warning, nunca Breaking (backend pode evoluir)
- Campo required ausente = Breaking; opcional ausente = Compatible
- `enum` fora da lista = Breaking; `BRL` como string = Breaking

## 7. Critérios de Aceite
- [ ] #task ⏫ Fixture igual → zero findings 🏷️ fase/codigo
- [ ] #task ⏫ `balance: "1500.00"` vs number → Breaking; `status: SUSPENDED` → Breaking 🏷️ fase/codigo
- [ ] #task ⏫ Campo extra → Warning; required ausente → Breaking 🏷️ fase/codigo
- [ ] #task 🔼 CLI contra mock local com cenário quebrado retorna exit 1 🏷️ fase/codigo

## 8. Riscos e Dependências
- Depende de PRD-01 (tipos) e do fetch nativo (sem nova dependência)
- Falso-positivo em `date` (string qualquer passa como date) — documentado como limitação

## 9. Links
- Processo: [[BPM-06-Validate-Real-API]] | SPEC: [[SPEC-Prompt-Validator]] | Agente: [[Agente-Coder-TS]]
