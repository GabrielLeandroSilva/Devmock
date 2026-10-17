---
title: "Manual de Teste v1.1.1"
type: gestao
status: aprovado
fase: codigo
tags: [devmock/qa, devmock/release]
related: ["[[08-Plano-Release-v1.2.0]]", "[[Manual-Teste-v1.1]]", "[[Agente-Auditor]]", "[[Agente-QA-Testes]]"]
created: 2026-10-17
updated: 2026-10-17
---

# Gestão — Manual de Teste v1.1.1 (patch: Stop)

> Patch focado: o **Stop do Mock Server** não deve mais demorar ~5s. Regressão plena herda [[Manual-Teste-v1.1]].

## 0. Preparação
- [x] #task 🔼 Build limpo: `npm run build` 🏷️ fase/codigo ✅ 2026-10-17
- [x] #task 🔼 Suítes verdes: core + cli + extension 🏷️ fase/codigo ✅ 2026-10-17

## 1. Stop não trava (AUD-16)
- [x] #task ⏫ **[auto]** Regressão `AUD-16`: `close()` resolve em <1s com conexão keep-alive aberta 🏷️ fase/codigo ✅
- [x] #task ⏫ **[UI]** Com o Mock Server rodando (e o front/browser com conexão aberta), `DevMock: Stop Mock Server` derruba em **<1s** (antes: ~5s) 🏷️ fase/codigo ✅ 2026-10-17

## Regressão (herdada)
- [x] #task 🔼 **[UI]** [[Manual-Teste-v1.1]] §7 (Request Log / Stop) continua ✅ 🏷️ fase/codigo ✅ 2026-10-17

## Resultado
| Data | Passo | ✅/❌ | Observação |
|------|-------|------|------------|
| 2026-10-17 | Build + tsc + suítes | ✅ | core **93** (AUD-16 307ms) · cli 7 · host 15 |
| 2026-10-17 | 1 (UI: Stop <1s) | ✅ | confirmado no host pelo mantenedor |
| 2026-10-17 | Regressão §7 | ✅ | validado no host |

- Todos ✅ → **promove v1.1.1** (PR `des`→`main` + tag `ext-v1.1.1`).
