# Technical Debt Assessment — DRAFT

**Projeto:** BRAINET MVP v3.0.0
**Data:** 2026-02-23
**Autor consolidador:** @architect (Aria)
**Status:** DRAFT — Aguardando revisão dos especialistas
**Fontes:**
- `docs/architecture/system-architecture.md` — @architect (FASE 1)
- `docs/frontend/frontend-spec.md` — @ux-design-expert (FASE 3)

> ⚠️ Este documento é um DRAFT de consolidação. Seções marcadas com ⚠️ PENDENTE requerem validação dos especialistas antes de serem consideradas definitivas.

---

## Executive Summary (Preliminar)

| Métrica | Valor |
|---------|-------|
| Total de débitos identificados | **46** |
| Críticos | **10** |
| Altos | **12** |
| Médios | **15** |
| Baixos | **9** |
| Áreas cobertas | Sistema, Frontend/UX |
| Área pendente | Database (a ser projetada — não existe ainda) |

---

## 1. Débitos de Sistema

> Fonte: `docs/architecture/system-architecture.md` — validado por @architect

### 1.1 CRÍTICOS

| ID | Débito | Arquivo | Descrição |
|----|--------|---------|-----------|
| DT-01 | Workspace path hardcoded | `server/config.js:51` | Path macOS específico `/Volumes/Seagate 500/...` — quebra em qualquer outro ambiente ou se o HD externo não estiver montado |
| DT-02 | Prompts dos agentes sem versionamento | Obsidian Vault externo | 13 arquivos `.md` de prompts fora do repositório, em HD externo. Reprodutibilidade zero; perda total se HD falhar |
| DT-03 | Browser CDP extremamente frágil | `server/browser-llm.js` | Seletores CSS das UIs de ChatGPT/Claude/Gemini podem quebrar sem aviso a qualquer update dessas plataformas |
| DT-04 | APIs sem autenticação | `server/server.js` | Todos os endpoints REST públicos sem auth. Qualquer pessoa na rede pode disparar pipelines |
| DT-05 | CORS completamente aberto | `server/server.js:8` | `app.use(cors())` sem restrição de origem |

### 1.2 ALTOS

| ID | Débito | Arquivo | Descrição |
|----|--------|---------|-----------|
| DT-06 | Job queue sem controle de concorrência | `server/job-queue.js` | Array em memória + write síncrono ao arquivo JSON. Corrupção de dados possível sob carga |
| DT-07 | Zero testes | Projeto inteiro | Sem unit, integration ou E2E tests. Cobertura: 0% |
| DT-08 | Agente 4 removido sem toggle ou documentação | `server/agent-executor.js:42` | Comentário `// Agent 4 can be skipped in MVP` — intenção não documentada, pipeline incompleto |
| DT-09 | Outputs dos jobs em path externo | `server/agent-executor.js:177` | Outputs salvos no workspace Obsidian externo. Inacessíveis se HD não estiver montado |

### 1.3 MÉDIOS

| ID | Débito | Arquivo | Descrição |
|----|--------|---------|-----------|
| DT-10 | `nichos.json` com dupla origem de verdade | `server/server.js:45`, `src/dice-engine.js:7` | Lido pelo servidor via `fs.readFile` E importado estaticamente no frontend. Dessincronização possível |
| DT-11 | Histórico de exploração apenas em localStorage | `src/dice-engine.js:10` | Não persiste entre dispositivos ou browsers. `exploracoes` no JSON é estático |
| DT-12 | Sem TypeScript | Projeto inteiro | Sem validação de tipos em runtime, erros difíceis de rastrear |
| DT-13 | Sem ESLint/formatador | Projeto inteiro | Inconsistência de código sem enforcement |
| DT-14 | Job ID não-padrão | `server/job-queue.js:39` | `timestamp + Math.random()` em vez de UUID v4 |
| DT-15 | Cache de prompts sem TTL | `server/prompt-loader.js:11` | Prompts cacheados em memória; impossível recarregar sem reiniciar o servidor |

### 1.4 BAIXOS

| ID | Débito | Arquivo | Descrição |
|----|--------|---------|-----------|
| DT-16 | Sem rate limiting | `server/server.js` | APIs sem throttle ou rate limit |
| DT-17 | Modelo Anthropic hardcoded | `server/llm-client.js:71` | Fallback silencioso para `claude-sonnet-4-20250514` quando modelo não começa com "claude" |
| DT-18 | Conflito de porta documentado | `vite.config.js` vs `package.json` | `vite.config.js` define port 3000; `package.json` usa 5173 via `--port 5173 --strictPort` |
| DT-19 | Arquivos órfãos na raiz | `/slash-commands.yaml`, `/brainet-mvp@3.0.0`, `/node` | Arquivos sem função aparente no projeto |

---

## 2. Débitos de Database

> ⚠️ PENDENTE: Revisão e proposta do @data-engineer

