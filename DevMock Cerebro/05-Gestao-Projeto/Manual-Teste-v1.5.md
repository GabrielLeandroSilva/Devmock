---
title: "Manual de Teste v1.5.0"
type: gestao
status: revisao
fase: codigo
tags: [devmock/qa, devmock/release]
related: ["[[12-Plano-Release-v1.5.0]]", "[[07-Estrategia-Testes]]", "[[Manual-Teste-v1.4]]", "[[PRD-02-Mock-Server]]", "[[PRD-03-VSCode-Extension]]", "[[PRD-05-Docs-Export]]", "[[PRD-07-Contract-Validation]]"]
created: 2026-10-22
updated: 2026-10-22
---

# Gestão — Manual de Teste v1.5.0

> Foco **rotas completas / mouse-first**: mapa de rotas por Schema (custom/includes), semântica POST/PUT/PATCH/DELETE, Tree/Studio por rota e propagação em export/validate. **[auto]** = suíte; **[UI]** = conferir no host (F5). Regressão herda [[Manual-Teste-v1.4]].

## 0. Preparação
- [x] #task 🔼 Build limpo: `npm run build` 🏷️ fase/codigo ✅ 2026-10-22
- [x] #task 🔼 `tsc --noEmit` core/cli/extension 🏷️ fase/codigo ✅ 2026-10-22
- [x] #task 🔼 Suítes: core **193** · cli **20** · host **62** 🏷️ fase/codigo ✅ 2026-10-22
- [ ] #task 🔼 F5 no host de desenvolvimento (**VS Code ≥ 1.101**) 🏷️ fase/codigo

## M1 — Schema de rotas
- [x] #task ⏫ **[auto]** `Schema.routes` (method/path/kind/response/summary); ausente = CRUD padrão; defaults e `routeKey` canônico 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** Validação: path vazio, `{param}` no path, kind inválido, params, duplicatas e `validateProject` 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** Schema com rotas custom mostra `GET /v1/users` na Tree; Schema sem `routes` continua `/users` 🏷️ fase/codigo

## M2/M3 — Router e semântica
- [x] #task ⏫ **[auto]** Router por método+pattern; `:param`; estático vence param; alias singular; aninhada `v1`/`pages` 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** PUT substitui (id imutável), PATCH merge; JSON inválido/não-objeto → 400 `INVALID_JSON`; DELETE coleção → 405 com `Allow` 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** `custom` usa `response`; precedência independente `statusExplicit`/`bodyExplicit`; status 200–599 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** POST 201 com `Location`; CORS expõe `location`/`allow` 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** `curl -X PATCH /users/:id` faz merge; `PUT` substitui; `DELETE /users` responde 405 com `Allow` 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** `curl -X POST /auth/login` (custom) retorna o `response` configurado e `Location` no 201 padrão 🏷️ fase/codigo

## M4 — Tree e ações por rota
- [x] #task ⏫ **[auto]** `endpointActions` com `[key, schemaName]`; menu cenário/cURL/browser (browser só GET sem `:`) 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** `switchScenario(routeArg?)` lista todas as rotas; cenário por método; contador considera rota explícita 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** Cada endpoint (POST/PATCH/DELETE/custom) abre o menu com **cenário**, **cURL** e **browser** só quando cabe 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** `Switch Scenario…` pela paleta lista todas as rotas; aplicar muda só o método escolhido 🏷️ fase/codigo

## M5 — Studio de rotas
- [x] #task ⏫ **[auto]** Toggle “Customizar rotas”, tabela método/path/kind/status/body, add/remove/reset, `summary`/props via `o` 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** `jsonForHtml` escapa `<`/U+2028/U+2029; rota sem path falha; `routes: []` tem mensagem específica 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** Ativar “Customizar rotas” → adicionar `POST /auth/login` custom com status/body → salvar → Tree/export refletem 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** “Restaurar CRUD padrão” remove `routes` do JSON; Schema sem customização continua enxuto 🏷️ fase/codigo

## M6 — Export e validate
- [x] #task ⏫ **[auto]** OpenAPI por rota (params/requestBody/response/summary); status sanitizado; duplicata → erro 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** MD/HTML por rota; 204/304 sem body; HTML sem paginação quando não há `kind: list` 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** `validate` usa a rota `kind: list` (custom), escolhe a não aninhada; sem list → `skipped` com aviso 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** `Export Contract` gera OpenAPI/MD/HTML com `POST /auth/login` e `summary`; `Validate` pula com aviso quando não há list 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** CLI `devmock export` com rotas duplicadas falha com mensagem; `devmock validate` mostra skip 🏷️ fase/codigo

## Regressão
- [x] #task 🔼 **[auto]** Core **193** + CLI **20** + host **62**; AUD-01…AUD-16 nomeados 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** [[Manual-Teste-v1.4]]: Ações, cenário por clique, cenário por `?scenario=`/header, Detect, HTML docs, Start/Stop 🏷️ fase/codigo

## Resultado
| Data | Passo | ✅/❌ | Observação |
|------|-------|------|------------|
| 2026-10-22 | Build + tsc + suítes | ✅ | core **193** · cli **20** · host **62** |
| | F5 + M1–M6 (UI) | | |
| | CLI export/validate | | |

- Todos ✅ → **promove v1.5.0** (tag `ext-v1.5.0` → publish).
