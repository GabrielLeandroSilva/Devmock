---
title: "Plano de Release — v1.2.0 (+ v1.1.1)"
type: gestao
status: aprovado
fase: codigo
tags: [devmock/gestao, devmock/release]
related: ["[[06-Plano-Release-v1.1.0]]", "[[07-Estrategia-Testes]]", "[[PRD-03-VSCode-Extension]]", "[[PRD-05-Docs-Export]]", "[[PRD-09-Detect-From-Project]]"]
created: 2026-10-17
updated: 2026-10-17
---

# Gestão — 08 Plano de Release v1.2.0 (+ v1.1.1)

## 0. Parte 0 — **v1.1.1** (patch: Stop lento)
**Bug (AUD-16):** ao parar o Mock Server, o comando demora ~5s.
- **Causa raiz:** `packages/core/src/mock/server.ts` → `close()` usa `server.close(cb)`, que espera as conexões **keep-alive** (navegador/`fetch`, ~5s) encerrarem. A extension aguarda isso em `apps/extension/src/extension.ts:230`.
- **Fix:** após `server.close(cb)`, chamar `server.closeAllConnections()` (Node ≥18.2; `engines >=20`).
- **DoD:** teste de regressão `AUD-16` — com uma conexão keep-alive aberta, `close()` resolve em **<1s**.

| Item | Descrição |
|------|-----------|
| P0.1 | Core: `close()` encerra conexões ociosas (`closeAllConnections`) |
| P0.2 | Regressão `AUD-16` (core) + catálogo no [[Agente-Auditor]] |
| P0.3 | Extension `package.json → 1.1.1` + CHANGELOG |
| P0.4 | Manual-Teste §7: Stop sem travar (host) |

**Gate v1.1.1:** suítes verdes · Manual §7 ✅ · tag `ext-v1.1.1` → `publish.yml`.

## 1. Parte 1 — **v1.2.0** (features + Detect + HTML docs)

**Tema:** *a Tree vira um painel de controle + o DevMock aprende a ler seu projeto.*

| ID | Item | Origem | Status atual no código |
|----|------|--------|------------------------|
| W1.1 | **Editar `errorRate` pela Tree (Settings)** — `devmock.setErrorRate` (input 0–100 → `writeConfig` → refresh) | PRD-03 RF-08 (novo) | Nó Settings é só-leitura (`extension.ts:108-115`) |
| W1.2 | **Cenário ativo no Schema e no Endpoint** — `description` mostra o cenário do endpoint-lista / de cada rota | PRD-03 RF-09 (novo) | Schema mostra só "N campos" (`extension.ts:91-97`) |
| W1.3 | **Clique em Endpoint GET abre no navegador** — `devmock.openEndpoint` (`env.openExternal` em `http://localhost:<porta><path>?limit=5`) | PRD-03 RF-10 (novo) | Nós de Endpoint são labels puros (`extension.ts:98-99`) |
| W1.4 | **Botões inline Start/Stop** no nó Mock Server — `contextValue` Running/Stopped + ícones `$(play)`/`$(debug-stop)` | PRD-03 RF-11 (novo) | Nó sem ação (`extension.ts:78-85`) |
| W2 | **Detect from project** — varre `src/**`, propõe Schemas (interfaces TS) e Endpoints (chamadas HTTP), multi-seleção | [[PRD-09-Detect-From-Project]] | Placeholder "em breve" (`extension.ts:274`) |
| W3 | **HTML docs** — página única com âncoras, CSS inline/offline, ao lado do Markdown | PRD-05 (Fora → Dentro) | Só Markdown (`packages/core/src/export/md.ts`) |

### Ordem de execução (W)
1. **W1** (Tree UX) — 4 comandos/menus; alto valor, baixo risco.
2. **W3** (HTML docs) — builder puro `docsHtml.ts` + novo artefato no export.
3. **W2** (Detect) — módulo puro `detect.ts` + UI; maior risco de falso-positivo.

> ⚠️ **W3 interage com M4:** adicionar um artefato novo (`html`) ao `.hashes.json` exige atualizar `ALL_ARTIFACTS`/`mergeExportHashes`/`staleSchemas` (core) e os chamadores. Retrocompatível (`{}` = tudo stale).

