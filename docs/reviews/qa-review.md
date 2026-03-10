# Quality Gate Review — Fase 7
## Brownfield Discovery — BRAINET MVP v3.0.0

**Agente:** @qa (Quinn)
**Data:** 2026-02-23
**Fase:** 7 de 10 — Quality Gate
**Escopo:** Revisão de qualidade de todos os documentos produzidos nas Fases 1–6

---

## Documentos Auditados

| # | Documento | Autor | Fase |
|---|-----------|-------|------|
| D1 | `docs/architecture/system-architecture.md` | @architect | 1 |
| D2 | `docs/frontend/frontend-spec.md` | @ux-design-expert | 3 |
| D3 | `docs/prd/technical-debt-DRAFT.md` | @architect | 4 |
| D4 | `docs/reviews/db-specialist-review.md` | @data-engineer | 5 |
| D5 | `docs/reviews/ux-specialist-review.md` | @ux-design-expert | 6 |

---

## 1. Gate por Documento

### D1 — System Architecture — 🟢 PASS

**Qualidade geral:** Alta. Documentação completa do stack, arquitetura de modos, fluxo de dados, e identificação de débitos técnicos.

**Verificações realizadas:**

| Critério | Status | Observação |
|---|---|---|
| Todos os arquivos do servidor documentados | ✅ | 11 arquivos mapeados: server.js, config.js, agent-executor.js, council.js, browser-llm.js, llm-client.js, job-queue.js, prompt-loader.js, merge-engine.js, web-search.js, server/data/ |
| Débitos críticos identificados | ✅ | 5 CRÍTICOS documentados |
| Quick Reference com caminhos de arquivo | ✅ | Tabela presente |
| Modos de operação documentados | ✅ | SOLO/COUNCIL/CASCADE/API_FALLBACK |
| Limitações e restrições claras | ✅ | Dependência de Chrome explicitada |

**Ressalvas menores:**
- `squads/` directory presente no `git status` não foi analisado — impacto presumido baixo
- Referências ao `src/channel-spawner.js` e `src/views/channel-spawner.js` não incluídas no Quick Reference (arquivo existe mas conteúdo indefinido)

---

### D2 — Frontend Spec — 🟢 PASS

**Qualidade geral:** Alta. Cobertura de todas as 7 views, fluxos mermaid, inventário atomic design, e estado do design system.

**Verificações realizadas:**

| Critério | Status | Observação |
|---|---|---|
| Todas as views documentadas | ✅ | 7 views: landing, graph, stats, jobs, pipeline, niche-detail, channel-spawner |
| Fluxos de usuário com edge cases | ✅ | 3 fluxos principais com edge cases identificados |
| Estado de acessibilidade auditado | ✅ | WCAG tabela presente, 3 falhas críticas identificadas |
| Design tokens inventariados | ✅ | Cores, tipografia, espaçamento, animações |
| Personas inferidas | ✅ | 3 personas: Criador Solo, Operador, Desenvolvedor |

**Ressalva minor documentada:**
- `channel-spawner.js` declarado como "não conseguimos analisar completamente" (checklist line 443). Validado por @ux-design-expert na Fase 6 — feature sem UX bem definida. **Risco MÉDIO** para análise subsequente.

---

### D3 — Technical Debt DRAFT — 🟡 CONCERNS

**Qualidade geral:** Boa como versão de trabalho original, mas **desatualizado** após os reviews de Fase 5 e 6. Múltiplas inconsistências entre o DRAFT e os reviews especializados.

**Inconsistências identificadas:**

