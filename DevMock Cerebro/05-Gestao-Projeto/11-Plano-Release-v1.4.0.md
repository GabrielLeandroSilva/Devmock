---
title: "Plano de Release — v1.4.0"
type: gestao
status: aprovado
fase: codigo
tags: [devmock/gestao, devmock/release]
related: ["[[PRD-03-VSCode-Extension]]", "[[PRD-04-Scenarios]]", "[[10-Plano-Release-v1.3.0]]", "[[07-Estrategia-Testes]]"]
created: 2026-10-21
updated: 2026-10-21
---

# Gestão — 11 Plano de Release v1.4.0

## 1. Objetivo
**Tema:** *Mouse-first — a extensão inteira sem depender da paleta.*

Hoje várias ações só existem na Command Palette. A 1.4.0 leva essas ações para a **Tree**: um botão **Ações** no header concentra os comandos e o clique num **cenário** permite aplicá-lo a um ou mais **Schemas**. O objetivo é operar o fluxo completo (init → Schema → cenário → server → export) só com o mouse.

## 2. Escopo

### Must
| ID | Item | Origem | Status atual no código |
|----|------|--------|------------------------|
| **M1** | **Botão Ações no header** da Tree: `devmock.actions` abre um QuickPick agrupado com os comandos (Init, New/Edit Schema, Create API, Import, Generate/Save, Export, Validate, Start/Stop, Switch Scenario, Set Error Rate, Show Log, Refresh). Ítens indisponíveis são ocultados (sem `.devmock/`, sem Schema, server parado). **New Schema sai do header**; **Refresh** e **Start/Stop** ficam. | Pedido do mantenedor · [[PRD-03-VSCode-Extension]] §3 | `view/title` tem Refresh/New Schema/Start/Stop; comandos só na paleta |
| **M2** | **Cenário por clique**: nó de cenário ganha comando; clique → QuickPick **multi-seleção de Schemas** → aplica o cenário no **`GET` de coleção** de cada um (`activeScenarios["GET /<plural>"]`), grava uma vez, recarrega o server vivo e dá refresh. | Pedido do mantenedor · [[PRD-04-Scenarios]] §6 | nó só lista nomes (sem `command`) |
| **M3** | **Ações refletem o estado**: sem projeto → só Initialize (+Refresh); sem Schemas → esconde Edit/Generate/Save/Export/Validate/Start; rodando → mostra Stop + Show Log, senão Start. | UX mouse-first | — |

### Should
| ID | Item | Origem |
|----|------|--------|
| **S1** | Nós de cenário com `contextValue: "scenario"` e descrição `N schema(s)` (quantos usam o cenário). | UX/descoberta |
| **S2** | Limpar no PRD-03 a nota antiga “v1.4.0: modo edição no Studio” (já entregue). | higiene de docs |

### Fora (v1.5+)
- Aplicar cenário em **todas** as rotas do Schema (POST/PUT/PATCH/`:id`).
- Cenários customizados (arquivo) no clique.
- Menus de contexto extras em Schema/Endpoint.
- Atalhos de teclado / keybindings.
- Clique em Documentation para abrir o `.md`/HTML.

## 3. Definition of Done (por item)
- **M1:** header mostra **Ações** + Refresh + Start/Stop; New Schema não está mais no header e aparece no Ações; todos os comandos listados são alcançáveis; itens indisponíveis ocultos; `executeCommand` sem `await` (não trava).
- **M2:** clique em qualquer cenário abre multi-seleção de Schemas (com cenário atual e rota); confirmar grava **um único** `config.json`, aplica em `GET /<schema>`, recarrega o server se rodando, dá refresh e mostra toast; cancelar não altera nada.
- **M3:** estados sem projeto/sem Schema/parado/rodando cobertos por teste do builder.
- **S1:** descrição e `contextValue` presentes no nó.
- **S2:** PRD-03 sem a referência obsoleta.

## 4. Passos de execução (checklist)
- [/] #task ⏫ M1 — `actions.ts` (builder puro) + comando `devmock.actions` 🏷️ fase/codigo
- [/] #task ⏫ M1 — `package.json`: Ações em `navigation@0`, New Schema fora do header 🏷️ fase/codigo
- [/] #task ⏫ M1 — testes do builder + contrato do `package.json` 🏷️ fase/codigo
- [/] #task ⏫ M2 — `doSwitchScenarios` (grava uma vez) + delegar `doSwitchScenario` 🏷️ fase/codigo
- [/] #task ⏫ M2 — nó de cenário com `command`/`contextValue` + `buildScenarioPick` 🏷️ fase/codigo
- [/] #task ⏫ M2 — comando `devmock.applyScenario` (multi-seleção, reload, refresh) 🏷️ fase/codigo
- [/] #task ⏫ M2 — testes (tree + ops + host) 🏷️ fase/codigo
- [/] #task 🔼 S1 — descrição `N schema(s)` no nó 🏷️ fase/codigo
- [/] #task 🔼 Manual-Teste-v1.4 (só-mouse) + CHANGELOG + `package.json → 1.4.0` 🏷️ fase/codigo
- [/] #task 🔼 README + wiki (Docs-Keeper) 🏷️ fase/codigo
- [/] #task ⏫ Rodar Gate de Release (§5) 🏷️ fase/codigo

## 5. Gate de Release
- [ ] Manual-Teste-v1.4 100% (checklist **só com o mouse**: Ações, cenário, start/stop, export)
- [ ] suítes + cobertura ≥ gate (core 90/80 · CLI 90/80/95/90) + matriz `AUD`/`RF`
- [ ] `tsc --noEmit` + `npm run build` + `vsce package` limpos
- [ ] CHANGELOG + `apps/extension/package.json` = `1.4.0`
- [ ] README (raiz + extension) e wiki sincronizados
- [ ] `Log-Versionamento` atualizado
- [ ] Tag `ext-v1.4.0` (trava `tag == versão`) → `publish.yml`
- [ ] Post de lançamento ([[Agente-LinkedIn]], postagem manual)

## 6. Riscos e Dependências
- **Limite do VS Code:** o nome da view (“Project”) não pode ser substituído por um botão; o **Ações** entra como primeiro ícone (`navigation@0`), ao lado do título.
- **QuickPick aninhado** (Ações → Create API → QuickPick) funciona, mas exige `executeCommand` fire-and-forget para não travar.
- **Só GET de coleção:** POST/`:id` continuam via `Switch Scenario…` (em Ações); documentar no PRD-04.
- **Teste de QuickPick:** não é unit-testável; garantimos por builders puros + contrato do `package.json` + smoke no host.
- **Multi-root:** segue usando a primeira pasta do workspace (comportamento atual).
- Depende de [[PRD-03-VSCode-Extension]] e [[PRD-04-Scenarios]]; sem mudança no Core.

## 7. Links
- PRDs: [[PRD-03-VSCode-Extension]] · [[PRD-04-Scenarios]]
- Qualidade: [[07-Estrategia-Testes]] · [[Agente-QA-Testes]] | Review: [[Agente-Code-Reviewer]]
- Anterior: [[10-Plano-Release-v1.3.0]] | Roadmap: [[01-EAP]] · [[00-Home]]
