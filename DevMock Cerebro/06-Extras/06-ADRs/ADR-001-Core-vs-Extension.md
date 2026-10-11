---
title: "ADR-001 Core desacoplado da Extension"
type: adr
status: aprovado
fase: 5
tags: [devmock/adr]
related: ["[[00-Visao-Arquitetura]]"]
created: 2026-10-11
updated: 2026-10-11
---

# ADR-001 — Core desacoplado da Extension

## 1. Contexto
Onde mora a regra de negócio: dentro da Extension VS Code ou num Core reutilizável (§28)?

## 2. Decisão
**Core TS puro** (`schemaStore, validator, dataGenerator, mockServer, exporters`) sem importar a API `vscode`; Extension como adaptador fino (TreeView + comandos → Core).

## 3. Alternativas consideradas
| Alternativa | Prós | Contras |
|-------------|------|---------|
| Lógica na Extension | Menos pacotes, início rápido | Trava CLI/CI futuro; teste exige host VS Code |
| Framework embarcado no Mock | Rotas prontas | Dependência extra, boot maior |

## 4. Consequências
- Positivas: CLI/CI reaproveitam 100% do Core; testes vitest puros e rápidos.
- Negativas: contrato interno Core↔Extension precisa de versão desde o dia 1.
- Riscos: Drift mitigado pelo [[Agente-Arquiteto]] revisando mudanças estruturais.

## 5. Links
- Arquitetura: [[00-Visao-Arquitetura]] | PRDs: [[PRD-01-Core-Schema-Data]], [[PRD-03-VSCode-Extension]]
