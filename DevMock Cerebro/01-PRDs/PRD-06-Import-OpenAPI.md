---
title: "PRD-06 Import OpenAPI"
type: prd
status: revisao
fase: 3
tags: [devmock/pos-mvp, devmock/import]
related: ["[[PRD-01-Core-Schema-Data]]", "[[BPM-03-Import-OpenAPI]]", "[[SPEC-Prompt-OpenAPI-Importer]]"]
created: 2026-10-12
updated: 2026-10-12
---

# PRD-06 — Import OpenAPI (EAP 2.1)

> Deriva de: [[DevMock-Produto-e-Fluxos]] §§ 18–19. Fluxo inverso: Backend entrega `openapi.yaml/json` → DevMock gera Schemas + mock.

## 1. Contexto e Problema
Quando o backend já existe (ou o contrato nasce lá), o front precisa do mock sem redesenhar tudo no Studio. O import converte a especificação em Schemas versionáveis.

## 2. Personas
- [x] Front-end (importa contrato do backend e ganha mock imediato)
- [x] Backend (entrega o `openapi.*` que já tem)

## 3. Escopo
### Dentro (v1.3.0)
- Entradas: objeto OpenAPI, string JSON ou string YAML (YAML via SwaggerParser)
- `$refs` resolvidos (internos; remotos = warning, não erro)
- `components.schemas` → `schemas/*.json` (tipos, required, enum, formatos date/uuid/email como hints de generator)
- Objetos inline aninhados → Schemas `PaiFilho` (determinístico); o que não mapear 1:1 vira `warnings[]`, nunca invenção
- `paths` usados só para aviso de cobertura (rotas sem Schema correspondente); rotas do mock continuam geradas por Schema (PRD-02)
- CLI `devmock import <arquivo>` + comando `DevMock: Import OpenAPI…` (file picker → grava em `schemas/`)

### Fora (futuro)
- `webhooks`, `callbacks`, `discriminator`/`oneOf` (vira warning)
- Import incremental/merge com Schemas editados (sobrescreve com confirmação)

## 4. Requisitos Funcionais
| ID | Requisito | Prioridade | Origem |
|----|-----------|------------|--------|
| RF-01 | Aceitar objeto, JSON string e YAML string | Must | §19 |
| RF-02 | Resolver `$ref` internos via dereference | Must | §19 |
| RF-03 | Mapear tipos/formatos/enum/required fielmente | Must | §19 |
| RF-04 | Lacunas em `warnings[]` com path + motivo (nunca inventar campo) | Must | SPEC |
| RF-05 | CLI `import` grava `schemas/<model>.json` (pergunta antes de sobrescrever via flag `--force`) | Must | §19 |
| RF-06 | Extension: file picker → importa → refresh da Tree | Should | §19 |

## 5. Requisitos Não-Funcionais
- Import de spec médio (<200 paths) em <5s local
- Schemas gerados passam em `validateSchema` sem erros

## 6. Regras de Negócio
- Fonte continua sendo `schemas/` — import é ponto de partida, não sync contínuo
- `format: date/datetime/uuid` viram hints de `generator` (`date`, `datetime`, `uuid`); `email` idem
- `BRL` nunca é inferido (só existe se o usuário declarar)

## 7. Critérios de Aceite
- [ ] #task ⏫ Fixture com User+Order ($refs, enum, required) importa sem warnings 🏷️ fase/codigo
- [ ] #task ⏫ `oneOf` + `$ref` remoto geram warnings, não erro 🏷️ fase/codigo
- [ ] #task ⏫ Schemas importados validam limpo e geram mock funcional 🏷️ fase/codigo
- [ ] #task 🔼 CLI import grava arquivos; sem `--force` não sobrescreve 🏷️ fase/codigo

## 8. Riscos e Dependências
- Depende de PRD-01 (formato de Schema) e do validator como rede de segurança
- SwaggerParser passa a dependência de runtime (era devDep) — aceito pelo ADR-003 (a criar se preciso)

## 9. Links
- Processo: [[BPM-03-Import-OpenAPI]] | SPEC: [[SPEC-Prompt-OpenAPI-Importer]] | Arquitetura: [[01-Core-Model]]
