---
title: "Análise de Concorrentes"
type: gestao
status: revisao
fase: 5
tags: [devmock/estrategia]
related: ["[[03-Posicionamento-GTM]]", "[[PRD-02-Mock-Server]]"]
created: 2026-10-11
updated: 2026-10-11
---

# Extras — 02 Análise de Concorrentes

## Cenário
Ferramentas de mock são muitas; **contrato-como-fonte + diferencial BR + fluxo integrado** é onde o DevMock se separa.

| Ferramenta | Foco | Força | Lacuna que o DevMock ataca |
|------------|------|-------|----------------------------|
| MSW | Interceptação de rede no browser/testes | Padrão em testes front | Não gera contrato, docs nem tipos; sem geradores BR |
| MirageJS | Mock embutido no app | Produtividade em-processo | Acoplado ao app; sem OpenAPI/export |
| Mockoon | Mock server desktop/API | Ótima UI, regras de rota | Sem Schema-first nem fluxo Front→Backend |
| Postman Mock | Mocks na nuvem | Ecossistemacollab | Pago, online, sem DX local-first |
| json-server | REST fake de um JSON | Simplicidade extrema | Sem contrato, cenários, tipos ou docs |
| WireMock | Simulação HTTP avançada | Poder em testes Java/stubbing | Curva alta, sem foco front/DX |

## Diferencial defendido
`Contract → Mock → Develop → Document → Share → Validate` num fluxo só, local-first, Git-friendly e com dados BR realistas.

## Links
- Posicionamento: [[03-Posicionamento-GTM]]
