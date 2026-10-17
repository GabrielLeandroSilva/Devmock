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
| Create API… | From scratch, Import OpenAPI ou (em breve) Detect |
| Import OpenAPI… | Gera Schemas de `openapi.yaml/json` |
| Generate / Save Fake Data… | Preview ou salva em `docs/examples/` |
| Start / Stop Mock Server | Sobe/derruba `:4010`; Stop mostra o request log |
| Switch Scenario… | Default, Empty, 401/403/500/429, Slow — sem restart |
| Export Contract… | OpenAPI JSON+YAML, JSON Schema, `types.ts`, Markdown |
| Validate Real API… | Compara a API real com o contrato (Compatible/Warning/Breaking) |
| Show Request Log | Método, rota, status, ms, cenário e bodies (truncados em 1KB) |

CLI equivalente: `devmock init|start|generate|export|import|validate` (pacote `devmock` em breve no npm).

## Requisitos

VS Code `^1.90.0`. Sem telemetria, 100% local, tudo em arquivos versionáveis.

## Em breve (v1.2.0)

- Editar `errorRate` e ver o cenário ativo direto na Tree; clique em endpoint GET abre no navegador; ícones Start/Stop
- **Detect from project** — criar Schemas a partir do seu código
- **HTML docs** — documentação em página única

Veja o [Roadmap](https://github.com/GabrielLeandroSilva/Devmock/wiki/Roadmap) e o histórico em [Correções](https://github.com/GabrielLeandroSilva/Devmock/wiki/Corre%C3%A7%C3%B5es).

## Links

- Repositório e docs vivas: [GabrielLeandroSilva/Devmock](https://github.com/GabrielLeandroSilva/Devmock)
- Wiki: [guia completo](https://github.com/GabrielLeandroSilva/Devmock/wiki)
- Issues: [reportar bug](https://github.com/GabrielLeandroSilva/Devmock/issues)
