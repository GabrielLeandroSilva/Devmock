---
title: "UX UI da Extension"
type: gestao
status: revisao
fase: 5
tags: [devmock/ux]
related: ["[[PRD-03-VSCode-Extension]]", "[[03-Extension-Design]]"]
created: 2026-10-11
updated: 2026-10-11
---

# Extras — 04 UX/UI da Extension (§6)

## Princípios de interface
- **Progressive Complexity:** nível Simples (1 clique até mock) → Avançado (todas as configs) → Power User (arquivos + Git).
- PT-BR na UI; termos técnicos em inglês; erros sempre com arquivo + campo + ação.

## Tree DEV MOCK (alvo)
```text
DEV MOCK
Project
├── Schemas (User, Product, Order)
├── Endpoints (GET /users, POST /users…)
├── Scenarios (✓ Default, Empty, 401, 500, Slow)
├── Documentation
└── Settings
Mock Server 🟢 localhost:4010
REQUEST LOG (método, rota, status, ms)
```

## Interações-chave
- Sem `.devmock/`: um único CTA `[ Initialize Project ]`, resto desabilitado.
- Switch de cenário = radio com efeito imediato (<500ms), sem restart.
- Form de Schema: tipos em dropdown + geradores `br.*` agrupados ("Brasil").

## DevMock Studio (painel, v1.1.0)
- **Visual:** CSS utilitário próprio (`apps/extension/media/form.css`, sem dependências — CDN Tailwind é vetado pelo CSP/offline), cores via variáveis do tema (`var(--vscode-*)`, claro/escuro).
- **Combinado:** editor de Schema + seção Gerar (records/seed) + preview JSON no painel + salvar com erros inline por campo.
- **Segurança:** CSP estrito (só recursos locais via `asWebviewUri`, `localResourceRoots`, nonce no script de config); estado do form sobrevive a reloads (`getState/setState`).

## Links
- PRD: [[PRD-03-VSCode-Extension]] | Design técnico: [[03-Extension-Design]]
