---
title: "Glossário DevMock"
type: moc
status: revisao
fase: 5
tags: [devmock/glossario]
related: []
created: 2026-10-11
updated: 2026-10-11
---

# Extras — 05 Glossário

| Termo | Significado |
|-------|-------------|
| Schema | Fonte única da verdade: modelo com fields tipados (`schemas/*.json`) |
| Mock Server | HTTP local (`:4010`) com CRUD gerado por Schema |
| Scenario | Variação de resposta por endpoint (Default, Empty, 401, 500, Slow) |
| Seed | Número que torna a Fake Data determinística e repetível |
| Generator | Função de dado realista; `br.*` são os brasileiros (CPF, CEP, PIX…) |
| Contract | Schema + endpoints + cenários exportáveis (OpenAPI, JSON Schema, tipos) |
| Envelope | Resposta paginada `{data, total, page, limit}` |
| Core | Regra de negócio pura em TS, sem dependência de editor |
| EAP | Estrutura Analítica do Projeto (WBS) — ver [[01-EAP]] |
| des / main | Branches: desenvolvimento diário / estável via PR |
