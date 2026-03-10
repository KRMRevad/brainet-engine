# Story TD-1.3: Security + Frontend Foundation

## Status
In Progress (YOLO Mode - Autonomous Development)

## Executor Assignment
```
executor: "@dev"
co_executor: "@ux-design-expert"
quality_gate: "@qa"
quality_gate_tools: ["linting", "manual-review", "browser-test", "accessibility-audit"]
depends_on: ["TD-1.2"]
```

## Story

**As a** desenvolvedor do BRAINET,
**I want** proteger as APIs do sistema e estabelecer a fundação da interface,
**so that** o sistema seja seguro, acessível e utilizável em qualquer resolução — pronto para exposição além da rede local.

## Acceptance Criteria

1. Todos os endpoints da API (`/api/*`) exigem autenticação — requisições sem credenciais retornam `401 Unauthorized`; implementação usa JWT ou session simples com secret em `.env`
2. CORS configurado com whitelist de origens — apenas `http://localhost:5173` (e variáveis de env adicionais) são aceitas; requisições de origens não autorizadas retornam `403`
3. Campos `angulo`, `subtema` e `formato` em `POST /api/pipeline/start` são sanitizados antes de serem inseridos em prompts — remoção de caracteres de controle e truncamento a 500 chars
4. Cache de prompts em `server/prompt-loader.js` tem TTL configurável via `PROMPT_CACHE_TTL_SECONDS` — após expiração, prompts são relidos do disco sem restart do servidor
5. Fallback de modelo Anthropic em `server/llm-client.js:71` loga um warning explícito quando o modelo configurado não começa com "claude" — não falha silenciosamente
6. A UI é responsiva em 3 breakpoints: mobile (320-767px), tablet (768-1023px), desktop (1024px+) — as 7 views principais são utilizáveis em cada breakpoint
7. View de output completo existe: ao clicar em um job da lista, o usuário vê o output completo (sem truncamento) de cada agente em markdown renderizado — depende de `job_outputs` do banco (TD-1.2 AC-8)
8. Skeleton loaders aparecem em todas as views assíncronas (jobs, pipeline, stats, graph) enquanto dados carregam
9. Views com fetch de APIs secundárias (`stats.js`, `graph.js`) exibem mensagem de erro amigável em caso de falha — não ficam em branco
10. O router usa `history.pushState` — navegar entre views muda a URL; botão Voltar do browser funciona; deep links funcionam após reload
11. Ao trocar de view, event listeners da view anterior são removidos — sem memory leaks de `addEventListener` acumulados
12. Animação do dado: clique durante animação a encerra imediatamente; a partir da 3ª execução na sessão, duração reduz para 800ms; com `prefers-reduced-motion`, animação é 0ms
13. Pipeline e Channel Spawner aparecem na barra de navegação principal — acessíveis por link direto, não apenas via overlay
14. CSS refatorado em 8 arquivos modulares em `src/styles/`: `tokens.css`, `base.css`, `nav.css` + 5 arquivos por view — `style.css` importa todos via `@import`
15. Escala de font-size adicionada como tokens CSS — `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl` — substituindo valores hardcoded `0.75rem` em template literals
16. Back button em `pipeline.js` tem guard: se `data.nicho` não está disponível, redireciona para home em vez de crashar
17. Empty states implementados nas 5 views que podem ter listas vazias: jobs (sem jobs), landing (sem nichos), stats (sem dados), graph (sem conexões), outputs (sem outputs)
18. Aviso proativo de Chrome no modo COUNCIL: antes de executar, banner informa que o modo requer Chrome — não apenas após tentativa falha

## 🤖 CodeRabbit Integration

**Story Type Analysis:**
- Primary Type: Security + Frontend Refactor
- Secondary Type: Accessibility + UX
- Complexity: Muito Alta — mudanças transversais em backend e frontend
- Nota: Sprint 2 pode ser dividido entre 2 devs em paralelo (Security track + Frontend track)

**Specialized Agent Assignment:**
- Primary: @dev (implementação geral)
- Supporting: @ux-design-expert (CSS modular, responsividade, empty states, skeleton loaders)

