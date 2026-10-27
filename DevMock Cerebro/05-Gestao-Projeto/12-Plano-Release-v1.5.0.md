---
title: "Plano de Release — v1.5.0"
type: gestao
status: aprovado
fase: codigo
tags: [devmock/gestao, devmock/release]
related: ["[[PRD-02-Mock-Server]]", "[[PRD-03-VSCode-Extension]]", "[[PRD-04-Scenarios]]", "[[PRD-05-Docs-Export]]", "[[11-Plano-Release-v1.4.0]]", "[[07-Estrategia-Testes]]"]
created: 2026-10-22
updated: 2026-10-22
---

# Gestão — 12 Plano de Release v1.5.0

## 1. Objetivo
**Tema:** *Rotas completas — mapa por Schema e POST/PATCH/DELETE de primeira classe.*

Hoje o Core já responde as 6 rotas, mas o path é fixo (`/${plural(name)}`) e a UI só expõe GET (cenário, clique, browser). A 1.5.0 permite **declarar o mapa de rotas no Schema** (inclusive ações fora do CRUD), corrige a semântica de escrita e leva POST/PATCH/DELETE para a Tree com o mesmo nível de interação do GET.

## 2. Escopo

### Must
| ID | Item | Origem | Status atual |
|----|------|--------|--------------|
| **M1** | **`Schema.routes`**: `{ method, path, kind, response?, summary? }[]`; ausente = CRUD padrão (6 rotas); validação (path, `kind`×método, `method+path` único, `:param`) | [[PRD-02-Mock-Server]] §3 | ✅ v1.5.0 (M1) — core 140/host 44 |
| **M2** | **Router**: tabela método+pattern, `:param`, estático vence param, params extraídos, chave de log/config = pattern; ligar `validateProject` no load (server/extension) | [[PRD-02-Mock-Server]] §3 | `resolveStore(parts)` por 1º segmento |
| **M3** | **Semântica**: PUT substitui, PATCH merge, JSON inválido → 400, `DELETE` coleção → 405, `custom` usa `response` (precedência request > endpoint > rota > default) | [[PRD-02-Mock-Server]] §3 | PUT=PATCH; inválido vira `{}` |
| **M4** | **UI**: clique em qualquer endpoint → menu (Switch scenario, Copy as cURL; browser só GET sem `:id`); `Switch Scenario` lista todas as rotas; cenário por método; descrição em todos os nós | [[PRD-03-VSCode-Extension]] §3 | só GET tem ação/cenário |
| **M5** | **Studio**: seção Rotas (método/path/kind/response), adicionar/remover, “Restaurar CRUD padrão”; salva `routes` só quando customizado | [[PRD-03-VSCode-Extension]] §3 | formulário só name/fields |
| **M6** | **Propagação**: OpenAPI (paths por rota), MD/HTML (todas as rotas), `validate` (usa `kind: list`), CLI | [[PRD-05-Docs-Export]] §3 | exports assumem `plural` |
| **M7** | **Docs**: PRDs, manual, README/wiki, CHANGELOG, Log | — | — |

### Should
| ID | Item | Origem |
|----|------|--------|
| **S1** | `Location` no POST 201; `Allow` no 405 | PRD-02 §12 |
| **S2** | `summary` por rota no OpenAPI/MD | PRD-05 §16 |
| **S3** | Guia de migração (chaves de cenário passam a usar o pattern da rota) | — |

### Fora (v1.6+)
- Auth/rate limit por rota; middlewares.
- Runner HTTP dentro da extensão.
- GraphQL/WebSocket.

