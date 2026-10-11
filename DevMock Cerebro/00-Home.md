---
title: "DevMock Cerebro — Home"
type: moc
status: revisao
fase: 0
tags: [devmock/home]
related: []
created: 2026-10-10
updated: 2026-10-10
---

# DevMock Cerebro — Home

> **Build your frontend without waiting for the backend.**
> Fonte da verdade do produto: [[DevMock-Produto-e-Fluxos]] — Schema é a fonte única da verdade.

## Mapa por Fase

- [x] **Fase 0 — Vault pronto** → `v0.1.0` em main
- [x] **Fase 1 — PRDs** → [[Indice-PRDs]] — `01-PRDs/` (`v0.2.0` em main)
- [x] **Fase 2 — Arquitetura + Processos** → [[Indice-Arquitetura]] + [[Indice-Processos]] (`v0.3.2` em main)
- [x] **Fase 3 — Prompts + Agentes** → [[Indice-Prompts-Agentes]] (`v0.4.0` em main)
- [x] **Fase 4 — Gestão (EAP + Cronograma)** → [[Indice-Gestao]] (`v0.5.1` em main)
- [ ] **Fase 5 — Extras + Costura** → `06-Extras/` (`v0.6.0` em `des`, em revisão)

## Status geral (Dataview)

```dataview
TABLE WITHOUT ID file.link AS Nota, type AS Tipo, status AS Status, fase AS Fase
FROM "" 
WHERE type != null AND file.folder != "_Templates"
SORT fase ASC, status ASC
LIMIT 50
```

## PRDs — resumo

```dataview
TABLE WITHOUT ID file.link AS PRD, status AS Status
FROM "01-PRDs"
SORT file.name ASC
```

## Tasks abertas

```tasks
not done
group by filename
sort by priority
limit 30
```

## Convenções
- Idioma: PT-BR, termos técnicos em inglês (`Schema`, `Mock Server`, `Endpoint`, `Seed`).
- Templates: `_Templates/` via Templater. Nunca edite um template diretamente para criar conteúdo — use `Inserir modelo`.
- Frontmatter obrigatório: `title, type, status, fase, tags, related, created, updated`.
- Status: `rascunho → revisao → aprovado`.
- Links: todo PRD linka Arquitetura + Processo + Prompt correspondente.
- Smart Connections: ignora `_Templates/` e `99-Anexos/`.

## Anexos
- Original intacto: [[DevMock-Produto-e-Fluxos]]
