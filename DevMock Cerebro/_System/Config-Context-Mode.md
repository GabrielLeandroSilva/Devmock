---
title: "Configuração Context-Mode"
type: gestao
status: aprovado
fase: 0
tags: [devmock/config, devmock/context]
related: ["[[00-Home]]"]
created: 2026-10-12
updated: 2026-10-12
---

# Configuração — Context-Mode (índice FTS5 do projeto)

CLI global `context-mode` (MCP server stdio + índice FTS5 + hooks). Storage fora do repo (`AppData/Roaming/opencode/context-mode/`) — nada para gitignorar.

## Estado (2026-10-12)
- `doctor`: PASS (plataforma OpenCode, FTS5 ok, SessionStart hook ok, plugin habilitado)
- `upgrade`: executado (plugin reinstalado v1.0.169)
- Plugin ativo em `~/.config/opencode/opencode.jsonc` → `"plugin": ["context-mode"]`
- Índice do repo: **86 arquivos / 281 seções** (`.ts` do código + `.md` do vault; `node_modules/dist/.smart-env` fora via `.gitignore`)

## Reindexar após mudanças grandes
```powershell
context-mode index "C:\Users\DELL\Documents\DevMock" --include "**/*.ts" --include "**/*.md"
```

## Buscar
```powershell
context-mode search "sua pergunta" --project "C:\Users\DELL\Documents\DevMock"
```

## Peculiaridades descobertas
- `--ext .ts,.md` (vírgula) indexa **0 arquivos** — usar `--include` repetido ou `--ext` único.
- `--ext` repetido só vale o último — não acumula.
- Cada `index` com path/projeto diferente cria um DB separado (verificado: busca usa `--project` = cwd por padrão).