**Situação atual:** O projeto NÃO possui banco de dados. Toda persistência ocorre via:
- **JSON file** (`server/data/jobs.json`) — fila de jobs
- **JSON file** (`data/nichos.json`) — taxonomia estática
- **localStorage** — histórico de exploração do usuário
- **Obsidian Vault externo** — outputs dos agentes (fora do repositório)

**Débitos identificados provisoriamente por @architect:**

| ID | Débito | Área | Descrição |
|----|--------|------|-----------|
| DB-01 | Persistência de jobs em JSON flat | Dados | Sem indexação, sem query, sem transações. Escala zero |
| DB-02 | Histórico de exploração não persistido no servidor | Dados | Perdido ao trocar de dispositivo; dados valiosos para analytics |
| DB-03 | Outputs dos agentes sem storage estruturado | Dados | Arquivos `.md` soltos em path externo sem indexação ou busca |
| DB-04 | Taxonomia de nichos sem CRUD | Dados | Editar nichos requer edição manual do JSON e restart do servidor |
| DB-05 | Sem rastreabilidade de uso | Dados | Não há log de quem executou o quê, quando |

**Perguntas para @data-engineer:**
1. Supabase é a escolha certa para este projeto ou um SQLite local seria suficiente para o estágio atual?
2. Qual seria o schema mínimo para substituir os 2 JSONs existentes com integridade?
3. Os outputs dos agentes (markdown) devem ir para storage de arquivos (ex: Supabase Storage) ou coluna TEXT no banco?
4. Como modelar a taxonomia hierárquica `nichos → subtemas → formatos → ângulos` de forma eficiente?
5. Existe necessidade de multi-tenancy (múltiplos usuários) ou é single-user por design?

---

## 3. Débitos de Frontend/UX

> Fonte: `docs/frontend/frontend-spec.md` — validado por @ux-design-expert
> ⚠️ PENDENTE: Confirmação de severidade e estimativas de esforço por @ux-design-expert

### 3.1 CRÍTICOS

| ID | Débito | Arquivo | Descrição |
|----|--------|---------|-----------|
| UX-01 | `API_BASE` hardcoded | `pipeline.js`, `jobs.js`, `stats.js` | `http://localhost:3001` em 3+ arquivos. Quebra em qualquer deploy |
| UX-02 | Sem responsividade | `src/style.css` | Nenhum breakpoint definido. Inutilizável em mobile |
| UX-03 | `escapeHtml()` duplicada | `jobs.js`, `pipeline.js` | DRY violation — risco de XSS se uma cópia for atualizada e outra não |
| UX-04 | Result overlay sem acessibilidade | `src/views/landing.js:70` | Appended a `document.body` sem `role="dialog"`, sem trap de foco, sem aria |
| UX-05 | Outputs truncados na UI | `jobs.js`, `pipeline.js` | Preview limitado a 500-5000 chars; referência para "workspace" que não existe na UI |

### 3.2 ALTOS

| ID | Débito | Arquivo | Descrição |
|----|--------|---------|-----------|
| UX-06 | Sem skeleton loaders | Todas as views | Views assíncronas mostram apenas "Carregando..." |
| UX-07 | Sem estados de erro para APIs | `stats.js`, `graph.js` | Falha silenciosa em views secundárias |
| UX-08 | Sem history API no router | `src/main.js` | URLs não mudam. Back button do browser não funciona. Sem deep links |
| UX-09 | Animação do dado não cancelável | `src/views/landing.js:56` | 1800ms fixos sem opção de skip |
| UX-10 | Sem cancelamento de pipeline | `src/views/pipeline.js` | Usuário não pode parar pipeline em andamento |
| UX-11 | Sem reconexão SSE | `src/views/pipeline.js` | Queda da conexão SSE = pipeline "sumido" para o usuário |
| UX-12 | Channel Spawner e Pipeline fora da nav | `index.html` | Features principais acessíveis apenas via overlay |

### 3.3 MÉDIOS

| ID | Débito | Arquivo | Descrição |
|----|--------|---------|-----------|
| UX-13 | CSS monolítico 27KB | `src/style.css` | Sem organização por componente. Colisões CSS |
| UX-14 | Tamanhos de fonte hardcoded | Todas as views | `font-size: 0.75rem` inline em vez de tokens |
| UX-15 | Sem paginação na jobs list | `src/views/jobs.js` | Performance degradada com muitos jobs |
| UX-16 | Sem filtros na jobs list | `src/views/jobs.js` | Sem filtro por status, nicho ou data |
| UX-17 | Back button inconsistente | `src/views/pipeline.js:83` | Volta para niche-detail mas pode crashar sem `data.nicho` |
| UX-18 | Sem empty states | `src/views/landing.js` | Tela em branco se nichos não carregam |
| UX-19 | Sem confirmação antes do pipeline | `src/views/pipeline.js` | Sem resumo do que será executado |
| UX-20 | `renderObj()` inline | `src/views/pipeline.js:390` | Util duplicável deveria ser compartilhada |

### 3.4 BAIXOS

