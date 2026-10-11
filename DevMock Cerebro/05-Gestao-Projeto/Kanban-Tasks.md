---
title: "Kanban Tasks"
type: gestao
status: revisao
fase: 4
tags: [devmock/gestao]
related: ["[[02-Cronograma-Fases]]"]
created: 2026-10-11
updated: 2026-10-11
---

# Gestão — Kanban Tasks

> Painel via Tasks plugin + **Tasks Kanban** (instalado, v0.11.0). O board é uma visão viva das `- [ ]` tasks do vault — arrastar o card reescreve o status no arquivo de origem.
>
> Abrir: `Ctrl+P` → **Tasks Kanban: Open board** (padrão) ou **Open saved query…** para um dos boards abaixo.
> Boards salvos (Settings → Tasks Kanban, versionados em `.obsidian/plugins/tasks-kanban/data.json`):
> - **DevMock — Todas** (`group by filename`)
> - **Fase 4 — Gestão** (`path includes 05-Gestao-Projeto`)
> - **Fase 3 — Prompts e Agentes** (`path includes 04-Prompts-Agentes`)
> - **PRDs — Aceites** (`path includes 01-PRDs`)
> Base query global exclui `_Templates/` e `99-Anexos/`.

## A fazer
```tasks
not done
path includes DevMock Cerebro
sort by priority
limit 50
```

## Por fase
```tasks
not done
group by filename
sort by priority
limit 50
```

## Concluídas (auditoria)
```tasks
done
sort by done reverse
limit 20
```
