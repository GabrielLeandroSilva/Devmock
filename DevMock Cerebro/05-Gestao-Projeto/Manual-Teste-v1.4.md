---
title: "Manual de Teste v1.4.0"
type: gestao
status: revisao
fase: codigo
tags: [devmock/qa, devmock/release]
related: ["[[11-Plano-Release-v1.4.0]]", "[[07-Estrategia-Testes]]", "[[Manual-Teste-v1.3]]", "[[PRD-03-VSCode-Extension]]", "[[PRD-04-Scenarios]]"]
created: 2026-10-21
updated: 2026-10-21
---

# Gestão — Manual de Teste v1.4.0

> Foco **só-mouse**: botão **Ações** no header e **cenário por clique**. **[auto]** = suíte; **[UI]** = conferir no host (F5). Regressão herda [[Manual-Teste-v1.3]].

## 0. Preparação
- [x] #task 🔼 Build limpo: `npm run build` 🏷️ fase/codigo ✅ 2026-10-21
- [x] #task 🔼 `tsc --noEmit` core/cli/extension 🏷️ fase/codigo ✅ 2026-10-21
- [x] #task 🔼 Suítes: core **111** · cli **15** · host **41** 🏷️ fase/codigo ✅ 2026-10-21
- [ ] #task 🔼 F5 no host de desenvolvimento (**VS Code ≥ 1.101**) 🏷️ fase/codigo

## M1 — Botão Ações
- [x] #task ⏫ **[auto]** Builder cobre os 4 estados (sem projeto, sem Schema, parado, rodando) e oculta o que não se aplica 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** Separadores por grupo (sem separador no topo) e contrato `ActionItem.command ↔ package.json` 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** Header: Ações `navigation@0`, Refresh@1, Start/Stop@2; New Schema fora 🏷️ fase/codigo
- [x] #task 🔼 **[auto]** Seleção do QuickPick encaminhada sem aguardar o comando (AUD-12) 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** Header mostra **Ações** + Refresh + Start/Stop; Ações abre o QuickPick agrupado 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** `Ações → Create API → From scratch` abre o segundo picker sem travar o host 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** Sem `.devmock/` só Initialize+Refresh; sem Schema esconde Edit/Generate/Export/Start; rodando mostra Stop+Log 🏷️ fase/codigo

## M2 — Cenário por clique
- [x] #task ⏫ **[auto]** Nó de cenário com `command`/`arguments`/`contextValue` e `N schema(s)` 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** Pick lista Schemas com cenário atual + `GET /<plural>` e pré-seleciona o atual 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** `doSwitchScenarios` grava vários, deduplica rotas e preserva os demais 🏷️ fase/codigo
- [x] #task ⏫ **[auto]** Host: cancelar não grava; vazio → warning; aplicar → `Empty` nas duas rotas com server vivo; toast 🏷️ fase/codigo
- [ ] #task ⏫ **[UI]** Clique em `Empty` → multi-seleção → aplicar; `✓` e `N schema(s)` atualizam na Tree 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** Server rodando: aplicar cenário muda a resposta **sem restart** (curl na rota) 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** `DevMock: Apply Scenario…` pela paleta (sem arg) pede o cenário antes 🏷️ fase/codigo

## Regressão
- [x] #task 🔼 **[auto]** Host 41: smoke, comandos, Studio, export/validate, detect 🏷️ fase/codigo
- [ ] #task 🔼 **[UI]** [[Manual-Teste-v1.3]]: cenário por `?scenario=`/header, Detect, HTML docs, Start/Stop 🏷️ fase/codigo

## Resultado
| Data | Passo | ✅/❌ | Observação |
|------|-------|------|------------|
| 2026-10-21 | Build + tsc + suítes | ✅ | core **111** · cli **15** · host **41** |
| 2026-10-22 | Publish | ✅ | run **39709686570**: host 41 verde antes do `vsce` → **PUBLICADO 1.4.0** |
| | F5 + M1/M2 (UI) | | smoke visual opcional pós-release |
| | Regressão v1.3 (UI) | | coberta pela suíte do host no publish |

- Todos ✅ → **promove v1.4.0** (tag `ext-v1.4.0` → publish).
