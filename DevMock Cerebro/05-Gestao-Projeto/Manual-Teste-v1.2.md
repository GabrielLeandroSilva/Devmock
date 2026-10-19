---
title: "Manual de Teste v1.2.0"
type: gestao
status: revisao
fase: codigo
tags: [devmock/qa, devmock/release]
related: ["[[08-Plano-Release-v1.2.0]]", "[[07-Estrategia-Testes]]", "[[Manual-Teste-v1.1]]", "[[PRD-09-Detect-From-Project]]"]
created: 2026-10-17
updated: 2026-10-17
---

# Gestão — Manual de Teste v1.2.0

> Foco em W1 (Tree UX), W3 (HTML docs) e W2 (Detect). **[auto]** = coberto por suíte; **[UI]** = validar no host (F5). Regressão herda [[Manual-Teste-v1.1]].

## 0. Preparação
- [x] #task 🔼 Build limpo: `npm run build` 🏷️ fase/codigo ✅ 2026-10-17
- [x] #task 🔼 Suítes verdes: core + cli + extension 🏷️ fase/codigo ✅ 2026-10-17
- [ ] #task 🔼 F5 no host de desenvolvimento 🏷️ fase/codigo

## W1 — Tree UX
- [ ] #task ⏫ **[UI]** Settings → clique em `errorRate: N` abre input; gravar 20 reflete na Tree e vale no server rodando 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** Schema e Endpoints exibem `cenário: Default`; após Switch → `Empty`, o texto atualiza 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** Clique em `GET /users` abre `http://localhost:<porta>/users?page=1&limit=5` no navegador (server parado → aviso) 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** Nó `Mock Server` mostra ícone **Start** parado e **Stop** rodando; clicar funciona 🏷️ fase/codigo
- **Evidência auto:** host `ops.test.ts` (W1 — `doSetErrorRate`, `scenarioOf`, `endpointUrl`, contrato do `package.json`)

## W3 — HTML docs
- [ ] #task ⏫ **[auto]** `Export Contract → Tudo` gera `docs/index.html` (6 artefatos) 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** `docs/index.html` abre **offline**, com âncoras por recurso e tabela de campos 🏷️ fase/codigo
- [ ] #task 🔼 **[auto]** Re-export idempotente; export parcial não sincroniza os demais artefatos 🏷️ fase/codigo
- **Evidência auto:** core `export.test.ts` (W3) · host `ops.test.ts` (6 artefatos) · cli `cli.test.ts` (`docs/index.html`)

## W2 — Detect from project
- [ ] #task ⏫ **[auto]** `detect.test.ts` (core): interface User/Company → Schemas; `api.get`/`axios.post`/`fetch` → endpoints; warnings para tipos não mapeados 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** `Create API… → Detect from project` lista os modelos do `src/` com multi-seleção; criar grava `schemas/*.json` 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** Rodar 2× não duplica (pula existentes); endpoints detectados aparecem no Output 🏷️ fase/codigo
- **Evidência auto:** core `detect.test.ts` · host `ops.test.ts` (W2 — `doDetect`/`doCreateDetectedSchemas` idempotente)

## Regressão
- [ ] #task 🔼 **[UI]** [[Manual-Teste-v1.1]] (M1–M4 + §1–§7) continua ✅ 🏷️ fase/codigo

## Resultado
| Data | Passo | ✅/❌ | Observação |
|------|-------|------|------------|
| 2026-10-17 | Build + tsc + suítes | ✅ | core **100** (cob 90.9/82.6) · cli 7 · host **19** |
| | 0 F5 | | aguarda host |
| | W1 (UI) | | aguarda host |
| | W3 (UI) | | aguarda host |
| | W2 (UI) | | aguarda host |
| | Regressão | | aguarda host |

- Todos ✅ → **promove v1.2.0** (PR `des`→`main` + tag `ext-v1.2.0`).
