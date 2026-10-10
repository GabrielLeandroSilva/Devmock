---
title: "Índice Prompts e Agentes"
type: moc
status: revisao
fase: 3
tags: [devmock/indice]
related: []
created: 2026-10-10
updated: 2026-10-10
---

# Índice — Prompts e Agentes

## Specs

```dataview
TABLE status AS Status, modelo-sugerido AS Modelo
FROM "04-Prompts-Agentes"
WHERE type = "prompt"
SORT file.name ASC
```

## Agentes

```dataview
TABLE status AS Status
FROM "04-Prompts-Agentes"
WHERE type = "agente"
SORT file.name ASC
```

Templates: `T-Prompt-Spec` e `T-Agente`. Biblioteca em `04-Prompts-Agentes/Biblioteca-Prompts/`.
