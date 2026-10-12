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

## Comandos

### CLI (`devmock`)

| Comando | O que faz |
|---------|-----------|
| `devmock init [dir]` | Cria `.devmock/{config.json,schemas/,scenarios/,docs/,openapi/}` (idempotente; não apaga o existente) |
| `devmock start [dir]` | Sobe o Mock Server na porta do `config.json` (padrão `4010`); valida Schemas e ignora os inválidos com aviso |

### Extension (paleta `Ctrl+Shift+P` → `DevMock: …`)

| Comando | O que faz |
|---------|-----------|
| Initialize Project | Igual ao `init`, dentro do VS Code |
| Start / Stop Mock Server | Sobe/derruba o server; Stop mostra o request log |
| New Schema… | Abre o Studio: edita campos, preview com seed e salva em `schemas/` |
| Generate / Save Fake Data… | Preview em aba ou salva em `docs/examples/<model>.json` |
| Switch Scenario… | Troca o cenário do endpoint **sem restart** |
| Export Contract… | Gera OpenAPI JSON/YAML, JSON Schema, `types.ts` e Markdown |
| Show Request Log | Exibe método, rota, status, ms e cenário |
| Refresh View | Recarrega a Tree |

## Exemplo de ponta a ponta

```bash
# 1. Inicializa e cria um Schema
node packages/cli/bin/devmock.js init demo
# (crie demo/.devmock/schemas/user.json — veja o exemplo abaixo)

# 2. Sobe o mock
node packages/cli/bin/devmock.js start demo
# DevMock 🟢 http://localhost:4010

# 3. Usa como se fosse a API real
curl "http://localhost:4010/users?page=1&limit=5"
curl -X POST http://localhost:4010/users -H "Content-Type: application/json" -d "{}"

# 4. Testa o estado vazio sem restart: em
#    demo/.devmock/config.json, defina
#    "activeScenarios": { "GET /users": "Empty" }
#    ...e recarregue (a extension aplica via reload; no CLI, reinicie)
curl http://localhost:4010/users
# {"data":[],"total":0}
```

`demo/.devmock/schemas/user.json` mínimo:

```json
{
  "name": "User",
  "fields": [
    { "name": "id", "type": "uuid", "required": true },
    { "name": "name", "type": "string", "generator": "br.nome" },
    { "name": "cpf", "type": "string", "generator": "br.cpf" }
  ]
}
```

## Branches e versões

- `des` — desenvolvimento diário · `main` — estável, só via Pull Request (ruleset ativo, sem bypass)
- Tags por entrega (`v0.x`); `v1.0.0` = MVP com manual de teste 100% ✅. Histórico em `DevMock Cerebro/05-Gestao-Projeto/Log-Versionamento.md`.
