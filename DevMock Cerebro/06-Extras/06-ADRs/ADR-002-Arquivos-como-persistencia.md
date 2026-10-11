---
title: "ADR-002 Arquivos versionáveis como persistência"
type: adr
status: aprovado
fase: 5
tags: [devmock/adr]
related: ["[[04-Data-Model-devmock]]"]
created: 2026-10-11
updated: 2026-10-11
---

# ADR-002 — Arquivos versionáveis como persistência

## 1. Contexto
Onde guardar Schemas, cenários e configs: banco embarcado (SQLite) ou arquivos?

## 2. Decisão
**Arquivos JSON em `.devmock/`** (1 por Schema/cenário), commitados no repo do usuário.

## 3. Alternativas consideradas
| Alternativa | Prós | Contras |
|-------------|------|---------|
| SQLite embarcado | Consultas, integridade | Binário no Git (diff inútil), migração, dependência nativa |
| Arquivo único `devmock.json` | Simples | Conflito de merge em time |

## 4. Consequências
- Positivas: Git-friendly (princípio), review de contrato em PR, zero migração.
- Negativas: validação de `ref` é por convenção + validador (sem FK real).
- Riscos: arquivos grandes mitigados pelo limite de 50KB no MVP.

## 5. Links
- Arquitetura: [[04-Data-Model-devmock]] | Processo: [[BPM-05-Export-Share-Backend]]