| # | Problema | Local no DRAFT | Valor atual | Valor correto (source) |
|---|----------|---------------|-------------|----------------------|
| C-01 | DB-01 severidade desatualizada | Seção 2, tabela | ALTO | **CRÍTICO** (D4 elevou) |
| C-02 | Esforço DB total defasado | Matriz Seção 5 | 24h | **76h** (D4 revisado) |
| C-03 | Esforço UX total parcial | Matriz Seção 5 | ~96h parcial | **169h** (D5 revisado) |
| C-04 | UX-07 sem esforço estimado | Matriz Seção 5 | — | **4h** (D5) |
| C-05 | UX-09/12/14/17/18/19 sem esforço | Matriz Seção 5 | — | D5 estima todos |
| C-06 | DB-06 não catalogado | — | Ausente | **NOVO débito** (D4) |
| C-07 | UX-26, UX-27 não catalogados | — | Ausente | **2 NOVOS débitos** (D5) |
| C-08 | UX-05 dependência de DB-01 ausente | Seção 6 | Não mapeado | D5 identificou dependência |

**Impacto:** O DRAFT não pode ser passado ao @architect para Phase 8 sem ser resincronizado com os reviews especializados. **Ação requerida antes da Fase 8.**

---

### D4 — DB Specialist Review — 🟢 PASS

**Qualidade geral:** Alta. Schema DDL completo, respostas diretas às 5 perguntas, estratégia de migração clara, novos débitos identificados.

**Verificações realizadas:**

| Critério | Status | Observação |
|---|---|---|
| Todas as 5 perguntas de @architect respondidas | ✅ | Seção 2 com justificativas técnicas |
| Schema DDL executável | ✅ | 7 tabelas + 3 funções + 2 triggers |
| Estratégia de migração documentada | ✅ | 3 fases com código JS de exemplo |
| Novos débitos registrados | ✅ | DB-06 (jobs travados) |
| Jobs travados em produção identificados | ✅ | 4 de 5 jobs em "running" desde 3+ dias |

**Ressalva técnica (não bloqueia):**
- O schema usa `TEXT PRIMARY KEY` para `jobs.id` (mantém formato legado `job_${timestamp}_${random}`). Recomenda-se adicionar uma constraint para validade futura, mas não bloqueia o gate.
- Função `cleanup_stuck_jobs()` usa `30 minutes` como threshold — pode ser muito agressivo se pipelines longos forem normais (pipelines reais podem levar 8-15 min). Sugerido: aumentar para 60 min com configuração via env.

---

### D5 — UX Specialist Review — 🟢 PASS

**Qualidade geral:** Alta. Estimativas revisadas com justificativa, respostas às 5 perguntas com trade-offs claros, novos débitos identificados.

**Verificações realizadas:**

| Critério | Status | Observação |
|---|---|---|
| Todas as 5 perguntas de @architect respondidas | ✅ | Seção 3 completa |
| Todos os débitos UX-01 a UX-25 validados | ✅ | Status explícito por item |
| Estimativas com justificativa | ✅ | Delta documentado por item |
| Novos débitos identificados | ✅ | UX-26, UX-27 |
| Dependências mapeadas | ✅ | Seção 5 completa |

---

## 2. Análise Cross-Document — Inconsistências e Gaps

### 2.1 Inconsistência de Dados Verificada pelo QA

**stats.js NÃO tem `API_BASE` hardcoded.**

O DRAFT (UX-01) e o frontend-spec mencionam "pipeline.js, jobs.js, stats.js" como 3 arquivos afetados. Verificação via grep confirma: `stats.js` não contém `API_BASE` nem `localhost:3001`. Apenas **2 arquivos** afetados.

- **Impacto:** Mínimo. stats.js provavelmente busca de URL relativa ou usa outro mecanismo. Não altera a severidade do débito.
- **Ação:** Corrigir referência no DRAFT — UX-01 afeta `pipeline.js` e `jobs.js` (não 3+ arquivos).

---

### 2.2 Agent 4 — Decisão Não Documentada Formalmente

DT-08 cataloga `// Agent 4 can be skipped in MVP` como débito de documentação. Os dados reais de jobs (D4) confirmam que agent 4 **nunca aparece** em nenhum job executado (sequência real: 1→2→3→5→6).

