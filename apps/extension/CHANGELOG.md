# Changelog — DevMock (extension)

Formato [Keep a Changelog](https://keepachangelog.com/). Versões da extension são independentes das tags do monorepo.

## [1.1.1] — 2026-10-17 — Patch: Stop rápido
### Fixed
- **Stop do Mock Server** não demora mais ~5s: `close()` passou a encerrar as conexões **keep-alive** (navegador/`fetch`) imediatamente — `server.closeAllConnections()` (AUD-16)

## [1.1.0] — 2026-10-17 — Cenários completos + observabilidade
### Added
- Switch Scenario agora expõe os **7 cenários** embutidos (inclui **Forbidden 403** e **Rate Limited 429**); nomes vêm de uma fonte única no Core (`SCENARIO_NAMES`)
- **`errorRate`** (0–100) em `config.json` e por endpoint: injeta falhas 500 de forma determinística por seed; cenário ativo tem precedência; valor visível em Settings
- **Request log com body**: `Show Request Log` mostra request e response (truncados em 1KB, com marca `…(truncado)`)
### Fixed
- **staleDetector por artefato**: um export parcial não marca mais os demais artefatos como sincronizados
- **CLI `export`** agora grava `.hashes.json` (paridade com a extension)

## [1.0.0] — 2026-10-15 — Lançamento Marketplace
### Added
- Studio: criar/editar Schema com preview, CSP estrito, auto-preview
- Mock Server local com cenários sem restart, request log, erros padrão
- Generate/Save Fake Data (incluindo geradores `br.*` e CNPJ alfanumérico)
- Create API (From scratch + Import OpenAPI), Export Contract (5 artefatos + stale), Validate Real API
- TreeView do projeto, watcher com debounce, comandos via paleta
