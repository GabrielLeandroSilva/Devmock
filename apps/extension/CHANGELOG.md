# Changelog — DevMock (extension)

Formato [Keep a Changelog](https://keepachangelog.com/). Versões da extension são independentes das tags do monorepo.

## [1.5.0] — 2026-11-02 — Rotas completas: mapa por Schema + POST/PUT/PATCH/DELETE
### Added
- **Rotas por Schema** (`routes`): cada Schema declara `method`/`path`/`kind`/`response`/`summary`; ausente = CRUD padrão (`/users`, `/users/:id`). `kind`: `list`, `item`, `create`, `update`, `patch`, `delete`, `custom`
- **Router por método/pattern**: `:param`, estático vence param, alias singular e rotas aninhadas (`/v1/users`); rotas validadas no start
- **Semântica completa**: PUT substitui (id imutável), PATCH faz merge; JSON inválido/não-objeto → 400 `INVALID_JSON`; DELETE em coleção → 405 com `Allow`; `custom` usa `response`; POST 201 com `Location` exposto no CORS
- **Tree e Ações por endpoint**: POST/PUT/PATCH/DELETE/custom com menu de cenário, cURL e abrir no browser (GET sem `:param`); `Switch Scenario` lista todas as rotas e aplica por método
- **Studio de rotas**: “Customizar rotas”, tabela método/path/kind/status/body, adicionar/remover/restaurar CRUD, `summary` e resposta custom
- **Export e validate por rota**: OpenAPI/MD/HTML com todas as rotas, `summary`, params, requestBody e resposta custom (204/304 sem body); `validate` usa a rota `kind: list` e **pula com aviso** quando não há list
### Changed
- **Export** deixa de assumir só o CRUD padrão: OpenAPI/MD/HTML refletem `Schema.routes`
- **Switch Scenario** lista todas as rotas (não só `GET /<plural>`); a Tree mostra o cenário por endpoint
- Chaves de rota usam o **pattern canônico em minúsculas** na UI/CLI (`GET /v1/users`); a resolução segue case-insensitive
### Fixed
- `validate` não gera mais falso positivo em coleção aninhada/custom: escolhe a rota `kind: list` não aninhada e pula o que não é coleção

## [1.4.0] — 2026-10-21 — Mouse-first: Ações + cenário por clique
### Added
- **Botão Ações** no header da Tree: QuickPick agrupado com os comandos (Init, New/Edit Schema, Create API, Import, Generate/Save, Export, Validate, Start/Stop, Switch Scenario, Set Error Rate, Show Log, Refresh). Os itens refletem o estado: sem `.devmock/` só Initialize+Refresh; sem Schema esconde as ações que dependem dele; rodando mostra Stop e Show Log
- **Cenário por clique**: clique num cenário → multi-seleção de **Schemas** → aplica o cenário no `GET` de coleção de cada um, sem restart; a Tree mostra `✓` e `N schema(s)`
### Changed
- **New Schema** saiu do header da Tree e passou a viver no botão **Ações** (Refresh e Start/Stop continuam no header)
- O `✓` do nó de cenário agora usa a mesma contagem da rota de coleção exibida no Schema

## [1.3.0] — 2026-10-20 — Cenário por requisição + Detect ampliado
### Added
- **Cenário por requisição**: force `Empty`, `Forbidden`, `Server Error`, etc. **sem trocar o cenário global** — `GET /users?scenario=Empty` ou header `X-Mock-Scenario: Forbidden`. Precedência **request > ativo > Default**; cenário desconhecido cai no ativo (nunca quebra); CORS libera o header
- **Detect ampliado**: reconhece `http`, `https`, `httpClient`, `client`, `ky`, `got` e `request`; métodos genéricos (`http.get<User[]>('/users')`); config-object (`axios({ url, method })`, `request({ url })`); `fetch(url, { method })`; e normaliza base em template/URL absoluta (`${BASE}/users` → `/users`)
### Changed
- **Tree**: `getChildren` passou a delegar a um builder puro (`tree.ts`) — mesmo comportamento, agora coberto por testes no host
### Internal
- Cobertura do **CLI** medida via **c8** (`NODE_V8_COVERAGE`) com gate no CI (`coverage-cli-nodeXX`); a medição in-process anterior era 0%

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
