# Changelog — DevMock (extension)

Formato [Keep a Changelog](https://keepachangelog.com/). Versões da extension são independentes das tags do monorepo.

## [1.2.0] — 2026-10-17 — Painel de controle + Detect + HTML docs
### Added
- **Tree UX**: editar `errorRate` direto na Settings; cenário ativo visível no **Schema** e em cada **Endpoint**; clique num endpoint **GET** abre a rota no navegador; botões inline **Start/Stop** (ícones) no nó Mock Server
- **Detect from project**: `Create API… → Detect` analisa `src/` (interfaces/tipos TS → Schemas; chamadas `api/axios/fetch` → endpoints), com multi-seleção e avisos do que não mapeou
- **HTML docs**: `Export Contract` e `devmock export` geram `docs/index.html` (página única, âncoras, CSS inline, offline) — agora **6 artefatos**
### Changed
- CLI `export` passa a gravar `docs/index.html`; `.hashes.json` ganhou o artefato `html`

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