| ID | Débito | Arquivo | Descrição |
|----|--------|---------|-----------|
| UX-21 | vis-network carregado sem lazy loading | `package.json` | Bundle ~500KB carregado sempre |
| UX-22 | Sem dark/light mode | CSS global | Dark-only, sem preferência do sistema |
| UX-23 | Emojis como ícones | Toda a UI | Sem fallback, inconsistente entre SOs |
| UX-24 | Sem gamificação de exploração | `src/views/landing.js` | Sem indicador de nichos completamente explorados |
| UX-25 | Modo Council não informado proativamente | `src/views/pipeline.js` | Chrome necessário mas aviso só aparece após tentativa |

---

## 4. Perguntas para @ux-design-expert

1. A estrutura de roteamento atual (manual sem history API) justifica migração para um micro-framework como Preact/Solid, ou refatorar o router vanilla é suficiente?
2. O `vis-network` (grafo de nichos) é crítico para o produto ou pode ser substituído por uma visualização mais leve?
3. A animação de 1800ms do dado é intencional como experiência ou pode ser reduzida com opção de skip?
4. A view de Channel Spawner tem UX bem definida? Não conseguimos analisar completamente o arquivo `src/views/channel-spawner.js`.
5. O design system atual (tokens em `:root`) justifica manutenção em CSS puro ou devemos considerar Tailwind para consistência?

---

## 5. Matriz de Priorização Preliminar

> ⚠️ PENDENTE: Ajuste de estimativas pelos especialistas

| ID | Débito | Área | Severidade | Esforço Est. | Prioridade |
|----|--------|------|-----------|--------------|------------|
| DT-01 | Workspace hardcoded | Sistema | CRÍTICO | 2h | P0 |
| DT-02 | Prompts sem versionamento | Sistema | CRÍTICO | 8h | P0 |
| UX-01 | API_BASE hardcoded | Frontend | CRÍTICO | 1h | P0 |
| UX-03 | escapeHtml duplicada | Frontend | CRÍTICO | 1h | P0 |
| UX-04 | Overlay sem a11y | Frontend | CRÍTICO | 4h | P0 |
| DT-04 | APIs sem auth | Sistema | CRÍTICO | 16h | P1 |
| DT-05 | CORS aberto | Sistema | CRÍTICO | 1h | P1 |
| DT-03 | Browser CDP frágil | Sistema | CRÍTICO | 40h | P2 |
| UX-02 | Sem responsividade | Frontend | CRÍTICO | 24h | P1 |
| UX-05 | Outputs truncados | Frontend | CRÍTICO | 16h | P1 |
| DT-06 | Job queue sem concorrência | Sistema | ALTO | 8h | P1 |
| DT-07 | Zero testes | Sistema | ALTO | 40h+ | P2 |
| DB-01 | Persistência em JSON flat | Database | ALTO | 24h | P1 |
| UX-08 | Sem history API | Frontend | ALTO | 8h | P1 |
| UX-06 | Sem skeleton loaders | Frontend | ALTO | 8h | P2 |
| UX-10 | Sem cancel pipeline | Frontend | ALTO | 12h | P2 |
| UX-11 | Sem reconexão SSE | Frontend | ALTO | 6h | P2 |
| DT-12 | Sem TypeScript | Sistema | MÉDIO | 40h+ | P3 |
| UX-13 | CSS monolítico | Frontend | MÉDIO | 16h | P2 |

**Legenda:** P0 = Bloqueador / P1 = Próximo sprint / P2 = Backlog prioritário / P3 = Roadmap

---

## 6. Dependências entre Débitos

```
DT-01 (workspace hardcoded)
  └── bloqueia → DT-02 resolução (sem workspace fixo, prompts continuam externos)
  └── bloqueia → DT-09 resolução (outputs continuam em path externo)

DB-01 (persistência em JSON)
  └── bloqueia → DT-06 (concorrência) — resolver DB resolve concorrência

UX-01 (API_BASE hardcoded)
  └── precede qualquer → deploy/produção

DT-04 (APIs sem auth)
  └── bloqueia → qualquer exposição pública
```

---

## 7. Próximos Passos do Discovery

| Fase | Agente | Ação | Status |
|------|--------|------|--------|
| 1 | @architect | Análise do sistema | ✅ Completo |
| 2 | @data-engineer | Schema DB | ⏭️ Adaptado → fase 5 |
| 3 | @ux-design-expert | Análise frontend | ✅ Completo |
| 4 | @architect | Este DRAFT | ✅ Completo |
| **5** | **@data-engineer** | **Revisar seção DB + propor schema** | **✅ Completo** |
| **6** | **@ux-design-expert** | **Validar seção UX + estimar esforços** | **✅ Completo** |
| **7** | **@qa** | **Quality gate review** | **✅ Completo** |
| **8** | **@architect** | **Assessment final** | **✅ Completo** |
| **9** | **@analyst** | **Relatório executivo** | **✅ Completo** |
| **10** | **@pm** | **Epic + Stories** | **✅ Completo** |
