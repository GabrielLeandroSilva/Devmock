---
title: "PRD-04 Cenários de Resposta"
type: prd
status: revisao
fase: 1
tags: [devmock/mvp, devmock/scenarios]
related: ["[[PRD-02-Mock-Server]]", "[[10-Plano-Release-v1.3.0]]", "[[DevMock-Produto-e-Fluxos]]"]
created: 2026-10-10
updated: 2026-10-20
---

# PRD-04 — Cenários de Resposta

> Deriva de: §12. Funcionalidade-chave para testar loading, empty, error, timeout, retry.

## 1. Contexto e Problema
Front precisa testar todos os estados da UI sem o backend quebrar de verdade: `Default, Empty, Unauthorized(401), Forbidden(403), Server Error(500), Slow Network, Rate Limited(429)`.

## 2. Personas
- [x] Front-end (testa Empty/Error/Loading antes da API existir)

## 3. Escopo
### Dentro (MVP)
- Cenários default por endpoint: `Default(200), Empty(200 com data:[]), Unauthorized(401), Server Error(500)` em `.devmock/scenarios/<model>-<cenario>.json`
- Switch de cenário pela Tree (radio) com efeito imediato, sem restart
- `Slow Network`: só `delayMs: 5000` sobre o Default
- Cenário ativo visível (`✓ Default`) + 1 ativo por endpoint por vez

### Dentro (v1.3.0)
- **Cenário por requisição:** `GET /users?scenario=Empty` e header `X-Mock-Scenario: Forbidden`
- Precedência: **request (query/header) > cenário ativo > Default**
- Cenário desconhecido **não quebra**: cai no ativo (ou Default) e registra no log
- CORS libera o header `x-mock-scenario`

### Fora (futuro)
- `Forbidden`, `Rate Limited` e `errorRate` ✅ (v1.1.0) · cenários condicionais complexos (ex.: body matching) — futuro

## 4. Requisitos Funcionais
| ID | Requisito | Prioridade | Origem |
|----|-----------|------------|--------|
| RF-01 | CRUD de cenário por endpoint (status, body, delay, headers) | Must | §12 |
| RF-02 | Troca de cenário aplica em <500ms sem restart | Must | §12 |
| RF-03 | `Empty` retorna `{data:[], total:0}` com 200 | Must | §12 |
| RF-04 | `401/500` retornam body padrão `{error, message}` | Must | §12 |
| RF-05 | Cenários versionáveis em arquivos separados | Must | §24 |
| RF-06 | Cenário por **query** (`?scenario=…`) e por **header** (`X-Mock-Scenario`) na mesma requisição | Must | v1.3.0 |
| RF-07 | Precedência request > cenário ativo > Default; desconhecido não quebra | Must | v1.3.0 |
| RF-08 | CORS permite o header `x-mock-scenario` | Must | v1.3.0 |

Exemplo (`user-empty.json`): `{ "endpoint": "GET /users", "scenario": "Empty", "status": 200, "body": { "data": [], "total": 0 } }`

## 5. Requisitos Não-Funcionais
- Troca de cenário nunca derruba o server
- Arquivo de cenário <5KB e legível no diff

## 6. Regras de Negócio
- Cenário ativo tem precedência sobre config default (PRD-02 RF)
- Apagar cenário ativo → volta para `Default` automaticamente
- **Clique na Tree (v1.4.0):** aplicar um cenário a um ou mais Schemas grava `activeScenarios["GET /<plural>"]` de cada um (rota de coleção exibida no nó Schema); POST/`:id` seguem via `Switch Scenario…`

## 7. Critérios de Aceite
- [ ] #task ⏫ Alternar Default→Empty→401→500 muda a resposta sem restart 🏷️ fase/1
- [ ] #task ⏫ `Empty` retorna envelope vazio com 200 🏷️ fase/1
- [ ] #task 🔼 `Slow Network` atrasa ~5s e o front consegue testar loading/timeout 🏷️ fase/1
- [x] #task ⏫ **[v1.3.0]** `?scenario=Empty` retorna envelope vazio e `X-Mock-Scenario: 403` retorna 403 🏷️ fase/codigo
- [x] #task 🔼 **[v1.3.0]** Precedência request > ativo > Default; cenário desconhecido cai no ativo sem quebrar 🏷️ fase/codigo

## 8. Riscos e Dependências
- Depende de PRD-02 (precedência + log mostra cenário ativo)

## 9. Links
- Arquitetura: `02-Mock-Server-Design` (seção cenários, Fase 2)
