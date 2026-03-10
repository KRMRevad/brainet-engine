# Technical Debt Assessment — FINAL
## BRAINET MVP v3.0.0 — Brownfield Discovery

**Projeto:** BRAINET MVP v3.0.0
**Data:** 2026-02-23
**Autor consolidador:** @architect (Aria)
**Fase:** 8 de 10 — Assessment Final
**Status:** ✅ DEFINITIVO — Aprovado pelo Quality Gate (Fase 7)

**Fontes consolidadas:**
| Documento | Autor | Fase |
|-----------|-------|------|
| `docs/architecture/system-architecture.md` | @architect | 1 |
| `docs/frontend/frontend-spec.md` | @ux-design-expert | 3 |
| `docs/prd/technical-debt-DRAFT.md` | @architect | 4 |
| `docs/reviews/db-specialist-review.md` | @data-engineer | 5 |
| `docs/reviews/ux-specialist-review.md` | @ux-design-expert | 6 |
| `docs/reviews/qa-review.md` | @qa | 7 |

> Este documento **supersede** o `technical-debt-DRAFT.md`. Incorpora todas as revisões especializadas e o quality gate. Use este documento como fonte única de verdade.

---

## Executive Summary

| Métrica | Valor |
|---------|-------|
| Total de débitos identificados | **56** |
| Críticos | **11** |
| Altos | **15** |
| Médios | **22** |
| Baixos | **8** |
| Esforço total estimado | **~369h** (~46 dias dev solo) |
| Risco mais alto | Perda catastrófica de dados (HD externo) |
| Bloqueador #1 para produção | APIs sem autenticação + CORS aberto |
| Bloqueador #1 para portabilidade | Workspace path hardcoded |

**Pré-condição crítica antes de qualquer deploy ou crescimento de uso:**
A combinação DT-01 + DT-02 + DB-01 representa um **Single Point of Failure catastrófico**: se o HD externo (`/Volumes/Seagate 500/`) falhar antes da migração, todos os prompts dos agentes (13 arquivos), outputs históricos e dados de exploração são perdidos permanentemente e irrecuperáveis.

---

## 1. Inventário Completo — 56 Débitos

### 1.1 Sistema (DT-01 a DT-19 + SYS-22 a SYS-25)

#### CRÍTICOS

| ID | Débito | Arquivo | Esforço | Sprint |
|----|--------|---------|---------|--------|
| DT-01 | Workspace path hardcoded `/Volumes/Seagate 500/...` | `server/config.js:51` | 4h | 1 |
| DT-02 | 13 arquivos de prompt fora do repositório (Obsidian Vault externo) | Vault externo | 8h | 1 |
| DT-03 | Browser CDP frágil — seletores CSS de ChatGPT/Claude/Gemini quebram a qualquer update | `server/browser-llm.js` | 40h | 3 |
| DT-04 | Todos os endpoints REST públicos sem autenticação | `server/server.js` | 16h | 2 |
| DT-05 | `app.use(cors())` sem restrição de origem | `server/server.js:8` | 1h | 2 |

#### ALTOS

| ID | Débito | Arquivo | Esforço | Sprint |
|----|--------|---------|---------|--------|
| DT-06 | Job queue sem controle de concorrência — array em memória + write síncrono | `server/job-queue.js` | 0h\* | 1 |
| DT-07 | Zero testes (unit, integration, E2E) — cobertura 0% | Projeto inteiro | 40h+ | 4 |
| DT-08 | Agente 4 removido sem documentação formal — decisão arquitetural não registrada | `server/agent-executor.js:42` | 2h | 0 |
| DT-09 | Outputs dos jobs salvos no workspace Obsidian externo | `server/agent-executor.js:177` | 0h\* | 1 |

*\*Resolvidos como efeito colateral do DB-01 (migração para banco de dados)*

#### MÉDIOS

