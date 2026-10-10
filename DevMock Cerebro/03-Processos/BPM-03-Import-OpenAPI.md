---
title: "BPM-03 Import OpenAPI (futuro)"
type: processo
status: rascunho
fase: 3
tags: [devmock/processo, devmock/futuro]
related: ["[[BPM-02-Create-From-Scratch]]"]
created: 2026-10-10
updated: 2026-10-10
---

# Processo — BPM-03 Import OpenAPI (futuro, pós-MVP)

## 1. Objetivo
Gerar Schemas + endpoints + cenários a partir de `openapi.yaml` do backend (§18-19). Stub — detalhar na Fase de PRD-06.

## 2. Passo a passo (resumo)
1. `Import API` → seleciona `openapi.yaml`
2. Core converte paths/components → `schemas/` + endpoints + cenários Default
3. Dev revisa e segue para BPM-04

## 3. Fluxo (Mermaid)
```mermaid
flowchart TD
  A[openapi.yaml] --> B[Import]
  B --> C[Schemas + Endpoints]
  C --> D[BPM-04]
```

## 8. Links
- PRD futuro: PRD-06
