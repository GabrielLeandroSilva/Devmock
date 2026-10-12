# DevMock — API Contract & Mocking for Front-end

> Build your frontend without waiting for the backend.

Defina o contrato uma vez e use-o para desenvolver, testar, documentar, compartilhar e validar a API. O Schema é a fonte única da verdade.

Documentação viva (PRDs, arquitetura, BPMs, EAP, ADRs, manual de teste): [`DevMock Cerebro`](./DevMock%20Cerebro/00-Home.md) (vault Obsidian).

## O que o MVP (v1.0.0) faz

- **Schema + Fake Data** — modelos tipados com geradores realistas, incluindo brasileiros (`br.cpf`, `br.cnpj` numérico e alfanumérico, `br.cep`, `br.celular`, `br.pix`, BRL como `number`); geração determinística por `seed`
- **Mock Server local** (`:4010`) — CRUD gerado por Schema, paginação `{data,total,page,limit}`, `delayMs`, cenários (Default, Empty, 401/403/500/429, Slow) com troca sem restart, request log
- **VS Code Extension** — TreeView do projeto, `Initialize Project`, formulário de Schema, Generate/Save Fake Data, Switch Scenario, Export Contract, tudo sobre o mesmo Core
- **Export do contrato** — OpenAPI JSON + YAML, JSON Schema, `types.ts` (compila limpo), Markdown
- **CLI** — `devmock init` / `devmock start`

## Layout

```text
packages/core     @devmock/core — schema, validação, fake data, mock server, export
packages/cli      devmock — init/start sobre o Core
apps/extension    devmock-vscode — TreeView, comandos, form, watcher (F5 para depurar)
DevMock Cerebro   vault Obsidian — PRDs, arquitetura, BPMs, EAP, ADRs, manual de teste
```

## Uso rápido

```bash
npm run build --workspaces   # compila core + cli + extension
npm run test --workspaces    # vitest no core (37 testes)

# ou via CLI:
node packages/cli/bin/devmock.js init demo
node packages/cli/bin/devmock.js start demo
# GET http://localhost:4010/users?page=1&limit=5
```

## Branches e versões

- `des` — desenvolvimento diário · `main` — estável, só via Pull Request (ruleset ativo, sem bypass)
- Tags por entrega (`v0.x`); `v1.0.0` = MVP com manual de teste 100% ✅. Histórico em `DevMock Cerebro/05-Gestao-Projeto/Log-Versionamento.md`.
