# DevMock — API Contract & Mocking for Front-end

> Build your frontend without waiting for the backend.

Defina o contrato da API uma vez e desenvolva o front sem esperar o backend: mock local, dados realistas (incluindo brasileiros), cenários de erro, documentação, OpenAPI e tipos TypeScript — tudo derivado do Schema.

## Instalação

Na [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=devmock.devmock-vscode): procure **DevMock** na aba Extensions (`Ctrl+Shift+X`) e instale. Sem configuração adicional.

## Começo rápido (5 min)

1. Abra seu projeto e rode `DevMock: Initialize Project` (`Ctrl+Shift+P`).
2. `DevMock: New Schema…` — crie o model `User` (o Studio mostra preview dos dados na hora).
3. `DevMock: Start Mock Server` → `🟢 http://localhost:4010`.
4. Aponte sua `baseURL` para `http://localhost:4010` e desenvolva.

## Comandos (`Ctrl+Shift+P` → `DevMock: …`)

| Comando | O que faz |
|---|---|
| Initialize Project | Cria `.devmock/` versionável no projeto |
| New Schema… / Edit Schema… | Studio: edita campos, preview com seed, salva |
| Create API… | From scratch ou Import OpenAPI |
| Import OpenAPI… | Gera Schemas de `openapi.yaml/json` |
| Generate / Save Fake Data… | Preview em aba ou salva em `docs/examples/` |
| Start / Stop Mock Server | Sobe/derruba `:4010`; Stop mostra o request log |
| Switch Scenario… | Default, Empty, 401/403/500/429, Slow — sem restart |
| Export Contract… | OpenAPI JSON+YAML, JSON Schema, `types.ts`, Markdown |
| Validate Real API… | Compara a API real com o contrato (Compatible/Warning/Breaking) |
| Show Request Log | Método, rota, status, ms e cenário |

Prefere terminal? Há CLI equivalente: `devmock init|start|generate|export|import|validate` (ver `packages/cli`).

## Exemplo

```bash
# com o servidor rodando:
curl "http://localhost:4010/users?page=1&limit=5"
curl -X POST http://localhost:4010/users -H "Content-Type: application/json" -d "{}"
```

Schema mínimo (`.devmock/schemas/user.json`):

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

## Links

- [Wiki — guia completo](https://github.com/GabrielLeandroSilva/Devmock/wiki)
- [Reportar bug](https://github.com/GabrielLeandroSilva/Devmock/issues)
- [Changelog](apps/extension/CHANGELOG.md)

## Desenvolvimento

Este repo é o monorepo (`packages/core`, `packages/cli`, `apps/extension`) + vault Obsidian de docs (`DevMock Cerebro`).Branches: `des` (diário) e `main` (estável, só via PR). Ver `package.json` (scripts `build`/`test`) e `.github/workflows/`.