| ID | Débito | Arquivo | Esforço | Sprint |
|----|--------|---------|---------|--------|
| DT-10 | `nichos.json` lido pelo servidor via `fs.readFile` E importado estaticamente no frontend | `server/server.js:45`, `src/dice-engine.js:7` | 0h\* | 1 |
| DT-11 | Histórico de exploração apenas em localStorage | `src/dice-engine.js:10` | 0h\* | 1 |
| DT-12 | Sem TypeScript — sem validação de tipos | Projeto inteiro | 40h+ | 5 |
| DT-13 | Sem ESLint/formatador — inconsistência de código | Projeto inteiro | 4h | 0 |
| DT-14 | Job ID não-padrão: `timestamp + Math.random()` | `server/job-queue.js:39` | 0h\* | 1 |
| DT-15 | Cache de prompts em memória sem TTL | `server/prompt-loader.js:11` | 2h | 2 |
| SYS-22 | Sem sanitização de `angulo`/`subtema`/`formato` antes de inserção em prompts | `server/server.js:59` | 2h | 2 |
| SYS-23 | `/api/health` expõe `config.workspace` (path interno) publicamente | `server/server.js:38` | 1h | 0 |
| SYS-24 | Sem process management (PM2/systemd) — crash = servidor offline manual | Infraestrutura | 4h | 2 |
| SYS-25 | Sem backup de `jobs.json` — corrupção = perda total de dados | `server/data/jobs.json` | 2h | 1 |

*\*Resolvidos como efeito colateral do DB-01 ou DT-01*

#### BAIXOS

| ID | Débito | Arquivo | Esforço | Sprint |
|----|--------|---------|---------|--------|
| DT-16 | Sem rate limiting | `server/server.js` | 2h | 3 |
| DT-17 | Modelo Anthropic hardcoded com fallback silencioso | `server/llm-client.js:71` | 1h | 2 |
| DT-18 | Conflito de porta: `vite.config.js` (3000) vs `package.json` (5173) | Config | 1h | 0 |
| DT-19 | Arquivos órfãos na raiz: `/slash-commands.yaml`, `/brainet-mvp@3.0.0`, `/node` | Raiz | 1h | 0 |

---

### 1.2 Database (DB-01 a DB-06)

#### CRÍTICOS

| ID | Débito | Esforço | Sprint |
|----|--------|---------|--------|
| DB-01 | Persistência de jobs em JSON flat — sem indexação, sem transações, sem concorrência | **40h** | 1 |

#### ALTOS

| ID | Débito | Esforço | Sprint |
|----|--------|---------|--------|
| DB-02 | Histórico de exploração não persistido no servidor | 8h | 1 |
| DB-03 | Outputs sem storage estruturado | 0h\* | 1 |
| DB-06 | 4 jobs travados em `"running"` sem mecanismo de recovery *(novo — Fase 5)* | 4h | 0 |

*\*Absorvido por DB-01 (tabela `job_outputs`)*

#### MÉDIOS

| ID | Débito | Esforço | Sprint |
|----|--------|---------|--------|
| DB-04 | Taxonomia de nichos sem CRUD — edição requer editar JSON manualmente | 16h | 2 |
| DB-05 | Sem rastreabilidade de uso — sem logs de execução por nicho/agente | 8h | 2 |

---

### 1.3 Frontend/UX (UX-01 a UX-27)

#### CRÍTICOS

| ID | Débito | Localização | Esforço | Sprint |
|----|--------|------------|---------|--------|
| UX-01 | `API_BASE = 'http://localhost:3001'` hardcoded em 2 arquivos *(corrigido: eram 2, não 3)* | `pipeline.js:9`, `jobs.js:7` | 2h | 0 |
| UX-02 | Sem responsividade — zero breakpoints — inutilizável em mobile | `style.css` | 26h | 2 |
| UX-03 | `escapeHtml()` duplicada — risco de XSS se implementações divergirem | `jobs.js:129`, `pipeline.js:383` | 1h | 0 |
| UX-04 | Result overlay sem `role="dialog"`, sem trap de foco, sem aria | `landing.js:70` | 6h | 0 |
| UX-05 | Outputs truncados na UI — dead-end para usuário *(depende de DB-01)* | `jobs.js`, `pipeline.js` | 20h | 2 |

#### ALTOS

