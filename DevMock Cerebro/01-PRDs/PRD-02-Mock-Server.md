---
title: "PRD-02 Mock Server REST"
type: prd
status: revisao
fase: 1
tags: [devmock/mvp, devmock/mock]
related: ["[[PRD-01-Core-Schema-Data]]", "[[12-Plano-Release-v1.5.0]]", "[[DevMock-Produto-e-Fluxos]]"]
created: 2026-10-10
updated: 2026-10-22
---

# PRD-02 — Mock Server REST

> Deriva de: §§ 10, 11, 13, 14. Porta default `http://localhost:4010`.

## 1. Contexto e Problema
Com o Schema pronto, o front precisa de uma API local imediata (`GET/POST/PUT/PATCH/DELETE`) sem esperar o backend, com delay, paginação e log para depurar a camada de `services/api`.

## 2. Personas
- [x] Front-end (aponta `baseURL` para `localhost:4010`)
- [x] Full Stack (sobe/derruba o server pela Extension)

## 3. Escopo
### Dentro (MVP)
- Auto-geração de rotas por Schema: `GET /users, GET /users/:id, POST /users, PUT/PATCH /users/:id, DELETE /users/:id`
- Config por endpoint: `status, delayMs, records, pagination{enabled, page, limit}, headers` (§11)
- `GET /users` com paginação `?page&limit` → `{ data[], total, page, limit }`
- `POST` retorna `201` + objeto criado; `DELETE` retorna `204`
- Request log na Extension: `método, rota, status, latência` (§14)
- Start/stop + indicador `🟢 localhost:4010` + troca de porta em `config.json`
- Persistência em memória por sessão (POST cria, DELETE remove até restart)

### Dentro (v1.5.0)
- **Mapa de rotas por Schema** (`routes`): `{ method, path, kind, response?, summary? }[]`; ausente = CRUD padrão (6 rotas)
- **Rota customizada**: path base livre (`/v1/users`), aninhado e/ou ação fora do CRUD (`POST /auth/login`, `POST /users/:id/activate`)
- **Router** por método + pattern, com `:param`; estático vence param; `method+path` único
- **Resposta custom** (`status`/`body`) na rota; cenário/endpoint config têm precedência
- **Semântica**: PUT substitui (mantém `id`); PATCH faz merge; JSON inválido → 400; `DELETE` de coleção → 405

### Fora (futuro)
- Latência avançada, error rate, rate limit (§11) — v1.1
- Request logs avançados com body/inspect — pós-MVP
- GraphQL / WebSocket

## 4. Requisitos Funcionais
| ID | Requisito | Prioridade | Origem |
|----|-----------|------------|--------|
| RF-01 | Gerar CRUD REST automaticamente a partir de cada Schema | Must | §10 |
| RF-02 | Respeitar `delayMs` por endpoint (default 300ms) | Must | §11 |
| RF-03 | Paginação `page/limit` com envelope `{data,total,page,limit}` | Must | §11 |
| RF-04 | Exibir request log (método, rota, status, ms) | Must | §14 |
| RF-05 | Start/stop pelo painel + status visível | Must | §13 |
| RF-06 | `GET /:id` inexistente → `404` com body `{error, message}` | Should | §12 |
| RF-07 | Liberar porta em uso com mensagem acionável (qual PID, como trocar) | Should | §13 |
| RF-08 | `Schema.routes` opcional; ausente = CRUD padrão; presente = substitui o conjunto | Must | v1.5.0 |
| RF-09 | Router por método+path com `:param`; estático > param; colisão rejeitada | Must | v1.5.0 |
| RF-10 | PUT substitui, PATCH faz merge; JSON inválido → 400; `DELETE` coleção → 405 | Must | v1.5.0 |
| RF-11 | Rota `custom` com `response {status, body}`; precedência request > endpoint > rota > default | Must | v1.5.0 |
| RF-12 | Rotas aninhadas e ações fora do CRUD (`/v1/users`, `/auth/login`) | Must | v1.5.0 |

## 5. Requisitos Não-Funcionais
- Boot do server <1s; resposta p95 <50ms + `delayMs` configurado
- Um server por workspace; dois projetos = portas distintas
- Sem dependência de rede (100% local)

## 6. Regras de Negócio
- Schema inválido → rota nem é registrada; erro aponta o PRD-01
- `records` default 20; `delayMs` default 300
- Cenário ativo (PRD-04) tem precedência sobre config default do endpoint
- **v1.5.0:** `routes` presente **substitui** o CRUD padrão (não soma); chave de cenário/config/log = `"METHOD /pattern"`

## 7. Critérios de Aceite
- [ ] #task ⏫ `GET /users` retorna 20 users paginados com envelope correto 🏷️ fase/1
- [ ] #task ⏫ `GET /users/:id` existente 200, inexistente 404 com body padrão 🏷️ fase/1
- [ ] #task ⏫ `POST /users` retorna 201 e o objeto aparece no `GET` seguinte 🏷️ fase/1
- [ ] #task ⏫ Delay de 300ms respeitado (±100ms) e log exibe método/roto/status/ms 🏷️ fase/1
- [ ] #task 🔼 Trocar porta em `config.json` e restart funciona sem resíduo 🏷️ fase/1
- [x] #task 🔼 **[v1.5.0]** `GET /v1/users` e `GET /v1/users/:id` resolvem o mesmo Schema (rota aninhada) 🏷️ fase/codigo
- [x] #task 🔼 **[v1.5.0]** Ação custom (`POST /auth/login`) responde o `response` da rota (ou cenário) 🏷️ fase/codigo
- [x] #task 🔼 **[v1.5.0]** PUT substitui, PATCH faz merge; JSON inválido → 400; `DELETE` coleção → 405 🏷️ fase/codigo

## 8. Riscos e Dependências
- Depende de PRD-01 (Schema válido + Fake Data determinística)
- Porta 4010 ocupada — mitigar com detecção + sugestão de porta livre

## 9. Links
- Arquitetura: `02-Arquitetura/02-Mock-Server-Design` (Fase 2)
- Processo: `03-Processos/BPM-04-Generate-Mock-Develop` (Fase 2)
- Cenários: [[PRD-04-Scenarios]]
