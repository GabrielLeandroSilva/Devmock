---
title: "PRD-05 Documentação e Export do Contrato"
type: prd
status: revisao
fase: 1
tags: [devmock/mvp, devmock/docs]
related: ["[[PRD-01-Core-Schema-Data]]", "[[08-Plano-Release-v1.2.0]]", "[[12-Plano-Release-v1.5.0]]", "[[DevMock-Produto-e-Fluxos]]"]
created: 2026-10-10
updated: 2026-10-22
---

# PRD-05 — Documentação e Export do Contrato

> Deriva de: §§ 15, 16, 17. Fecha o loop Front → Backend: contrato vira Docs + OpenAPI + tipos.

## 1. Contexto e Problema
Sem contrato compartilhável, o backend não sabe o que implementar e o front não tem docs. O Schema deve gerar Markdown, OpenAPI, JSON Schema e tipos TypeScript com 1 clique.

## 2. Personas
- [x] Front-end (gera docs e exporta)
- [x] Backend (recebe OpenAPI/JSON Schema e implementa — §16)

## 3. Escopo
### Dentro (MVP)
- Docs Markdown por recurso em `.devmock/docs/<model>.md` (§15): descrição, query params, response 200, tabela de campos
- Export (checkbox): `OpenAPI JSON, OpenAPI YAML, JSON Schema, TypeScript types, Markdown` (§16) em `.devmock/openapi/generated.yaml` + `.devmock/docs/`
- Tipos TS: `export interface User { id: string; ...; status: "ACTIVE"\|"BLOCKED"\|"PENDING"; balance: number }`
- Regeneração idempotente: re-export com mesmo Schema gera diff mínimo

### Dentro (v1.2.0)
- **HTML docs**: página única com âncoras por recurso, **CSS inline** (offline, sem CDN), gerada ao lado do Markdown em `.devmock/docs/index.html`
- Novo artefato `html` no export → entra no `staleDetector` por artefato

### Dentro (v1.5.0)
- Export reflete **`Schema.routes`**: OpenAPI gera `paths` por método/rota (inclui custom e aninhada); MD/HTML listam todas as rotas
- `response`/`summary` da rota entram no OpenAPI; re-export continua idempotente
- Rotas custom com `:param` viram `parameters` no OpenAPI

### Fora (futuro)
- Import OpenAPI (PRD-06) ✅ · validação real (PRD-07) ✅

## 4. Requisitos Funcionais
| ID | Requisito | Prioridade | Origem |
|----|-----------|------------|--------|
| RF-01 | Gerar Markdown por endpoint/recurso conforme template §15 | Must | §15 |
| RF-02 | Exportar OpenAPI 3.x JSON + YAML válidos (valida em parser) | Must | §16 |
| RF-03 | Exportar JSON Schema por model | Must | §16 |
| RF-04 | Gerar `types.ts` com enums como union e `balance: number` | Must | §16 |
| RF-05 | Comando único `Export Contract` com checklist de artefatos | Must | §16 |
| RF-06 | Gerar `docs/index.html` (página única, âncoras, CSS inline/offline) | Should | v1.2.0 |
| RF-07 | Export refletir `Schema.routes` (OpenAPI por rota, MD/HTML com todas, `response`/`summary`) | Must | v1.5.0 |

## 5. Requisitos Não-Funcionais
- OpenAPI gerado valida sem erros em `swagger-parser`
- `types.ts` compila com `tsc --noEmit` sem ajustes manuais

## 6. Regras de Negócio
- Export nunca edita `schemas/` — é derivado, não fonte
- `balance BRL` exporta como `type: number` + `example: 1520.50` (nunca string)

## 7. Critérios de Aceite
- [ ] #task ⏫ Export gera os 5 artefatos com 1 comando 🏷️ fase/1
- [ ] #task ⏫ OpenAPI valida sem erros e importa no Postman/Swagger UI 🏷️ fase/1
- [ ] #task ⏫ `types.ts` compila limpo e reflete o enum de status 🏷️ fase/1
- [ ] #task 🔼 Re-export sem mudança no Schema gera diff vazio 🏷️ fase/1
- [x] #task 🔼 **[v1.2.0]** HTML docs: página única abre offline (sem rede) e re-export é idempotente 🏷️ fase/codigo
- [ ] #task 🔼 **[v1.5.0]** Export com rota custom (`GET /v1/users`) e ação (`POST /auth/login`) refletidos no OpenAPI/MD/HTML 🏷️ fase/codigo

## 8. Riscos e Dependências
- Depende de PRD-01 (Schema + tipos de campo)
- Drift Schema↔OpenAPI manual — mitigar com aviso "artefato desatualizado" (Fase 2)

## 9. Links
- Processo: `BPM-05-Export-Share-Backend` (Fase 2)
- Arquitetura: `05-Integracoes-OpenAPI-TS` (Fase 2)
