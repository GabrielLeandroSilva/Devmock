# DevMock — API Contract & Mocking for Front-end

> Build your frontend without waiting for the backend.

Monorepo: `packages/core` (regra de negócio em TS puro) + `apps/extension` (VS Code).
Documentação viva (PRDs, arquitetura, processos, gestão): [`DevMock Cerebro`](./DevMock%20Cerebro/00-Home.md) (vault Obsidian).

## Layout

```text
packages/core     @devmock/core — schema, validação, fake data (br.*), mock server, export
apps/extension    devmock-vscode — TreeView, comandos, init .devmock/
DevMock Cerebro   vault Obsidian — PRDs, arquitetura, BPMs, EAP, ADRs
```

## Scripts

```bash
npm run build --workspaces   # compila core + extension
npm run test --workspaces    # vitest no core
```

## Branches e versões

- `des` — desenvolvimento diário · `main` — estável, só via Pull Request (ruleset ativo)
- Tags `v0.x` por entrega; `v1.0.0` no MVP validado. Histórico em `DevMock Cerebro/05-Gestao-Projeto/Log-Versionamento.md`.
