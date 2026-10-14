---
title: "PRD-08 CLI e CI"
type: prd
status: revisao
fase: 3
tags: [devmock/pos-mvp, devmock/cli]
related: ["[[PRD-01-Core-Schema-Data]]", "[[PRD-05-Docs-Export]]", "[[PRD-07-Contract-Validation]]"]
created: 2026-10-14
updated: 2026-10-14
---

# PRD-08 — CLI completo + CI (EAP 2.3)

> Deriva de: [[DevMock-Produto-e-Fluxos]] §27. O Core ganha vida fora do VS Code: pipelines, automação e outros editores.

## 1. Contexto e Problema
Times precisam do mock em CI (subir, testar o front, derrubar) e de export/validate sem abrir o VS Code.

## 2. Personas
- [x] Dev Full Stack / DevOps (pipeline)

## 3. Escopo
### Dentro (v1.6.0)
- `devmock generate <schema> [dir] [--records N] [--seed S] [--out arquivo]` → JSON no stdout ou arquivo
- `devmock export [dir]` → os 5 artefatos em `.devmock/` + `.hashes.json` (mesma regra do comando da extension)
- GitHub Actions `ci.yml`: `npm ci` + build + `tsc` + vitest em push/PR para `main`/`des` (Node 20 + 22)

### Fora (futuro)
- `devmock validate` em modo CI gate com threshold, publicar pacotes no npm, release automation

## 4. Requisitos Funcionais
| ID | Requisito | Prioridade | Origem |
|----|-----------|------------|--------|
| RF-01 | `generate` com records/seed configuráveis, determinístico | Must | §27 |
| RF-02 | `export` gera os 5 artefatos + hashes (paridade com a extension) | Must | §27 + PRD-05 |
| RF-03 | CI verde obrigatório antes do merge (ruleset já exige PR) | Must | §27 |
| RF-04 | Erros com mensagem acionável + exit codes (0 ok, 1 erro) | Must | — |

## 5. Requisitos Não-Funcionais
- CI completo em <5min; sem segredos no repo

## 6. Regras de Negócio
- Mesmas do Core (seed determinístico, BRL number, enum fechado) — CLI não reinventa, só invoca

## 7. Critérios de Aceite
- [ ] #task ⏫ `generate` com seed repete byte a byte; `--out` grava arquivo 🏷️ fase/codigo
- [ ] #task ⏫ `export` gera os 5 artefatos + `.hashes.json` 🏷️ fase/codigo
- [ ] #task ⏫ CI verde no PR (build + tsc + 68 testes) 🏷️ fase/codigo

## 8. Riscos e Dependências
- Depende de Core 1.1/1.5 (generate/export) — só fiação nova

## 9. Links
- EAP: [[01-EAP]] | Cronograma: [[02-Cronograma-Fases]]