| ID | Débito | Esforço | Sprint |
|----|--------|---------|--------|
| UX-06 | Sem skeleton loaders em views assíncronas | 8h | 2 |
| UX-07 | Sem estados de erro para APIs secundárias | 4h | 2 |
| UX-08 | Sem history API no router — URLs não mudam | 8h | 2 |
| UX-09 | Animação do dado de 1800ms não cancelável | 3h | 2 |
| UX-10 | Sem cancelamento de pipeline em andamento | 14h | 3 |
| UX-11 | Sem reconexão automática de SSE | 8h | 3 |
| UX-12 | Channel Spawner e Pipeline fora da nav principal | 4h | 2 |
| UX-26 | Event listeners não removidos ao trocar views — memory leaks *(novo — Fase 6)* | 8h | 2 |

#### MÉDIOS

| ID | Débito | Esforço | Sprint |
|----|--------|---------|--------|
| UX-13 | CSS monolítico 27KB sem separação por componente | 12h | 2 |
| UX-14 | Font-size hardcoded em template literals | 4h | 2 |
| UX-15 | Sem paginação na jobs list | 4h | 3 |
| UX-16 | Sem filtros na jobs list *(depende de DB-01 para status "failed")* | 4h | 3 |
| UX-17 | Back button inconsistente em pipeline view | 2h | 2 |
| UX-18 | Sem empty states | 4h | 2 |
| UX-19 | Sem confirmação antes de executar pipeline | 3h | 3 |
| UX-20 | `renderObj()` inline duplicável | 0h\* | 0 |

*\*Absorvido por UX-03 (criação de utils.js)*

#### BAIXOS

| ID | Débito | Esforço | Sprint |
|----|--------|---------|--------|
| UX-21 | vis-network sem lazy loading (~500KB always-on) | 4h | 3 |
| UX-22 | Sem dark/light mode toggle | 8h | 4 |
| UX-23 | Emojis como ícones sem aria-label | 2h | 0 |
| UX-24 | Sem gamificação de exploração *(depende de DB-02)* | 6h | 4 |
| UX-25 | Council mode sem aviso proativo de Chrome | 2h | 2 |
| UX-27 | Canvas particles ativo em todas as views *(novo — Fase 6)* | 2h | 3 |

---

## 2. Decisões Arquiteturais Formalizadas

### DEA-01 — Agent 4: Decisão Intencional de MVP

**Contexto:** `server/agent-executor.js:42` contém `// Agent 4 can be skipped in MVP`. Dados reais confirmam: nenhum job executado usou o agente 4 (sequência real: 1→2→3→5→6).

**Decisão:** A ausência do Agente 4 é **intencional para o MVP**. O pipeline de 5 agentes (1→2→3→5→6) é a versão de produção atual.

**Ação requerida:** Remover o comentário ambíguo e adicionar documentação formal no `agent-executor.js` explicando a omissão e o pipeline canônico. (DT-08: 2h)

---

### DEA-02 — Banco de Dados: Supabase

**Decisão:** Supabase (PostgreSQL gerenciado) como target de persistência.

**Justificativa:** (a) já planejado em `.env.example`; (b) elimina dependência de HD externo; (c) PostgreSQL MVCC resolve concorrência de job-queue; (d) Supabase Realtime pode substituir SSE custom; (e) free tier suficiente para MVP.

**Schema proposto:** 7 tabelas normalizadas — ver `docs/reviews/db-specialist-review.md` Seção 3.

---

### DEA-03 — Frontend: Vanilla JS Refatorado, não Framework

**Decisão:** Manter Vanilla JS com refatoração do router (history API) e cleanup de listeners. Não migrar para Preact/Solid no MVP.

**Justificativa:** Migração para framework = ~120h de reescrita de 7 views sem benefício proporcional para ferramenta single-user. history API + UX-26 (cleanup) entrega 80% do benefício do framework.

**Revisão:** Se o projeto escalar para time 3+ devs ou 10+ views novas, reconsiderar.

---

### DEA-04 — CSS: Custom Properties Mantidas, Classes Utilitárias Próprias