## 3. Definition of Done (por item)
- **M1:** `routes` ausente mantém as 6 rotas; `routes` presente substitui o conjunto; validação rejeita path inválido, `kind` incompatível e `method+path` duplicado; `:param` aceito. **Status:** ✅ implementado, revisado (Code-Reviewer) e auditado (QA-Testes; core **140**, host **44**).
- **M2:** `GET /v1/users` e `GET /v1/users/:id` resolvem o mesmo Schema; rota estática vence `:param`; log/config usam `"METHOD /pattern"`.
- **M3:** PUT substitui (mantém `id`), PATCH faz merge; POST/PUT/PATCH com JSON inválido → 400; `DELETE` coleção → 405 com `Allow`; `custom` usa `response` e cenário/endpoint sobrescrevem.
- **M4:** todo endpoint abre o menu; Switch Scenario lista todos os métodos; cenário aplica por endpoint; cURL copia método/URL/body; GET sem `:id` abre no browser.
- **M5:** Studio edita rotas, restaura o padrão e salva; schema sem customização continua sem `routes`.
- **M6:** OpenAPI/MD/HTML refletem rotas custom; validate usa a rota `list`; CLI export/validate acompanham.
- **M7:** docs/superfícies sincronizadas.

## 4. Passos de execução (checklist)
- [x] #task ⏫ M1 — tipos `SchemaRoute`/`RouteKind` + defaults + validação + helpers (`routesFor`, `listRoute`) 🏷️ fase/codigo
- [/] #task ⏫ M2 — router por método+pattern (estático > `:param`) + store/params 🏷️ fase/codigo
- [/] #task ⏫ M3 — PUT replace, PATCH merge, 400/405, `response` custom + precedência 🏷️ fase/codigo
- [/] #task ⏫ M4 — menu do endpoint + cURL + `Switch Scenario` todas as rotas 🏷️ fase/codigo
- [/] #task ⏫ M5 — editor de rotas no Studio (webview + `StudioMessage`) 🏷️ fase/codigo
- [/] #task ⏫ M6 — OpenAPI/MD/HTML/validate/CLI com rotas custom 🏷️ fase/codigo
- [/] #task 🔼 S1 — `Location`/`Allow` 🏷️ fase/codigo
- [/] #task 🔼 S2 — `summary` nas docs 🏷️ fase/codigo
- [/] #task 🔼 Testes core + host + regressão (default intacto) 🏷️ fase/codigo
- [/] #task 🔼 Manual-Teste-v1.5 + CHANGELOG + `package.json → 1.5.0` 🏷️ fase/codigo
- [/] #task 🔼 README + wiki (Docs-Keeper) 🏷️ fase/codigo
- [/] #task ⏫ Rodar Gate de Release (§5) 🏷️ fase/codigo

## 5. Gate de Release
- [ ] Manual-Teste-v1.5 100% (rotas custom + POST/PATCH/DELETE + Studio)
- [ ] suítes + cobertura ≥ gate (core 90/80 · CLI 90/80/95/90)
- [ ] `tsc --noEmit` + `npm run build` + `vsce package` limpos
- [ ] CHANGELOG + `apps/extension/package.json` = `1.5.0`
- [ ] README (raiz + extension) e wiki sincronizados
- [ ] `Log-Versionamento` atualizado
- [ ] Tag `ext-v1.5.0` (trava `tag == versão`) → `publish.yml`
- [ ] Post de lançamento ([[Agente-LinkedIn]], postagem manual)

## 6. Riscos e Dependências
- **Router** é o ponto mais sensível (prioridade estático × `:param`, colisão, params). Testar antes de ligar na UI.
- **`routes` substitui o CRUD**: documentar e oferecer “Restaurar CRUD padrão” no Studio.
- **Export/validate** passam a depender do mapa; fixtures atuais precisam continuar verdes.
- **Chaves de cenário** customizadas exigem migração documentada.
- Depende de [[PRD-01-Core-Schema-Data]] e [[PRD-04-Scenarios]].

## 7. Links
- PRDs: [[PRD-02-Mock-Server]] · [[PRD-03-VSCode-Extension]] · [[PRD-04-Scenarios]] · [[PRD-05-Docs-Export]]
- Qualidade: [[07-Estrategia-Testes]] · [[Agente-QA-Testes]] | Review: [[Agente-Code-Reviewer]]
- Anterior: [[11-Plano-Release-v1.4.0]] | Roadmap: [[01-EAP]] · [[00-Home]]
