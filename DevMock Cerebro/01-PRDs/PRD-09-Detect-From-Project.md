---
title: "PRD-09 Detect From Project"
type: prd
status: revisao
fase: 3
tags: [devmock/pos-mvp, devmock/detect]
related: ["[[PRD-01-Core-Schema-Data]]", "[[PRD-03-VSCode-Extension]]", "[[PRD-06-Import-OpenAPI]]", "[[08-Plano-Release-v1.2.0]]"]
created: 2026-10-17
updated: 2026-10-17
---

# PRD-09 — Detect From Project (EAP 2.4)

> Deriva de: [[DevMock-Produto-e-Fluxos]] §20. Quando não há `openapi.*` nem disposição para redigitar, a Extension lê o **próprio código** e sugere Schemas/endpoints. Detect **propõe**; o Schema continua a fonte da verdade.

## 1. Contexto e Problema
O fluxo de adoção trava quando o dev já tem um projeto sem contrato formal: ninguém quer digitar 10 modelos à mão no Studio. O §20 descreve a detecção automática — varrer `src/` (services, api, types, models, hooks), achar `interface User {…}` e chamadas como `api.get('/users')`, e **sugerir** criar o Schema/endpoint. É o caminho de "1 clique" para o nível Simples.

## 2. Personas
- [x] Front-end (projeto existente, sem OpenAPI — quer mock rápido)
- [x] Full Stack (quer o contrato extraído do código que já escreveu)
- [ ] Backend (já é coberto pelo [[PRD-06-Import-OpenAPI]])

## 3. Escopo
### Dentro (v1.2.0)
- Varredura do workspace por `.ts/.tsx/.js/.jsx` sob `src/**` (extensível a outros diretórios por config)
- **Interfaces/tipos TS** de nível superior → candidatos a **Schema** (campos, `?` → opcional, tipos mapeados)
- **Chamadas HTTP** reconhecidas → candidatos a **Endpoint**: `api.<m>('…')`, `axios.<m>('…')`, `fetch('…')`, `<m>` ∈ {get,post,put,patch,delete}
- UI: `QuickPick` **multi-seleção** com prévia (nº de campos / método+rota); **nada é criado sem confirmação**
- Criação: `schemas/<model>.json` validado por `validateSchema`; **pula existentes** (nunca sobrescreve sem confirmação explícita)
- Lacunas em `warnings[]` (unions complexas, genéricos, tipos importados não resolvidos, interfaces aninhadas) — **nunca inventar campo**
- Comando único: `DevMock: Create API… → Detect from project` (substitui o placeholder "em breve" da PRD-03 RF-06)

### Fora (futuro)
- Inferência em runtime / código compilado (`dist/`)
- Frameworks específicos (decorators Nest, graphql), resolução de tipos por import cruzado
- Merge incremental com Schemas já editados
- Detecção a partir de Postman/Insomnia no repo

## 4. Requisitos Funcionais
| ID | Requisito | Prioridade | Origem |
|----|-----------|------------|--------|
| RF-01 | Varrer `src/**` (`.ts/.tsx/.js/.jsx`) ignorando `node_modules`, `dist`, `out`, `coverage`, `test` | Must | §20 |
| RF-02 | Detectar `interface`/`type` de nível superior → candidatos a Schema (tipos mapeados; `?` = opcional) | Must | §20 |
| RF-03 | Detectar chamadas `api/axios/fetch.<m>('…')` → candidatos a Endpoint (método + rota) | Must | §20 |
| RF-04 | `QuickPick` multi-seleção com prévia; **nada criado sem confirmação** | Must | §20 |
| RF-05 | Criar `schemas/<model>.json` validando via `validateSchema`; pular existentes | Must | PRD-01 |
| RF-06 | Lacunas em `warnings[]` (path + motivo); nunca inventar campo | Must | SPEC |
| RF-07 | Comando `Create API… → Detect` habilitado (remove "em breve") | Must | PRD-03 RF-06 |
| RF-08 | Idempotente: mesmo projeto → mesmos candidatos; rodar 2× não duplica | Must | — |

## 5. Requisitos Não-Funcionais
- Varredura de projeto médio (<5.000 arquivos) em <3s local
- Extension fina: detecção em módulo puro (`detect.ts`, sem `vscode`) — testável no host (ops-style)
- Zero rede; 100% local

## 6. Regras de Negócio
- Detect **propõe**; a decisão é do dev (multi-seleção). O Schema criado é editável como qualquer outro
- Mapeamento de tipos TS → Schema: `string`→string, `number`→number, `boolean`→boolean, `Date|string` (ISO)→`date`/`datetime`, união de literais (`'A'|'B'`)→`enum`
- `BRL` **nunca** é inferido
- Todo Schema precisa de **≥1 campo required** (PRD-01 §6): se a interface não tiver nenhum, marcar o primeiro campo como `required` **e** registrar warning
- Rotas do mock continuam derivadas do **Schema** (PRD-02) — endpoints detectados só garantem que o Schema correspondente exista

## 7. Critérios de Aceite
- [x] #task ⏫ Fixture com `interface User/Order` detecta os 2 modelos, com tipos e opcionais corretos 🏷️ fase/codigo
- [x] #task ⏫ Fixture com `api.get('/users')` + `axios.post('/orders')` detecta os endpoints 🏷️ fase/codigo
- [x] #task ⏫ Nada é criado sem confirmação; rodar 2× não duplica (`schemas/` inalterado na 2ª) 🏷️ fase/codigo
- [x] #task 🔼 Tipos não mapeáveis viram `warnings[]`, nunca campo inventado 🏷️ fase/codigo
- [x] #task 🔼 `Create API… → Detect` deixa de exibir "em breve" 🏷️ fase/codigo

## 8. Riscos e Dependências
- **Falsos positivos:** chamadas dinâmicas (`api.get(path)`) e proxies não são detectáveis — heurística conservadora + revisão humana na seleção
- **Variedade de estilos** (`http.get`, `request({url})`, instância custom): começar pelos 3 padrões do §20; expandir por feedback
- Depende de PRD-01 (formato/validator) e da PRD-03 (ponto de entrada)
- Extração de tipos é por arquivo (sem resolução de import) → limites documentados em `warnings[]`

## 9. Links
- Arquitetura: [[01-Core-Model]] · [[03-Extension-Design]]
- PRDs: [[PRD-01-Core-Schema-Data]] · [[PRD-03-VSCode-Extension]] · [[PRD-06-Import-OpenAPI]]
- Release: [[08-Plano-Release-v1.2.0]] | QA: [[07-Estrategia-Testes]]
