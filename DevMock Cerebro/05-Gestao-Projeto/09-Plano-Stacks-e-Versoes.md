---
title: "Plano de Stacks e Versões (Node + deps)"
type: gestao
status: aprovado
fase: codigo
tags: [devmock/gestao, devmock/infra]
related: ["[[06-Stacks-e-Versoes]]", "[[08-Plano-Release-v1.2.0]]", "[[07-Estrategia-Testes]]"]
created: 2026-10-17
updated: 2026-10-17
---

# Gestão — 09 Plano de Stacks e Versões

## 1. Objetivo
Tirar o projeto de stacks **EOL** (Node 20 EOL desde abr/2026 — ver [[06-Stacks-e-Versoes]]) e manter a toolchain atualizada com risco controlado. Duas rodadas: **R1 (Node + alinhamentos)** e **R2 (majors de dependências)**, cada uma em PR próprio.

## 2. Rodada 1 — Node (build/CI/CLI) + runtime da extension
| Item | Descrição | Arquivos |
|------|-----------|----------|
| R1.1 | `engines.node >=22` + `.nvmrc` (`24`) | `package.json`, `.nvmrc` |
| R1.2 | CI matrix `[22,24]`; integração `24`; publish `24` | `.github/workflows/ci.yml`, `publish.yml` |
| R1.3 | Runtime extension: `esbuild target node22`, `engines.vscode ^1.101`, `@types/vscode ~1.101` | `apps/extension/scripts/bundle.js`, `apps/extension/package.json` |
| R1.4 | `@types/node ^22` em core/cli/extension (tipos = Node mínimo) | 3 `package.json` |
| R1.5 | Doc [[06-Stacks-e-Versoes]] + roadmap "futuro: Node 24" + AGENTS | vault, wiki, README |
| R1.6 | Gate (build/tsc/suítes/host/`vsce package`) + tag | — |

> **Por que `engines.vscode ^1.101`:** VS Code 1.101 é o primeiro com Electron 35 → **Node 22.15**. Antes disso (1.100) é Electron 34 → Node 20.19. Detalhe no [[06-Stacks-e-Versoes]].

## 3. Rodada 2 — Majors (depois)
Cada major em PR próprio, com suíte completa + host.

| Item | De → Para | Observação |
|------|-----------|------------|
| R2.1 | TypeScript 5.9 → **7.0** | revisar tsconfig/NodeNext/emit |
| R2.2 | vitest/coverage 2.1 → **5** | config, provider, thresholds |
| R2.3 | esbuild 0.21 → **0.28** | target/format/sourcemaps |
| R2.4 | mocha 10 → **12** + `@vscode/test-electron` 2 → **3** | runner do host |
| R2.5 | `@vscode/vsce` 3 → **4** | packaging/PAT |
| R2.6 | glob 10 → **13** | import/engine |
| R2.7 | Gate + tag | — |

## 4. Ordem recomendada
1. **R1 agora** (EOL, baixo risco).
2. **R2 em seguida**, antes das features da Fase 2 (evita retrabalho de testes). Se R2 demorar, entregar R1 + majors seguras e tratar TS 7/vitest 5 em janela dedicada.
3. Fase 2 (W1–W3) sobre a baseline já atualizada.
4. **Futuro:** mínimo **Node 24** (quando 22 entrar em EOL — abr/2027) → [[06-Stacks-e-Versoes]].

## 5. Tasks
- [x] #task ⏫ R1.1 — `engines.node >=22` + `.nvmrc` 🏷️ fase/codigo
- [x] #task ⏫ R1.2 — CI `[22,24]` + integração/publish `24` 🏷️ fase/codigo
- [x] #task ⏫ R1.3 — esbuild `node22` + `engines.vscode ^1.101` + `@types/vscode` 🏷️ fase/codigo
- [x] #task ⏫ R1.4 — `@types/node ^22` (core/cli/extension) 🏷️ fase/codigo
- [x] #task 🔼 R1.5 — doc stacks + roadmap "Node 24" + AGENTS 🏷️ fase/codigo
- [x] #task ⏫ R1.6 — Gate + tag 🏷️ fase/codigo
- [x] #task 🔼 R2.1 — TypeScript 7 🏷️ fase/codigo
- [x] #task 🔼 R2.2 — vitest 5 + coverage 🏷️ fase/codigo
- [x] #task 🔼 R2.3 — esbuild 0.28 🏷️ fase/codigo
- [x] #task 🔼 R2.4 — mocha 12 + test-electron 3 🏷️ fase/codigo
- [x] #task 🔼 R2.5 — vsce 4 🏷️ fase/codigo
- [x] #task 🔼 R2.6 — glob 13 🏷️ fase/codigo
- [x] #task ⏫ R2.7 — Gate + tag 🏷️ fase/codigo

## 6. Riscos
- **R1.3** eleva o mínimo de VS Code para 1.101 (deixa de instalar em versões anteriores). Aceitável: produto recém-lançado.
- **R2** contém majors de alto impacto (TS 7, vitest 5) — por isso faseado e em PRs separados.
- `@types/node` desalinhado (core em 26) mascarava uso de APIs > Node mínimo — corrigido no R1.4.

## 7. Links
- Detalhe/impacto: [[06-Stacks-e-Versoes]] | Qualidade: [[07-Estrategia-Testes]] | Release: [[08-Plano-Release-v1.2.0]]