## 2. Definition of Done (por item)
- **W1.1** `setErrorRate` valida 0–100, grava e reflete na Tree; teste no host.
- **W1.2** Schema e Endpoints exibem `Default`/cenário ativo; teste de provider (seam) ou de builder puro.
- **W1.3** Só GET abre; com server parado → aviso; teste do construtor de URL.
- **W1.4** Ícones condizem com o estado (Start quando parado, Stop quando rodando).
- **W2** Fixture detecta `User`/`Order` + `api.get('/users')`; nada criado sem confirmação; 2ª rodada idempotente. Testes conforme [[PRD-09-Detect-From-Project]] §7.
- **W3** HTML único, offline, determinístico (re-export → diff zero); novo artefato entra no stale por artefato.

## 3. Passos de execução (checklist)
- [x] #task ⏫ P0 — Core `close()` + regressão `AUD-16` 🏷️ fase/codigo
- [x] #task 🔼 P0 — versão `1.1.1` + CHANGELOG + Manual §7 + gate + tag `ext-v1.1.1` 🏷️ fase/codigo
- [x] #task ⏫ W1.1 — `devmock.setErrorRate` + Settings clicável 🏷️ fase/codigo
- [x] #task ⏫ W1.2 — cenário ativo no Schema e nos Endpoints 🏷️ fase/codigo
- [x] #task ⏫ W1.3 — `devmock.openEndpoint` (só GET) 🏷️ fase/codigo
- [x] #task ⏫ W1.4 — ícones inline Start/Stop no nó Mock Server 🏷️ fase/codigo
- [x] #task ⏫ W3 — HTML docs (página única) + artefato no export 🏷️ fase/codigo
- [x] #task ⏫ W2 — Detect from project ([[PRD-09-Detect-From-Project]]) 🏷️ fase/codigo
- [/] #task 🔼 Suítes: matriz `RF→teste` ampliada; órfão (b) fechado 🏷️ fase/codigo
- [/] #task 🔼 Manual-Teste-v1.2 + CHANGELOG + `package.json → 1.2.0` 🏷️ fase/codigo
- [/] #task 🔼 Sincronizar README + wiki (Docs-Keeper) 🏷️ fase/codigo
- [/] #task ⏫ Rodar Gate de Release (§4) 🏷️ fase/codigo

## 4. Gate de Release
- [ ] Manual-Teste-v1.2 100% ✅ (inclui W1–W3 + P0)
- [ ] `vitest run` verde + cobertura ≥ gate + matriz `AUD`/`RF` 100%
- [ ] `tsc --noEmit` limpo em todos os workspaces
- [ ] CHANGELOG + `package.json` = `1.2.0`
- [ ] README (raiz + extension) e wiki sincronizados
- [ ] `Log-Versionamento` atualizado
- [ ] Tag `ext-v1.2.0` (trava `tag == versão`) → `publish.yml`
- [ ] Post de lançamento ([[Agente-LinkedIn]], postagem manual)

## 5. Riscos e Dependências
- **W2 (Detect)** é o maior risco: falsos positivos e estilos de chamada variados. Mitigação: heurística conservadora, confirmação humana, `warnings[]`.
- **W3** altera o contrato do `.hashes.json` (novo artefato) — cobrir com testes (já temos base no M4).
- **W1.2** toca a Tree (órfão (a) da matriz de testes pede *seam*): extrair um builder puro da Tree para testar Schema/Endpoint sem o host.
- Depende de v1.1.1 (Stop) já publicado para a experiência de start/stop ficar fluida no W1.4.
- **Infra/Stacks:** a baseline agora exige **Node ≥22** e **VS Code ≥1.101** (runtime Node 22); **futuro: mínimo Node 24** → [[06-Stacks-e-Versoes]].

## 6. Links
- PRDs: [[PRD-03-VSCode-Extension]] · [[PRD-05-Docs-Export]] · [[PRD-09-Detect-From-Project]] · [[PRD-02-Mock-Server]]
- Qualidade: [[07-Estrategia-Testes]] · [[Agente-QA-Testes]] | Catálogo: [[Agente-Auditor]]
- Anterior: [[06-Plano-Release-v1.1.0]] | Roadmap: [[01-EAP]] · [[00-Home]]
