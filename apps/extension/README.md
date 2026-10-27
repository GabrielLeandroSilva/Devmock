# DevMock — API Contract & Mocking for Front-end

> Build your frontend without waiting for the backend.

Define o contrato uma vez e use-o para desenvolver, testar, documentar, compartilhar e validar a API. O Schema é a fonte única da verdade — dele nascem o mock local, os dados realistas (incluindo brasileiros: CPF, CNPJ, CEP, PIX), a documentação, o OpenAPI e os tipos TypeScript.

## Começo rápido (5 min)

1. Abra seu projeto e rode **DevMock: Initialize Project** (ou `devmock init`).
2. **DevMock: New Schema…** (ou `Create API → From scratch`) — crie o model `User`.
3. **DevMock: Start Mock Server** → `🟢 http://localhost:4010`.
4. Aponte sua `baseURL` para `http://localhost:4010` e desenvolva. Sem backend.

## Comandos

| Paleta (`Ctrl+Shift+P` → `DevMock: …`) | O que faz |
|---|---|
| Initialize Project | Cria `.devmock/` versionável |
| New Schema… / Edit Schema… | Studio: edita campos, preview com seed, salva |
| Create API… | From scratch, Import OpenAPI ou Detect from project |
| Import OpenAPI… | Gera Schemas de `openapi.yaml/json` |
| Generate / Save Fake Data… | Preview ou salva em `docs/examples/` |
| Start / Stop Mock Server | Sobe/derruba `:4010`; Stop mostra o request log |
| Switch Scenario… | Default, Empty, 401/403/500/429, Slow — sem restart |
| Export Contract… | OpenAPI JSON+YAML, JSON Schema, `types.ts`, Markdown, HTML |
| Validate Real API… | Compara a API real com o contrato (Compatible/Warning/Breaking) |
| Show Request Log | Método, rota, status, ms, cenário e bodies (truncados em 1KB) |
| Ações (header da Tree) | Concentra os comandos na Tree, conforme o estado (sem projeto, sem Schema, parado/rodando) |

Na Tree, o botão **Ações** concentra os comandos; clique num **cenário** para aplicá-lo a um ou mais Schemas.

CLI equivalente: `devmock init|start|generate|export|import|validate` (pacote `devmock` em breve no npm).

Cenário só numa chamada: `?scenario=Empty` ou header `X-Mock-Scenario: Forbidden` (precedência request > ativo > Default).

## Requisitos

VS Code `^1.101.0`. Sem telemetria, 100% local, tudo em arquivos versionáveis.

## Roadmap

Próximas versões: [Roadmap](https://github.com/GabrielLeandroSilva/Devmock/wiki/Roadmap) · histórico: [Versões](https://github.com/GabrielLeandroSilva/Devmock/wiki/Vers%C3%B5es) e [Correções](https://github.com/GabrielLeandroSilva/Devmock/wiki/Corre%C3%A7%C3%B5es).

Última versão: **v1.4.0** — botão **Ações** na Tree e cenário aplicado por clique nos Schemas (mouse-first).

- **v1.5.0 (planejado):** mapa de rotas por Schema (inclui ações custom) e POST/PATCH/DELETE na Tree (cenário/cURL)

## Links

- Repositório e docs vivas: [GabrielLeandroSilva/Devmock](https://github.com/GabrielLeandroSilva/Devmock)
- Wiki: [guia completo](https://github.com/GabrielLeandroSilva/Devmock/wiki)
- Issues: [reportar bug](https://github.com/GabrielLeandroSilva/Devmock/issues)
