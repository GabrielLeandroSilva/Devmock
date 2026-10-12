---
title: "Manual de Teste v1.0.0"
type: gestao
status: revisao
fase: 4
tags: [devmock/qa, devmock/mvp]
related: ["[[05-Metricas-Sucesso]]", "[[01-EAP]]", "[[PRD-01-Core-Schema-Data]]", "[[PRD-02-Mock-Server]]", "[[PRD-03-VSCode-Extension]]", "[[PRD-04-Scenarios]]", "[[PRD-05-Docs-Export]]"]
created: 2026-10-12
updated: 2026-10-12
---

# Gestão — Manual de Teste passo a passo (portão da v1.0.0)

> Execute na ordem. Marque cada caixa. Qualquer falha vira linha na tabela de Resultado + volta para o Coder (não promove). Meta: time-to-first-mock <5min (§1–§4 cronometrados).

## 0. Preparação
- [ ] #task 🔼 Build limpo: `npm run build --workspaces` sem erro 🏷️ fase/codigo
- [ ] #task 🔼 Testes verdes: `npx --prefix packages/core vitest run --root packages/core` → 37/37 🏷️ fase/codigo
- [ ] #task 🔼 Abrir `apps/extension` no VS Code e apertar **F5** (host de desenvolvimento) 🏷️ fase/codigo

## 1. Init (PRD-03)
- [ ] #task Sem `.devmock/`, a Tree mostra CTA único; comando `DevMock: Initialize Project` cria `.devmock/{config.json,schemas/,scenarios/,docs/,openapi/}` 🏷️ fase/codigo
- [ ] #task `config.json` contém `port: 4010`, `seedDefault`, `localeDefault: pt-BR` 🏷️ fase/codigo

## 2. Schema via formulário (PRD-01 + PRD-03)
- [ ] #task `DevMock: New Schema…` → model `User` + campos (id uuid required, name br.nome, cpf br.cpf, status enum ACTIVE/BLOCKED/PENDING, balance number BRL) → salva `schemas/user.json` 🏷️ fase/codigo
- [ ] #task Schema inválido (enum sem valores) mostra erro com campo + motivo e **não** salva 🏷️ fase/codigo

## 3. Fake Data (PRD-01)
- [ ] #task `DevMock: Generate Fake Data…` → preview JSON com 20 users, CPF formatado, `balance` numérico 🏷️ fase/codigo

## 4. Mock Server (PRD-02) — cronometrar do §1 até o primeiro 200
- [ ] #task `DevMock: Start Mock Server` → notificação `🟢 http://localhost:4010` e Tree mostra servidor verde 🏷️ fase/codigo
- [ ] #task `GET /users?page=1&limit=5` → 200 com `{data[5], total, page: 1, limit: 5}` 🏷️ fase/codigo
- [ ] #task `GET /users/:id` existente → 200; inexistente → 404 `{error: NOT_FOUND}` 🏷️ fase/codigo
- [ ] #task `POST /users` → 201 e o criado aparece no `GET` seguinte 🏷️ fase/codigo
- [ ] #task `DELETE /users/:id` → 204 e some do `GET`; repetir → 404 🏷️ fase/codigo

## 5. Cenários sem restart (PRD-04)
- [ ] #task `DevMock: Switch Scenario…` → `GET /users` → Empty → resposta imediata `{"data":[],"total":0}` **sem** stop/start 🏷️ fase/codigo
- [ ] #task Voltar para Default → dados de volta 🏷️ fase/codigo

## 6. Export (PRD-05)
- [ ] #task `DevMock: Export Contract…` → Tudo → gera `openapi/generated.json`, `generated.yaml`, `schemas.json`, `docs/types.ts`, `docs/user.md` 🏷️ fase/codigo
- [ ] #task `types.ts` compila: `tsc --noEmit --strict docs/types.ts` sem erro 🏷️ fase/codigo
- [ ] #task Re-export sem mudar Schema → diff vazio no git 🏷️ fase/codigo

## 7. Request Log (PRD-02)
- [ ] #task `DevMock: Show Request Log` → OutputChannel lista método, rota, status, ms e cenário 🏷️ fase/codigo
- [ ] #task `DevMock: Stop Mock Server` → para sem processo zumbi (porta 4010 libera) 🏷️ fase/codigo

## 8. Resultado
| Data | Passo | ✅/❌ | Observação |
|------|-------|------|------------|
| | 0–7 | | |

- Todos ✅ → dizer **"promove v1.0.0"** (PR #10 + tag `v1.0.0` em `main`).
- Qualquer ❌ → descrever aqui e devolver ao Coder; Auditor re-roda o ritual.