**Quality Gate Tasks:**
- [ ] Pre-Commit (@dev): confirmar que nenhum endpoint retorna 200 sem token
- [ ] Pre-Commit (@dev): confirmar que `app.use(cors())` sem restrição não existe mais
- [ ] Pre-Commit (@qa): teste de acessibilidade no resultado overlay já existente
- [ ] Pre-Commit (@dev): `npm run lint` sem erros

**CodeRabbit Focus Areas:**
- Primary: Verificar que todos os endpoints têm middleware de auth aplicado
- Primary: Verificar que sanitização de angulo/subtema/formato está antes do uso em prompts
- Secondary: Confirmar que `history.pushState` está sendo usado consistentemente
- Secondary: Verificar que cada view exporta/chama `destroy()` ou equivalente para cleanup

## Tasks / Subtasks

- [ ] **T1** — Autenticação nas APIs (AC: 1)
  - [ ] T1.1 — Adicionar `JWT_SECRET` (ou `SESSION_SECRET`) ao `.env.example`
  - [ ] T1.2 — Criar `server/auth.js`: middleware `requireAuth(req, res, next)` que valida token no header `Authorization: Bearer <token>`
  - [ ] T1.3 — Criar `POST /api/auth/login` com credencial simples (env `ADMIN_PASSWORD`) que retorna JWT com expiração de 24h
  - [ ] T1.4 — Aplicar `requireAuth` em todos os endpoints `/api/*` exceto `/api/health` e `/api/auth/login`
  - [ ] T1.5 — Frontend: interceptar 401 e redirecionar para tela de login
  - [ ] T1.6 — Armazenar token no localStorage; enviar em todas as requisições fetch

- [ ] **T2** — CORS com whitelist (AC: 2)
  - [ ] T2.1 — Adicionar `ALLOWED_ORIGINS=http://localhost:5173` ao `.env.example`
  - [ ] T2.2 — Substituir `app.use(cors())` por configuração com whitelist:
    ```javascript
    app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
      credentials: true
    }));
    ```
  - [ ] T2.3 — Testar: requisição de origem não autorizada retorna 403

- [ ] **T3** — Sanitização de campos de prompt (AC: 3)
  - [ ] T3.1 — Criar função `sanitizeInput(str, maxLen = 500)` em `src/utils.js` (ou `server/utils.js`): remove `\x00-\x1F` exceto `\n\t`, limita a `maxLen` chars
  - [ ] T3.2 — Aplicar `sanitizeInput` em `angulo`, `subtema`, `formato` em `server/server.js:59` antes de passar para o executor
  - [ ] T3.3 — Testar: payload com caracteres de controle não chega ao prompt

- [ ] **T4** — TTL no cache de prompts (AC: 4)
  - [ ] T4.1 — Adicionar `PROMPT_CACHE_TTL_SECONDS=300` ao `.env.example`
  - [ ] T4.2 — Em `server/prompt-loader.js:11`, adicionar timestamp ao cache: `{ content, cachedAt: Date.now() }`
  - [ ] T4.3 — No getter de prompt, verificar se `Date.now() - cachedAt > TTL_MS` — se expirado, reler do disco
  - [ ] T4.4 — Testar: modificar arquivo de prompt, aguardar TTL, próxima requisição usa conteúdo novo sem restart

- [ ] **T5** — Warning no fallback de modelo Anthropic (AC: 5)
  - [ ] T5.1 — Em `server/llm-client.js:71`, trocar fallback silencioso por:
    ```javascript
    console.warn(`[LLM] Modelo configurado "${model}" não começa com "claude" — usando fallback: claude-sonnet-4-20250514`);
    ```
  - [ ] T5.2 — Adicionar `ANTHROPIC_MODEL` ao `.env.example`

- [ ] **T6** — Responsividade (AC: 6)
  - [ ] T6.1 — Definir breakpoints em `src/styles/tokens.css`:
    ```css
    :root {
      --bp-mobile: 320px;
      --bp-tablet: 768px;
      --bp-desktop: 1024px;
    }
    ```
  - [ ] T6.2 — Adicionar media queries em cada view: `@media (max-width: 767px)` e `@media (768px - 1023px)`
  - [ ] T6.3 — Adaptar navegação para mobile: hamburger menu ou nav simplificada
  - [ ] T6.4 — Verificar todas as 7 views em 320px, 768px e 1280px
  - [ ] T6.5 — Elementos de input e botões com `min-height: 44px` para toque

