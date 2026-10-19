---
title: "Stacks e Versões"
type: arquitetura
status: aprovado
fase: codigo
tags: [devmock/arquitetura, devmock/infra]
related: ["[[09-Plano-Stacks-e-Versoes]]", "[[03-Extension-Design]]", "[[05-Integracoes-OpenAPI-TS]]"]
created: 2026-10-17
updated: 2026-10-17
---

# Arquitetura — 06 Stacks e Versões

## 1. Objetivo
Registrar a stack oficial, **onde cada versão é declarada** e **o que um upgrade afeta** — para que futuras atualizações sejam previsíveis (checklist §6).

## 2. Build × Runtime (a distinção que mais importa)
| Papel | Quem manda na versão | Consequência |
|-------|----------------------|--------------|
| **Build/CI** (compila, testa, publica) | Node do CI + `engines.node` | define `dist`, testes e empacotamento |
| **CLI** (roda na máquina do usuário) | Node **mínimo** do `engines` | `core/cli` não podem usar API acima do mínimo |
| **Extension** (roda no VS Code) | **Node embutido no VS Code (Electron)** — *não* o Node de build | `esbuild target` + `engines.vscode` são o contrato |

> Subir o Node de build **não** muda o runtime da extension. Para mudar o runtime, é preciso subir o `esbuild target` **e** o `engines.vscode` para um VS Code cujo Electron embuta aquele Node.

### Node × VS Code (verificado 2026-10-17)
| VS Code | Electron | Node embutido |
|---------|----------|---------------|
| 1.100 | 34.5.1 | 20.19.0 |
| **1.101** | **35.5.1** | **22.15.1** |
| 1.101+ | 35+ | 22+ |

## 3. Matriz atual (após Rodada 1 — 2026-10-17)
| Componente | Versão | Suporte |
|------------|--------|---------|
| Node — build/CI/CLI (mín.) | **≥ 22** | 22 = LTS (manutenção até abr/2027) |
| Node — CI matrix | **22 e 24** | 24 = LTS ativa |
| `.nvmrc` (dev) | **24** | — |
| Node — runtime extension | **22+** (VS Code ≥ **1.101**) | — |
| TypeScript | `^5.6` (resolved 5.9.3) | *Rodada 2: 7.0* |
| vitest / coverage | 2.1.9 | *Rodada 2: 5.0* |
| esbuild (target `node22`) | 0.21.5 | *Rodada 2: 0.28* |
| mocha | 10.8.2 | *Rodada 2: 12* |
| `@vscode/test-electron` | 2.5.2 | *Rodada 2: 3* |
| `@vscode/vsce` | 3.9.2 | *Rodada 2: 4* |
| glob | 10.5.0 | *Rodada 2: 13* |
| `@types/node` | **^22** (mínimo) | alinhado na R1 |
| `@types/vscode` | **~1.101** | deve ser ≤ `engines.vscode` |
| yaml / swagger-parser | 2.9.1 / 13.1.0 | latest |

## 4. Onde cada versão é declarada
| Arquivo | Declara |
|---------|---------|
| `package.json` (raiz) | `engines.node`, scripts de build/test |
| `.nvmrc` | Node de desenvolvimento |
| `.github/workflows/ci.yml` | matrix de Node, integração VS Code, cobertura |
| `.github/workflows/publish.yml` | Node da publicação (`vsce`) |
| `tsconfig.base.json` | `target`, `module: NodeNext`, `moduleResolution` |
| `apps/extension/scripts/bundle.js` | `esbuild` `target`/`format` (CJS)/`external: vscode` |
| `apps/extension/package.json` | `engines.vscode`, `@types/vscode`, deps da extension |
| `packages/*/package.json` | deps e `@types/node` |

## 5. Mapa de impacto por upgrade
### Node (major)
- `engines.node` · `.nvmrc` · matrix do CI · `publish.yml`
- `@types/node` = **Node mínimo**
- `tsconfig` (`target`/`lib`) — opcional, revisar
- `esbuild target` = Node do **VS Code mínimo**
- `engines.vscode` = versão do VS Code que embute esse Node
- APIs: `fetch`/Undici (versões por major), `server.closeAllConnections`, deprecações (`url.parse`, `http.writeHeader`, `module.register`, `_stream_*`)
- Rodar host (F5) para validar o runtime real

### TypeScript (major)
- `tsconfig` (`module: NodeNext`, `target`, `lib`), emissão de `declaration`
- `esbuild` (parser do bundle) e `vitest` (transform)
- Tipos: `@types/node`/`@types/vscode` compatíveis

### vitest / coverage (major)
- Config (`vitest.config.ts`), provider v8, thresholds (gate do Core)
- Reporters, globals, padrões de arquivo de teste

### esbuild (minor/major)
- `target`, `format: cjs`, `external: ["vscode"]`, sourcemap
- Compatibilidade com o Node do VS Code

### vsce (major)
- Empacotamento (`.vscodeignore`/files), `--no-dependencies`
- Regra: `@types/vscode` **≤** `engines.vscode`
- `VSCE_PAT` (só em Secrets)

### mocha / @vscode/test-electron (major)
- Versão do VS Code baixada pelo `runTests`, runner da suíte, Xvfb no CI

### glob (major)
- Estilo de import (ESM/CJS), `engines` do pacote

## 6. Checklist de upgrade (Node)
1. [ ] `engines.node` + `.nvmrc` + matrix CI + `publish.yml`
2. [ ] `@types/node` = Node mínimo
3. [ ] `esbuild target` = Node do VS Code mínimo
4. [ ] `engines.vscode` = VS Code com esse Node; `@types/vscode` ≤ `engines.vscode`
5. [ ] `npm install` (lockfile) + `npm run build` + `tsc --noEmit` (3 workspaces)
6. [ ] suítes (core/cli/host) + cobertura do Core (gate)
7. [ ] `vsce package` (dry) e F5 no host
8. [ ] CHANGELOG + README/wiki + [[Log-Versionamento]]

## 7. Roadmap de versões
- **Futuro:** subir o mínimo para **Node 24** (quando 22 entrar em EOL — abr/2027 — ou quando o VS Code mínimo passar a embutir Node 24).
- Majors de toolchain: ver [[09-Plano-Stacks-e-Versoes]] §3 (Rodada 2).

## 8. Links
- Plano: [[09-Plano-Stacks-e-Versoes]] | Extension: [[03-Extension-Design]] | Integrações: [[05-Integracoes-OpenAPI-TS]]
- Fonte externa (verificação): `package.json` do tag `microsoft/vscode` → `devDependencies.electron`; `DEPS` do Electron → `node_version`.