Nenhum documento esclarece:
- O que o Agent 4 faz (ou deveria fazer)?
- A remoção é temporária (MVP) ou permanente?
- Isso afeta a qualidade dos outputs?

**Risco:** Decisão arquitetural crítica não documentada. O @architect final (Fase 8) precisa endereçar isso.

---

### 2.3 Validação Input em POST /api/pipeline/start

Verificação do `server.js` (linhas 58-87) revela:

**O que existe:** Validação de presença de `nichoId` e `angulo` (linha 61-62), e validação de existência do nicho no JSON (linha 74-76).

**O que está faltando:** Sem sanitização de `angulo`, `subtema`, `formato` antes de inserção nos prompts. Esses valores chegam diretamente do body HTTP e são passados para os templates de prompt dos agentes.

**Risco de Prompt Injection:** BAIXO para uso single-user local. MÉDIO se APIs forem expostas publicamente (DT-04 aberto). **Não catalogado em nenhum documento.**

Novo débito: **SYS-22 — Sem sanitização de input nos campos de prompt** (ver Seção 3).

---

### 2.4 Information Disclosure no /api/health

`server.js:38` — `workspace: config.workspace` expõe o path completo interno do sistema:
```
/Volumes/Seagate 500/Obsidian Vault/EVAD/1 BRAINET
```

Este endpoint é público (sem auth — DT-04). O path expõe:
- Que o sistema roda em macOS
- Nome do HD externo
- Estrutura de diretório do usuário
- Que usa Obsidian Vault

**Não catalogado em nenhum documento.** Novo débito: **SYS-23** (ver Seção 3).

---

### 2.5 Sem Process Management

Se o servidor Node.js cravar (unhandled exception, OOM, etc.), nenhum mecanismo reinicia o processo. O usuário precisaria reiniciar manualmente. Considerando que:
- O servidor pode receber jobs longos (8-15 min)
- Browser CDP pode causar crashes (`puppeteer-core`)
- Sem testes (DT-07) = crashes inesperados são prováveis

**Não catalogado em nenhum documento.** Novo débito: **SYS-24** (ver Seção 3).

---

### 2.6 Sem Backup de jobs.json

O arquivo `server/data/jobs.json` contém todos os outputs de agentes (incluindo conteúdo de 2000+ chars por agente). Se o arquivo for corrompido (escrita simultânea, crash mid-write — agravado por DT-06), **todos os outputs são perdidos permanentemente**.

**Não catalogado em nenhum documento.** Novo débito: **SYS-25** (ver Seção 3).

---

### 2.7 cleanup_stuck_jobs Threshold vs Duração Real de Pipeline

D4 propõe marcar jobs como `failed` após 30 minutos em `running`. Mas pipelines reais podem levar:
- Agent 1 (Council 3 AIs): ~7-10 minutos observados nos dados
- 6 agentes sequenciais: estimativa de 40-90 minutos total

O threshold de 30 minutos marcaria jobs legítimos como failed. **Inconsistência entre D4 e dados reais de jobs.**

---

## 3. Novos Débitos Identificados pelo QA

### SYS-22 — Sem sanitização de input em campos de prompt — Severidade: **MÉDIO**

`POST /api/pipeline/start` — `angulo`, `subtema`, `formato` vão direto para prompts sem sanitização. Prompt injection possível (baixo risco atual — single-user local; médio se APIs forem expostas via DT-04).

**Esforço:** 2h — validação de tamanho máximo + whitelist de caracteres especiais.

---

### SYS-23 — Information disclosure no /api/health — Severidade: **MÉDIO**

`server.js:38` — `workspace: config.workspace` expõe path interno completo em endpoint público. Remover ou ofuscar campo workspace da resposta pública.

**Esforço:** 1h — remover campo workspace do response público; manter em endpoint autenticado quando auth for implementado.

---

### SYS-24 — Sem process management (auto-restart) — Severidade: **MÉDIO**