- [ ] **T7** — View de output completo (AC: 7) *(depende de TD-1.2 AC-8)*
  - [ ] T7.1 — Criar `src/views/job-detail.js` com rota `/job/:id`
  - [ ] T7.2 — `GET /api/jobs/:id/outputs` retorna todos os outputs do banco ordenados por `agent_number`
  - [ ] T7.3 — Renderizar cada output em markdown: usar `marked` ou similar para conversão
  - [ ] T7.4 — Adicionar botão "Ver resultado completo" na lista de jobs e no pipeline view
  - [ ] T7.5 — Remover texto de truncamento ("... workspace") dos views existentes

- [ ] **T8** — Skeleton loaders (AC: 8)
  - [ ] T8.1 — Criar componente CSS `.skeleton` com animação de pulsação
  - [ ] T8.2 — Adicionar skeleton em `jobs.js`: lista de 3 cards cinzas enquanto carrega
  - [ ] T8.3 — Adicionar skeleton em `pipeline.js`: barra de progresso placeholder
  - [ ] T8.4 — Adicionar skeleton em `stats.js` e `graph.js`: área de conteúdo placeholder

- [ ] **T9** — Estados de erro em views secundárias (AC: 9)
  - [ ] T9.1 — Em `stats.js`: catch no fetch → `<div class="error-state">Não foi possível carregar estatísticas. <button>Tentar novamente</button></div>`
  - [ ] T9.2 — Em `graph.js`: mesmo padrão
  - [ ] T9.3 — Botão "Tentar novamente" chama a função de load novamente

- [ ] **T10** — History API no router (AC: 10, 11)
  - [ ] T10.1 — Refatorar `src/main.js` para usar `history.pushState(null, '', path)` ao navegar
  - [ ] T10.2 — Adicionar listener em `window.addEventListener('popstate', ...)` para tratar botão Voltar
  - [ ] T10.3 — No servidor (`server.js`), adicionar wildcard para retornar `index.html` em qualquer rota GET não-API (SPA fallback)
  - [ ] T10.4 — Cada view deve exportar função `destroy()` que remove seus event listeners
  - [ ] T10.5 — Em `src/main.js`, chamar `currentView?.destroy()` antes de renderizar nova view

- [ ] **T11** — Animação do dado com skip (AC: 12)
  - [ ] T11.1 — Em `src/views/landing.js:56`: adicionar `addEventListener('click', skipAnimation)` no elemento do dado durante animação
  - [ ] T11.2 — Contador de sessão: `sessionStorage.setItem('diceRolls', count)` — se count >= 3, usar 800ms
  - [ ] T11.3 — Verificar `window.matchMedia('(prefers-reduced-motion: reduce)')` — se true, duração = 0ms

- [ ] **T12** — Pipeline e Canais na nav (AC: 13)
  - [ ] T12.1 — Adicionar links `Pipeline` e `Canais` ao HTML da navegação principal em `index.html`
  - [ ] T12.2 — Adicionar rotas correspondentes no router
  - [ ] T12.3 — Channel Spawner acessível via rota `/canais` sem necessidade de overlay

- [ ] **T13** — CSS modular (AC: 14, 15)
  - [ ] T13.1 — Criar `src/styles/` com 8 arquivos:
    - `tokens.css` — custom properties (existentes + novos)
    - `base.css` — reset, body, tipografia base
    - `nav.css` — navegação
    - `landing.css`, `pipeline.css`, `jobs.css`, `graph.css`, `stats.css`
  - [ ] T13.2 — Mover regras CSS do monolítico `style.css` para os arquivos correspondentes
  - [ ] T13.3 — `style.css` passa a conter apenas `@import` dos 8 arquivos
  - [ ] T13.4 — Adicionar tokens de font-size: `--text-xs: 0.75rem`, `--text-sm: 0.875rem`, `--text-base: 1rem`, `--text-lg: 1.125rem`, `--text-xl: 1.25rem`
  - [ ] T13.5 — Substituir `font-size: 0.75rem` hardcoded em template literals por `var(--text-xs)` nos arquivos de view

