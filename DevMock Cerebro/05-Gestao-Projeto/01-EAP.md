---
title: "EAP — Estrutura Analítica do Projeto"
type: gestao
status: revisao
fase: 4
tags: [devmock/gestao, devmock/eap]
related: ["[[00-Project-Charter]]", "[[03-MVP-Scope]]", "[[06-Plano-Release-v1.1.0]]"]
created: 2026-10-11
updated: 2026-10-11
---

# Gestão — 01 EAP

## 1. Objetivo
Decompor o MVP até pacotes de trabalho auditáveis (cada pacote = 1 PRD ou 1 entrega testável).

## 2. Detalhamento
```text
1. DevMock MVP (v1.0.0)
├── 1.1 Core Schema + Fake Data (PRD-01)
│   ├── 1.1.1 schemaStore + validator (tipos, required, enum, ref)
│   ├── 1.1.2 dataGenerator com seed determinístico
│   └── 1.1.3 registry br.* (11 geradores com DV/formato válido)
├── 1.2 Mock Server (PRD-02)
│   ├── 1.2.1 routeTable CRUD por Schema + envelope paginado
│   ├── 1.2.2 delayMs + requestLog + porta configurável
│   └── 1.2.3 erros padrão (404/401/500 com body)
├── 1.3 VS Code Extension (PRD-03)
│   ├── 1.3.1 Init .devmock/ + TreeDataProvider
│   ├── 1.3.2 SchemaForm (tipos + dropdown br.*)
│   └── 1.3.3 comandos start/stop/generate/export + watcher
├── 1.4 Scenarios (PRD-04)
│   ├── 1.4.1 CRUD de cenário + switch sem restart
│   └── 1.4.2 Default/Empty/401/500/Slow
├── 1.5 Docs + Export (PRD-05)
│   ├── 1.5.1 mdBuilder + tsBuilder + openapiBuilder
│   └── 1.5.2 comando Export Contract (5 artefatos)
└── 1.6 Docs do vault (este cérebro: fases 0–5) ← estamos aqui
2. Pós-MVP (fora do v1.0.0)
├── 2.1 Import OpenAPI (PRD-06)
├── 2.2 Contract Validation (PRD-07)
└── 2.3 CLI + CI/CD (PRD-08)
3. Pós-v1.x (roadmap de releases)
├── 3.1 v1.1.0 — ✅ fechar Should do MVP: cenários 403/429, errorRate, log com body, staleDetector completo + gate de cobertura → [[06-Plano-Release-v1.1.0]]
├── 3.2 v1.1.1 — patch: Stop lento (AUD-16)
├── 3.3 v1.2.0 — ✅ Tree UX + Detect from project (PRD-09) + HTML docs → [[08-Plano-Release-v1.2.0]]
├── 3.4 Infra — stacks: Node ≥22 (out/2026); futuro mínimo Node 24 → [[06-Stacks-e-Versoes]]
└── 3.5 v1.3.0 — cenários por header/query + testes da UI → [[10-Plano-Release-v1.3.0]]
```

Critério de pacote pronto: aceites do PRD em `aprovado` + testes do Coder verdes + docs exportadas sem diff espúrio.

## 3. Tasks
- [ ] #task ⏫ Validar EAP contra os 5 PRDs (cobertura total, sem órfão) 🏷️ fase/4

## 4. Consulta Tasks (não editar)
```tasks
not done
path includes 05-Gestao-Projeto
sort by priority
```

## 5. Links
- Cronograma: [[02-Cronograma-Fases]] | Riscos: [[04-Riscos]] | Release v1.1.0: [[06-Plano-Release-v1.1.0]]
