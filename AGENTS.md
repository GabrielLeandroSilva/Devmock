# AGENTS.md — DevMock

Convenções de trabalho deste repositório (leia junto das instruções globais).

## Projeto
- Monorepo: `packages/core` (@devmock/core), `packages/cli` (devmock-cli), `apps/extension` (devmock-vscode).
- Vault de docs (Obsidian): `DevMock Cerebro/` — PRDs, arquitetura, processos, agentes, gestão. Fonte da verdade de produto.
- Fonte do produto: `DevMock Cerebro/DevMock-Produto-e-Fluxos.md`. Princípio: **Schema é a fonte única da verdade**.

## Git e versionamento
- Branches: `des` (trabalho diário) e `main` (estável, **só via PR** aprovado).
- Tags do monorepo: `vX.Y.Z`. Tag da extension: `ext-vX.Y.Z` — publica via `.github/workflows/publish.yml`, que exige **tag == `apps/extension/package.json.version`**.
- `Log-Versionamento.md` (vault) é atualizado a cada push; commits seguem `tipo(escopo): resumo` (Conventional Commits, PT-BR).

## Kanban (convenção)
- Tasks de **planos a executar entram como `[/]` (In Progress)** no vault — para aparecerem no board do Tasks Kanban como trabalho planejado.
- `[x]` **só** quando o DoD do item estiver cumprido (com evidência: teste verde, gate, etc.). `[ ]` = ainda não priorizado; `[-]` = cancelado/adiado.

## Stacks e versões
- Node **≥ 22** (`.nvmrc` = `24`). Node 20 está **EOL** desde abr/2026.
- A extension roda no **Node embutido no VS Code**, não no Node de build: `esbuild target` e `engines.vscode` andam juntos (hoje `node22` ↔ VS Code `^1.101`). `@types/vscode` deve ser ≤ `engines.vscode`.
- `@types/node` = Node **mínimo** suportado (hoje `^22`).
- Upgrades e **mapa de impacto**: `DevMock Cerebro/02-Arquitetura/06-Stacks-e-Versoes.md`.

## Qualidade (antes de promover)- Bateria: `npm run build` + `tsc --noEmit` (core/cli/extension) + suítes (core/cli/host) verdes.
- Core tem **gate de cobertura** (`packages/core/vitest.config.ts`): stmts/lines/funcs ≥ 90, branch ≥ 80.
- Regressão rastreável: bugs por **ID `AUD-xx`** (catálogo no `Agente-Auditor`) com teste nomeado `it('AUD-xx — …')`. Aceites de PRD cobertos (matriz em `07-Estrategia-Testes`).

## Agentes (vault `DevMock Cerebro/04-Prompts-Agentes`)
- **Auditor** (acha bugs + catálogo AUD) · **QA-Testes** (dono das suítes/CI/cobertura; subagente `.opencode/agent/qa-testes.md`) · **Code-Reviewer** (revisão read-only de diff/PR em 2 eixos; subagente `.opencode/agent/code-reviewer.md`) · **DevOps** (CI/CD e release enxuto; subagente `.opencode/agent/devops-automator.md`) · **Coder-TS** (implementa) · **Git-Guardião** (versão/tag/PR) · **Docs-Keeper** (mantém README + wiki) · **Technical-Writer** (conteúdo/clareza/tutoriais; subagente `.opencode/agent/technical-writer.md`) · **PRD-Writer** · **LinkedIn**.

## Documentação pública
- README (raiz + `apps/extension`) e a wiki (`Devmock.wiki.git`) são espelhos do produto — mantidos pelo **Docs-Keeper** a cada release.
- Nada é inventado: toda afirmação vem de código/PRD/CHANGELOG.

## Testes no host VS Code (F5)
- `apps/extension/.vscode/tasks.json` roda `npm run build:host` (builda core + extension via **npm**; não usa yarn).
