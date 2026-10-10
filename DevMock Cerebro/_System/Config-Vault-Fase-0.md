---
title: "Configuração do Vault — Fase 0"
type: gestao
status: revisao
fase: 0
tags: [devmock/config]
related: []
created: 2026-10-10
updated: 2026-10-10
---

# Configuração do Vault — Fase 0

Checklist manual (1 min no Obsidian desktop):

## Templater
1. Configurações → Templater → Template folder location: `_Templates`
2. Ative `Trigger Templater on new file creation` = OFF (evita loop com Daily Notes)
3. Teste: crie nota em `01-PRDs/` → `Ctrl+P` → `Templater: Insert template` → `T-PRD`

## Dataview
1. Configurações → Dataview → Enable JavaScript Queries = OFF (só DQL na Fase 0)
2. Abra [[00-Home]] em modo leitura para validar as tabelas.

## Tasks
1. Configurações → Tasks → Status + datas curtas. Padrão usado: `⏫ 🔼 🔽 📅 🏷️`
2. Valide em [[Indice-Gestao]].

## Smart Connections
1. Abra `Smart Connections: View settings`
2. Exclua: `_Templates, 99-Anexos, .obsidian`
3. Clique `Restart Smart Connections` após Fase 1 para indexar os PRDs.

## Daily Notes (core plugin, opcional)
- Sugestão: pasta `05-Gestao-Projeto/Diario/` + template `T-Task-Note` se quiser log diário.

> Após conferir, marque Fase 0 como `aprovado` no frontmatter de [[00-Home]] e avance para Fase 1.
