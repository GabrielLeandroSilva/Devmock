---
title: "PRD-03 VS Code Extension"
type: prd
status: revisao
fase: 1
tags: [devmock/mvp, devmock/extension]
related: ["[[PRD-01-Core-Schema-Data]]", "[[PRD-02-Mock-Server]]", "[[DevMock-Produto-e-Fluxos]]"]
created: 2026-10-10
updated: 2026-10-10
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

### Fora (futuro)
- Import OpenAPI, Detect from project (§18-20) — PRD-06
- CLI (`devmock init/start/generate/export/validate`) — PRD-08

## 4. Requisitos Funcionais
| ID | Requisito | Prioridade | Origem |
|----|-----------|------------|--------|
| RF-01 | Init cria estrutura completa e é idempotente | Must | §5.2 |
| RF-02 | TreeView lista Schemas/Endpoints/Scenarios a partir dos arquivos | Must | §6 |
| RF-03 | Start/Stop server pelo painel com status e porta | Must | §13 |
| RF-04 | Form de Schema com tipos + geradores BR em dropdown; v1.1.0: painel Studio com preview (records/seed) e erros inline; v1.4.0: modo edição no mesmo Studio (clique no nó, menu contexto ou comando) | Must | §7 |
| RF-05 | Edição manual de JSON recarrega a Tree sem restart | Should | §6 |
| RF-06 | `Create API: From scratch / Import / Detect` — MVP só habilita From scratch, demais mostram "em breve" | Must | §7 |
| RF-07 | Testabilidade: lógica dos comandos em `ops.ts`/`studio.ts` puros (sem vscode); notificações puras fire-and-forget (nunca `await` que trave o comando); `?limit` sozinho pagina | Must | — |

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

## 8. Riscos e Dependências
- Depende de PRD-01 (formato de Schema) e PRD-02 (start/stop)
- Watch de arquivos com debounce para não travar a UI

## 9. Links
- Processo: `BPM-01-Init-Project` (Fase 2)
- UX detalhada: `06-Extras/04-UX-UI-Extension` (Fase 5)