**Decisão:** Manter o sistema de design tokens em CSS custom properties. Não adotar Tailwind. Criar classe utilitárias próprias baseadas nos tokens.

**Justificativa:** Base de tokens já sólida e bem estruturada. Problema é inconsistência de consumo, não o sistema. Tailwind exigiria reescrita completa do HTML gerado por template literals.

---

### DEA-05 — cleanup_stuck_jobs: Threshold de 90 Minutos

**Decisão:** Threshold de `cleanup_stuck_jobs()` = **90 minutos** (não 30 minutos como proposto inicialmente pelo @data-engineer).

**Justificativa:** Dados reais mostram pipelines legítimos com 6 agentes podem levar 40-90 minutos. Threshold de 30 minutos marcaria jobs em execução como failed.

**Implementação:** Configurável via env `STUCK_JOB_TIMEOUT_MIN=90`.

---

### DEA-06 — vis-network: Manter com Lazy Loading

**Decisão:** Manter vis-network (~500KB) com dynamic import ao entrar na Graph View.

**Justificativa:** A Graph View tem valor real para visualização do universo de nichos. Substituição por D3.js = reimplementação completa sem ganho funcional no MVP.

---

### DEA-07 — Animação do Dado: Manter com Skip Progressivo

**Decisão:** Manter animação de 1800ms mas implementar: (a) click-to-skip, (b) 800ms a partir da 3ª execução na sessão, (c) 0ms com `prefers-reduced-motion`.

**Justificativa:** A animação é identidade do produto. Remoção seria perda de UX intencional.

---

### DEA-08 — squads/: Diretório Vazio

**Constatação (Fase 8):** O diretório `squads/` citado no `git status` como `D ._squads` está vazio ou inexistente. Sem débitos técnicos adicionais nessa área.

---

## 3. Matriz de Priorização Final

### Sprint 0 — Quick Wins (sem dependências, ~3 dias, 16h)

| ID | Ação | Esforço |
|----|------|---------|
| DT-08 | Documentar decisão Agent 4 formalmente | 2h |
| DT-13 | Configurar ESLint + Prettier | 4h |
| DT-18 | Alinhar porta Vite para 5173 em todos os configs | 1h |
| DT-19 | Remover arquivos órfãos da raiz | 1h |
| UX-01 | Extrair `API_BASE` para `src/config.js` | 2h |
| UX-03 + UX-20 | Criar `src/utils.js` com `escapeHtml()` + `renderObj()` | 1h |
| UX-04 | Adicionar `role="dialog"` + trap de foco no overlay | 6h |
| UX-23 | Adicionar `aria-label` em botões com emoji | 2h |
| SYS-23 | Remover `workspace` do response de `/api/health` | 1h |
| DB-06 | Executar `cleanup_stuck_jobs()` nos 4 jobs travados | 0h *(manual)* |

**Total Sprint 0:** ~20h

---

### Sprint 1 — Database Foundation (~1 semana, 68h)

*Pré-requisito de todos os demais*

| ID | Ação | Esforço |
|----|------|---------|
| DT-01 | Extrair workspace path para `.env` + configuração portátil | 4h |
| DT-02 | Migrar prompts para `server/prompts/` no repositório | 8h |
| DB-01 | Criar schema Supabase + seed nichos + migrar jobs.json + refactor job-queue.js | 40h |
| DB-02 | Tabela exploration_history + endpoint POST + atualizar frontend | 8h |
| SYS-24 | Configurar PM2 com `ecosystem.config.js` | 4h |
| SYS-25 | Script de backup diário de jobs.json (descartável após DB-01) | 2h |

*Efeitos colaterais (custo zero):* DT-06, DT-09, DT-10, DT-11, DT-14, DB-03

**Total Sprint 1:** ~66h

---

### Sprint 2 — Security + Frontend Foundation (~1,5 semanas, 105h)

*Requer Sprint 1 completo*