- [ ] **T14** — Back button guard em pipeline (AC: 16)
  - [ ] T14.1 — Em `src/views/pipeline.js:83`: adicionar verificação `if (!data?.nicho) { navigate('/'); return; }` antes de usar `data.nicho`

- [ ] **T15** — Empty states (AC: 17)
  - [ ] T15.1 — `landing.js`: se `nichos` array vazio → `<div class="empty-state">Não há nichos disponíveis.</div>`
  - [ ] T15.2 — `jobs.js`: se lista vazia → `<div class="empty-state">Nenhum job encontrado. Execute um pipeline para começar.</div>`
  - [ ] T15.3 — `stats.js`, `graph.js`, `job-detail.js`: estados equivalentes

- [ ] **T16** — Aviso proativo de Chrome para COUNCIL (AC: 18)
  - [ ] T16.1 — Em `src/views/pipeline.js`, antes de submeter no modo COUNCIL, exibir banner: `"⚠️ Modo Council requer Google Chrome. Usando outro browser? O pipeline pode falhar."`
  - [ ] T16.2 — Banner tem botão "Entendi" e "Cancelar"

## Dev Notes

**Contexto relevante:**
- Este sprint pode ser dividido entre 2 developers: Track A (T1-T5, segurança) e Track B (T6-T16, frontend) — nenhuma dependência entre as tracks
- O refactor de CSS (T13) é a tarefa de maior risco de regressão — fazer em branch separado e testar visualmente cada view antes do merge
- Para markdown rendering (T7), usar `marked` (já popular) ou `showdown` — confirmar se já está no `package.json`
- `history.pushState` requer que o servidor sirva `index.html` para qualquer path GET não-API — implementar wildcard no Express
- A autenticação proposta é simples (single user, senha em env) — não é multi-user nem OAuth; suficiente para MVP single-user

**Variáveis de ambiente necessárias:**
```
JWT_SECRET=sua-chave-secreta-aqui
SESSION_SECRET=outra-chave-secreta
ADMIN_PASSWORD=senha-admin-do-sistema
ALLOWED_ORIGINS=http://localhost:5173
PROMPT_CACHE_TTL_SECONDS=300
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

**Arquivos afetados:**
- `server/server.js` (CORS, sanitização, SPA fallback)
- `server/auth.js` (CRIAR)
- `server/llm-client.js` (linha 71)
- `server/prompt-loader.js` (linha 11)
- `src/main.js` (history API, view lifecycle)
- `src/views/landing.js` (animação, empty state, Council warning)
- `src/views/pipeline.js` (back button guard, Council warning, cancel)
- `src/views/jobs.js` (skeleton, empty state)
- `src/views/stats.js` (error state, skeleton)
- `src/views/graph.js` (error state, skeleton)
- `src/views/job-detail.js` (CRIAR)
- `src/styles/` (CRIAR — 8 arquivos)
- `src/style.css` (reduzir a apenas @imports)
- `src/utils.js` (sanitizeInput)
- `index.html` (nav links)
- `package.json` (marked dependency)
- `.env.example` (novas variáveis)

**Dependência crítica:**
- T7 (view de output completo) requer TD-1.2 AC-8 (outputs salvos no banco)

### Testing

- Testar `GET /api/jobs` sem token → deve retornar 401
- Testar `POST /api/pipeline/start` com `angulo: "test\x00malicious"` → chars de controle removidos
- Verificar responsividade: redimensionar para 320px, 768px, 1280px em todas as views
- Testar botão Voltar do browser após navegar Jobs → Pipeline → Jobs
- Confirmar que recarregar `/jobs` diretamente funciona (SPA fallback)
- Testar 3 rolagens do dado: 4ª animação deve ser mais curta
- Verificar com `prefers-reduced-motion: reduce` no DevTools → animação instantânea
- Testar modo Council sem Chrome → banner de aviso aparece antes do pipeline

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-02-24 | 1.0 | Story criada pela Fase 10 do Brownfield Discovery | @pm |

## Dev Agent Record
*(A ser preenchido pelo @dev durante implementação)*

## QA Results
*(A ser preenchido pelo @qa após implementação)*