Node.js sem PM2, systemd, ou Docker restart policy. Crash → servidor offline até reinício manual. Especialmente relevante durante pipelines longos com Chrome CDP.

**Esforço:** 4h — adicionar PM2 com `ecosystem.config.js`, script de startup + `--watch` para dev.

---

### SYS-25 — Sem backup de jobs.json — Severidade: **MÉDIO**

Único arquivo de persistência sem estratégia de backup ou recovery. Corrupção = perda total dos outputs gerados. Resolvido por DB-01 (migração para banco), mas necessita atenção enquanto JSON persiste.

**Esforço:** 2h — cron job de backup diário (`cp jobs.json jobs.backup-YYYY-MM-DD.json`) + script de recovery. Descartável após DB-01.

---

## 4. Consolidado de Débitos — Estado Pós-QA

| Categoria | DRAFT original | Pós-Reviews (D4+D5) | QA (novos) | Total Final |
|-----------|---------------|---------------------|-----------|-------------|
| Sistema (DT-xx) | 19 | +0 | +3 (SYS-22,23,24) | **22** |
| Backup/Ops | 0 | +0 | +1 (SYS-25) | **1** |
| Database (DB-xx) | 5 | +1 (DB-06) | +0 | **6** |
| Frontend/UX (UX-xx) | 25 | +2 (UX-26,27) | +0 | **27** |
| **TOTAL** | **49** | **+3** | **+4** | **56** |

---

## 5. Análise de Risco Consolidada

### Matriz de Risco — Top 10 Itens

| Rank | ID | Débito | Prob. | Impacto | Score | Prioridade |
|------|-----|--------|-------|---------|-------|------------|
| 1 | DT-01 | Workspace hardcoded | Alta | Crítico | **9** | P0 |
| 2 | DT-02 | Prompts sem versionamento | Alta | Crítico | **9** | P0 |
| 3 | DB-01 | Persistência em JSON flat | Alta | Crítico | **9** | P0 |
| 4 | DT-04 | APIs sem auth | Alta | Alto | **8** | P1 |
| 5 | UX-01 | API_BASE hardcoded | Alta | Crítico | **8** | P0 |
| 6 | DB-06 | Jobs travados permanentemente | Alta | Alto | **8** | P1 (quick fix) |
| 7 | DT-03 | Browser CDP frágil | Média | Crítico | **7** | P2 |
| 8 | DT-05 | CORS aberto | Alta | Médio | **7** | P1 |
| 9 | SYS-24 | Sem process management | Alta | Médio | **7** | P1 |
| 10 | UX-02 | Sem responsividade | Alta | Alto | **7** | P1 |

**Risco sistêmico mais crítico:** A combinação DT-01 + DT-02 + DB-01 cria um único ponto de falha catastrófico — se o HD externo falhar antes da migração, todo o histórico de outputs, prompts dos agentes, e dados de exploração são perdidos permanentemente e irrecuperáveis.

---

## 6. Verificação de Completude do Discovery

### Arquivos Analisados vs Existentes

| Diretório | Arquivos existentes | Analisados | Cobertura |
|-----------|---------------------|------------|-----------|
| `server/` | 11 arquivos | 11 | 100% |
| `src/views/` | 7 views | 7 | 100% |
| `src/components/` | particles.js | 1/1 | 100% |
| `src/` (raiz) | main.js, dice-engine.js, pipeline-runner.js, channel-spawner.js | ~3/4 | 75% |
| `data/` | nichos.json | 1/1 | 100% |
| `squads/` | não analisado | 0/? | 0% |

**Gap: `squads/` não analisado.** Aparece no `git status`. Sem análise, não podemos confirmar se contém débitos adicionais.

---

## 7. Gate Decision Global

### Veredicto por Documento