| ID | Ação | Esforço |
|----|------|---------|
| DT-04 | Implementar autenticação nas APIs (JWT ou session simples) | 16h |
| DT-05 | Configurar CORS com whitelist de origens | 1h |
| DT-15 | Adicionar TTL ao cache de prompts | 2h |
| DT-17 | Corrigir fallback de modelo Anthropic | 1h |
| SYS-22 | Sanitizar campos de prompt (angulo/subtema/formato) | 2h |
| SYS-24 | *(já no Sprint 1)* | — |
| UX-02 | Implementar responsividade completa (3 breakpoints + 7 views) | 26h |
| UX-05 | Markdown renderer + view de output completo *(requer DB-01)* | 20h |
| UX-06 | Skeleton loaders em todas as views assíncronas | 8h |
| UX-07 | Estados de erro para APIs secundárias | 4h |
| UX-08 + UX-26 | History API no router + cleanup de event listeners | 16h |
| UX-09 | Click-to-skip + `prefers-reduced-motion` na animação | 3h |
| UX-12 | Adicionar Pipeline e Canais na nav | 4h |
| UX-13 | Refatorar CSS monolítico em 8 arquivos modulares | 12h |
| UX-14 | Adicionar escala de font-size aos tokens | 4h |
| UX-17 | Guard no back button do pipeline | 2h |
| UX-18 | Empty states em 5 views | 4h |
| UX-25 | Aviso proativo de Chrome no Council mode | 2h |

**Total Sprint 2:** ~127h *(pode ser paralelo com 2 devs)*

---

### Sprint 3 — Reliability + UX Avançada (~1 semana, 64h)

| ID | Ação | Esforço |
|----|------|---------|
| DB-04 | CRUD de nichos — endpoints + validação | 16h |
| DB-05 | Rastreabilidade de uso — middleware + tabela de auditoria | 8h |
| UX-10 | Cancelamento de pipeline (backend + frontend) | 14h |
| UX-11 | Reconexão SSE com backoff exponencial | 8h |
| UX-15 | Paginação na jobs list | 4h |
| UX-16 | Filtros na jobs list *(requer DB-01)* | 4h |
| UX-19 | Confirmação antes de executar pipeline | 3h |
| UX-21 | Lazy loading do vis-network | 4h |
| DT-16 | Rate limiting nas APIs | 2h |
| UX-27 | Pausar canvas particles em views não-landing | 2h |

**Total Sprint 3:** ~65h

---

### Sprint 4+ — Qualidade e Roadmap (~2+ semanas)

| ID | Ação | Esforço |
|----|------|---------|
| DT-07 | Criar suite de testes (unit + integration) | 40h+ |
| DT-03 | Estabilizar Browser CDP (abstração de seletores) | 40h |
| DT-12 | Migração para TypeScript | 40h+ |
| UX-22 | Dark/light mode toggle | 8h |
| UX-24 | Gamificação de exploração *(requer DB-02)* | 6h |

**Total Sprint 4+:** ~130h+

---

## 4. Dependências Arquiteturais — Grafo Final

```
┌─────────────────────────────────────────────┐
│              SPRINT 0 (Quick Wins)           │
│  UX-01 · UX-03 · UX-04 · SYS-23 · DT-13    │
│  DT-08 · DT-18 · DT-19 · UX-23 · DB-06     │
└──────────────────┬──────────────────────────┘
                   │ habilita
┌──────────────────▼──────────────────────────┐
│         SPRINT 1 (Database Foundation)       │
│      DT-01 ──► DT-02 ──► DT-09             │
│      DB-01 ──► DB-03 · DT-06 · DT-10       │
│      DB-02 ──► UX-24 (futuro)               │
│      SYS-24 · SYS-25                        │
└──────────────────┬──────────────────────────┘
                   │ habilita
┌──────────────────▼──────────────────────────┐
│      SPRINT 2 (Security + Frontend)          │
│      DT-04 + DT-05 ──► qualquer expose      │
│      UX-05 ──► depende de DB-01             │
│      UX-08 + UX-26 ──► juntos (router)      │
└──────────────────┬──────────────────────────┘
                   │ habilita
┌──────────────────▼──────────────────────────┐
│      SPRINT 3 (Reliability + UX)             │
│      UX-16 ──► depende de DB-01             │
│      UX-10 + UX-11 ──► pipeline robusto     │
└──────────────────┬──────────────────────────┘
                   │ habilita
┌──────────────────▼──────────────────────────┐
│      SPRINT 4+ (Qualidade / Roadmap)         │
│      DT-07 · DT-12 · DT-03                  │
└─────────────────────────────────────────────┘
```

