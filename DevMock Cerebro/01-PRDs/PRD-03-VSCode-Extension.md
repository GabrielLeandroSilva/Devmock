---
title: "PRD-03 VS Code Extension"
type: prd
status: revisao
fase: 1
tags: [devmock/mvp, devmock/extension]
related: ["[[PRD-01-Core-Schema-Data]]", "[[PRD-02-Mock-Server]]", "[[PRD-09-Detect-From-Project]]", "[[08-Plano-Release-v1.2.0]]", "[[DevMock-Produto-e-Fluxos]]"]
created: 2026-10-10
updated: 2026-10-17
---

# PRD-03 — VS Code Extension

> Deriva de: §§ 5, 6, 26. Três níveis: Simples → Avançado → Power User.

## 1. Contexto e Problema
Dev precisa de experiência visual simples (TreeView) + edição direta dos arquivos, sem burocracia (princípio Developer Friendly + Progressive Complexity).

## 2. Personas
- [x] Front-end iniciante (nível Simples: Schema → Start Mock → API funcionando)
- [x] Dev avançado (nível Avançado: Schemas, Endpoints, Scenarios, Docs, Settings)
- [x] Power User (edita `.devmock/` + Git + futuro CLI/CI)

## 3. Escopo
### Dentro (MVP)
- `Initialize Project`: cria `.devmock/{config.json,schemas/,scenarios/,docs/,openapi/}` (§5.2) + mensagem se já existe
- TreeView `DEV MOCK`: Project (Schemas, Endpoints, Scenarios, Documentation, Settings) + `Mock Server 🟢 localhost:4010` (§6)
- Comandos: `DevMock: Init / Start / Stop / Generate Data / Switch Scenario / Export Contract`
- Formulário de Schema → salva JSON; edição direta do JSON reflete na Tree (watch)
- Nível Simples com 1 clique até mock funcionando; Avançado expõe todas as configs

### Dentro (v1.2.0)
- **Tree UX:** editar `errorRate` pela Settings; cenário ativo no Schema e nos Endpoints; clique em Endpoint **GET** abre no navegador; ícones inline **Start/Stop** no nó Mock Server
- `Create API… → **Detect from project**` habilitado — ver [[PRD-09-Detect-From-Project]] (v1.2.0)

### Fora (futuro)
- CLI (`devmock init/start/generate/export/validate`) — PRD-08 ✅ (entregue)
- HTML docs — PRD-05 (v1.2.0)

## 4. Requisitos Funcionais
| ID | Requisito | Prioridade | Origem |
|----|-----------|------------|--------|
| RF-01 | Init cria estrutura completa e é idempotente | Must | §5.2 |
| RF-02 | TreeView lista Schemas/Endpoints/Scenarios a partir dos arquivos | Must | §6 |
| RF-03 | Start/Stop server pelo painel com status e porta | Must | §13 |
| RF-04 | Form de Schema com tipos + geradores BR em dropdown; v1.1.0: painel Studio com preview (records/seed) e erros inline; v1.4.0: modo edição no mesmo Studio (clique no nó, menu contexto ou comando) | Must | §7 |
| RF-05 | Edição manual de JSON recarrega a Tree sem restart | Should | §6 |
| RF-06 | `Create API: From scratch / Import / Detect` — From scratch e Import habilitados; **Detect habilitado na v1.2.0** ([[PRD-09-Detect-From-Project]]) | Must | §7 |
| RF-07 | Testabilidade: lógica dos comandos em `ops.ts`/`studio.ts` puros (sem vscode); notificações puras fire-and-forget (nunca `await` que trave o comando); `?limit` sozinho pagina | Must | — |
| RF-08 | Editar **`errorRate`** pela Settings da Tree (input 0–100 → grava `config.json` → refresh) | Should | v1.2.0 |
| RF-09 | Nó do **Schema** e nós de **Endpoint** exibem o **cenário ativo** (Default/Empty/403/…) | Should | v1.2.0 |
| RF-10 | Clique em Endpoint **GET** abre a rota no navegador (`http://localhost:<porta><path>?limit=5`); server parado → aviso | Should | v1.2.0 |
| RF-11 | Nó **Mock Server** com botões inline **Start/Stop** (ícones), conforme o estado | Should | v1.2.0 |

## 5. Requisitos Não-Funcionais
- Ativação <500ms; Tree atualiza em <200ms após salvar arquivo
- Funciona com multi-root workspace (um `.devmock/` por pasta)
- Textos PT-BR na UI; termos técnicos em inglês

## 6. Regras de Negócio
- Sem `.devmock/` → CTA único `[ Initialize Project ]`, resto desabilitado
- Extension é fina: regra de negócio mora no Core (Fase 2), Extension só invoca

## 7. Critérios de Aceite
- [ ] #task ⏫ Projeto sem config exibe CTA e Init cria as 5 pastas + config.json 🏷️ fase/1
- [ ] #task ⏫ Tree exibe User/Product/Order + endpoints GET/POST/DELETE do exemplo §6 🏷️ fase/1
- [ ] #task ⏫ Start exibe 🟢 + porta; Stop derruba sem processo zumbi 🏷️ fase/1
- [ ] #task 🔼 Editar `user.json` na mão atualiza a Tree sem reload 🏷️ fase/1
- [ ] #task 🔼 **[v1.2.0]** Editar `errorRate` pela Settings grava no `config.json` e reflete na Tree 🏷️ fase/codigo
- [ ] #task 🔼 **[v1.2.0]** Schema e Endpoints exibem o cenário ativo; clique em GET abre no navegador 🏷️ fase/codigo
- [ ] #task 🔼 **[v1.2.0]** Nó Mock Server mostra Start/Stop inline conforme o estado 🏷️ fase/codigo

## 8. Riscos e Dependências
- Depende de PRD-01 (formato de Schema) e PRD-02 (start/stop)
- Watch de arquivos com debounce para não travar a UI

## 9. Links
- Processo: `BPM-01-Init-Project` (Fase 2)
- UX detalhada: `06-Extras/04-UX-UI-Extension` (Fase 5)