| Documento | Gate | Condição |
|-----------|------|----------|
| D1 — System Architecture | 🟢 **PASS** | Pode ser usado pelo @architect na Fase 8 |
| D2 — Frontend Spec | 🟢 **PASS** | Pode ser usado pelo @architect na Fase 8 |
| D3 — Technical Debt DRAFT | 🟡 **CONCERNS** | Deve ser atualizado com os reviews D4+D5 antes da Fase 8 |
| D4 — DB Specialist Review | 🟢 **PASS** | Pode ser incorporado ao assessment final |
| D5 — UX Specialist Review | 🟢 **PASS** | Pode ser incorporado ao assessment final |

### Gate Global — Fase 7

**🟡 PASS WITH CONDITIONS**

O conjunto de documentos é suficientemente completo para avançar para a Fase 8, **sob as condições:**

1. **[OBRIGATÓRIO]** O DRAFT (D3) deve ser resincronizado para refletir: DB-01 como CRÍTICO, novos débitos DB-06, UX-26, UX-27, SYS-22/23/24/25, e esforços revisados antes do assessment final
2. **[OBRIGATÓRIO]** O threshold de `cleanup_stuck_jobs()` deve ser ajustado para 60-90 min (ou configurável via env) antes de ir para produção
3. **[RECOMENDADO]** Analisar `squads/` antes de fechar o assessment final
4. **[RECOMENDADO]** Clarificar decisão sobre Agent 4 (DT-08) formalmente no documento de arquitetura

---

## 8. Recomendações para a Fase 8 — @architect (Assessment Final)

### Prioridade Absoluta: Ação Antes de Qualquer Deploy

```
1. DT-01 → DB-01 → DT-02  (resolver nesta ordem)
   ↑ Single Point of Failure catastrófico
   ↑ HD externo falha = tudo perdido

2. DT-04 + DT-05  (auth + CORS)
   ↑ APIs totalmente abertas na rede
```

### Sequência de Sprints Recomendada (pós-assessment)

```
Sprint 0 (Pré-condições, ~2 dias):
  UX-01 (2h) + UX-03 (1h) + SYS-23 (1h) + DB-06 fix (4h)
  → Deploy-ready em qualquer ambiente

Sprint 1 (Database Foundation, ~1 semana):
  DB-01 (40h) + DB-02 (8h) + SYS-24 (4h) + SYS-25 (2h)
  → Elimina HD externo, resolve persistência

Sprint 2 (Frontend Foundation, ~1 semana):
  UX-04 (6h) + UX-08 + UX-26 (16h juntos) + UX-13 (12h)
  → Router funcional, sem memory leaks, CSS modular

Sprint 3 (Security + Reliability, ~1 semana):
  DT-04 (16h) + DT-05 (1h) + UX-02 (26h)
  → APIs protegidas, responsividade

Sprint 4+ (Features + UX, ~2 semanas):
  UX-05 (20h) + UX-06 (8h) + UX-10 (14h) + UX-11 (8h)
  → Outputs visíveis, pipeline robusto
```

### Estimativa de Esforço Total Validada pelo QA

| Categoria | Esforço Total |
|-----------|-------------|
| Sistema (DT + SYS) | ~120h |
| Database (DB) | ~80h |
| Frontend/UX (UX) | ~169h |
| **TOTAL** | **~369h** |

*~46 dias de desenvolvedor solo ou ~12-15 dias com time de 3.*

---

## 9. Assinatura do Quality Gate

| Item | Status |
|------|--------|
| Todos os documentos revisados | ✅ |
| Inconsistências documentadas | ✅ (8 inconsistências) |
| Novos débitos identificados | ✅ (4 novos: SYS-22 a SYS-25) |
| Gate por documento emitido | ✅ |
| Gate global emitido | ✅ |
| Recomendações para Fase 8 | ✅ |

---

*— Quinn, guardião da qualidade 🛡️*
*@qa | Fase 7 de 10 — Brownfield Discovery — BRAINET MVP v3.0.0*