---

## 5. Arquitetura Target (Estado Pós-Débito)

### Backend Target

```
server/
├── config.js          ← paths de .env, sem hardcode
├── server.js          ← CORS restrito, auth middleware, rate limit
├── auth.js            ← JWT / session simples (DT-04)
├── prompts/           ← 13 arquivos .md versionados (DT-02)
│   ├── agent-1.md
│   ├── agent-2.md
│   └── ...
├── agent-executor.js  ← Agent 4 documentado como ausente intencional
├── job-queue.js       ← Supabase client (DB-01)
├── council.js         ← CDP wrapper com seletores abstraídos (DT-03)
├── llm-client.js      ← modelo configurável via env (DT-17)
├── prompt-loader.js   ← TTL de cache configurável (DT-15)
└── web-search.js      ← sem mudanças
```

### Frontend Target

```
src/
├── config.js          ← API_BASE, constantes centrais (UX-01)
├── utils.js           ← escapeHtml, renderObj, helpers (UX-03)
├── main.js            ← router com history API (UX-08)
├── styles/            ← CSS modular (UX-13)
│   ├── tokens.css
│   ├── base.css
│   ├── nav.css
│   └── [view].css × 7
├── views/             ← cada view exporta destroy() (UX-26)
│   ├── landing.js     ← overlay acessível (UX-04), animação com skip (UX-09)
│   ├── pipeline.js    ← cancelamento (UX-10), reconexão SSE (UX-11)
│   ├── jobs.js        ← paginação + filtros (UX-15/16)
│   ├── graph.js       ← vis-network lazy loaded (UX-21)
│   └── ...
└── components/
    └── particles.js   ← pausável por view (UX-27)
```

### Infraestrutura Target

```
ecosystem.config.js    ← PM2 com restart policy (SYS-24)
.env                   ← workspace, DB, API keys, ports (DT-01, DT-18)
supabase/
├── migrations/        ← schema versionado (DB-01)
│   └── 001_initial.sql
└── seed/
    └── nichos.sql     ← migração do nichos.json
```

---

## 6. Resumo de Esforço por Sprint

| Sprint | Foco | Esforço | Acumulado |
|--------|------|---------|-----------|
| 0 | Quick wins / sem dependências | 20h | 20h |
| 1 | Database foundation | 66h | 86h |
| 2 | Security + Frontend foundation | 127h | 213h |
| 3 | Reliability + UX avançada | 65h | 278h |
| 4+ | Qualidade / Roadmap | 130h+ | 408h+ |

*Sprint 2 pode ser executado em paralelo com 2 devs: Security (40h) ↔ Frontend (87h)*

---

## 7. Próximos Passos do Discovery

| Fase | Agente | Ação | Status |
|------|--------|------|--------|
| 1 | @architect | Análise do sistema | ✅ Completo |
| 2 | @data-engineer | *(adaptado — DB não existia)* | ✅ Pulado/Adaptado |
| 3 | @ux-design-expert | Análise frontend | ✅ Completo |
| 4 | @architect | DRAFT consolidado | ✅ Completo |
| 5 | @data-engineer | Revisão DB + schema | ✅ Completo |
| 6 | @ux-design-expert | Validação UX + esforços | ✅ Completo |
| 7 | @qa | Quality gate review | ✅ Completo |
| **8** | **@architect** | **Assessment final** | **✅ Este documento** |
| **9** | **@analyst** | **Relatório executivo** | **✅ Completo** |
| **10** | **@pm** | **Epic + Stories** | **✅ Completo** |

---

*— Aria, arquitetando o futuro 🏗️*
*@architect | Fase 8 de 10 — Brownfield Discovery — BRAINET MVP v3.0.0*
