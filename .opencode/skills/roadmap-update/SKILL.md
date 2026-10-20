---
name: roadmap-update
description: Use when planning or updating the DevMock roadmap or the next release (vX.Y.0) — creates/updates the release plan, marks planned tasks In Progress, and syncs Home/EAP, wiki Roadmap and READMEs. Trigger on "atualizar roadmap", "planejar a próxima versão", "v1.3.0".
---

# Roadmap Update — DevMock

Atualiza o **planejamento** da próxima release. Esta skill **não implementa features** e **não publica** (tag `ext-*` é outro passo).

## Quando usar
- "Planejar a vX.Y.0" / "atualizar o roadmap" / "o que vem na próxima versão".
- Após publicar uma versão, para abrir a próxima janela.

## Fontes da verdade (nesta ordem)
1. `DevMock Cerebro/05-Gestao-Projeto/Log-Versionamento.md` (última versão publicada).
2. Último `05-Gestao-Projeto/NN-Plano-Release-*` (formato/modelo).
3. `01-PRDs/*` (escopo aprovado; itens em "Fora (futuro)").
4. `02-Arquitetura/06-Stacks-e-Versoes.md` (infra/versões).
5. `05-Gestao-Projeto/07-Estrategia-Testes.md` (órfãos/qualidade).

## Workflow
1. **Versão alvo:** próxima após a última publicada (ex.: `ext-v1.2.0` → **v1.3.0**).
2. **Escopo com o mantenedor:** classificar em Must / Should / Fora, sempre citando a origem (PRD/§/item de roadmap). Nunca inventar feature.
3. **Criar o plano** `05-Gestao-Projeto/NN-Plano-Release-vX.Y.0.md` (NN = próximo número livre) usando o template abaixo. Tasks de execução entram como `[/]` (ver `AGENTS.md`).
4. **Atualizar PRDs** quando um item sai de "Fora (futuro)" para "Dentro (vX.Y.0)": mover, adicionar RFs e aceite (tasks).
5. **Atualizar o vault:** `00-Home` (Roadmap pós-v1), `01-EAP` (bloco 3.x), `_System/Indice-Gestao`.
6. **Atualizar o público** (regras do Docs-Keeper):
   - wiki `Roadmap` (clonar `Devmock.wiki.git` → editar → commit `docs(wiki): ...` → push);
   - seção **Roadmap** do `README.md` e `apps/extension/README.md` (curta, "sem data").
7. **Registrar** no `Log-Versionamento` (linha da rodada) e commitar/taguear no monorepo (`vX.Y.Z`), seguindo o Git-Guardião.
8. Se a skill acabou de ser criada, avisar: **reiniciar o opencode** para carregá-la.

## Template do plano de release
```markdown
---
title: "Plano de Release — vX.Y.0"
type: gestao
status: aprovado
fase: codigo
tags: [devmock/gestao, devmock/release]
related: ["[[...]]"]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Gestão — NN Plano de Release vX.Y.0

## 1. Objetivo
Tema em 1 frase + por que agora.

## 2. Escopo
### Must
| ID | Item | Origem | Status atual no código |
### Should (stretch)
### Fora (vX.Y+1)
### Parte 0 (patch) — se houver

## 3. Definition of Done (por item)

## 4. Passos de execução (checklist)
- [/] #task ⏫ ... 🏷️ fase/codigo

## 5. Gate de Release
- [ ] Manual-Teste-vX.Y 100% no host
- [ ] suítes + cobertura ≥ gate + matriz AUD/RF
- [ ] tsc/build/vsce/lock
- [ ] CHANGELOG + package.json = X.Y.0
- [ ] README + wiki sincronizados
- [ ] Log atualizado
- [ ] Tag ext-vX.Y.0 → publish

## 6. Riscos e Dependências
## 7. Links
```

## Guardrails
- **Nada inventado:** toda linha do plano cita PRD/§/roadmap/teste.
- **Planejado = `[/]`; `[x]` só com DoD cumprido** (ver `AGENTS.md`).
- **Sem datas** no roadmap público ("planejado, sem data").
- **Não** alterar código de feature, **não** criar tag `ext-*`, **não** publicar.
- **Link-check** em todas as notas tocadas.
- Wiki só via Docs-Keeper (nunca editar direto no GitHub web sem espelhar no repo).

## Checklist final
- [ ] Plano criado com Must/Should/Fora e tasks `[/]`
- [ ] PRDs atualizados (Fora → Dentro) quando aplicável
- [ ] Home + EAP + índice
- [ ] wiki `Roadmap` + READMEs
- [ ] Log + commit/tag do monorepo
- [ ] Lembrete de restart do opencode (se skill nova)
