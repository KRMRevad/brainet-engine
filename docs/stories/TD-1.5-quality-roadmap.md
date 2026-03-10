# Story TD-1.5: Qualidade e Roadmap

## Status
Draft

## Executor Assignment
```
executor: "@dev"
co_executor: "@qa"
quality_gate: "@qa"
quality_gate_tools: ["unit-tests", "integration-tests", "linting", "manual-review"]
depends_on: ["TD-1.2", "TD-1.3", "TD-1.4"]
note: "Sprint 4+ — iniciar após validação em produção dos Sprints 1-3"
```

## Story

**As a** desenvolvedor do BRAINET,
**I want** estabelecer uma suíte de testes automatizados, estabilizar a integração com Browser CDP, e preparar a base para migração para TypeScript,
**so that** o sistema possa crescer com segurança, ser mantido por um time maior, e ser resiliente a mudanças de terceiros.

## Acceptance Criteria

1. Suite de testes de unidade cobre `server/utils.js`, `server/prompt-loader.js`, `server/job-queue.js` (nova versão Supabase-backed) e `src/utils.js` — cobertura > 80% nessas unidades
2. Testes de integração cobrem os fluxos críticos: `POST /api/pipeline/start → job criado → status atualizado → job_outputs populados`; `GET /api/jobs` com paginação; `DELETE /api/jobs/:id/cancel`
3. `npm test` executa toda a suite e retorna exit code 0 em estado limpo do repositório
4. `npm run test:coverage` gera relatório de cobertura em `coverage/` — mostra % por arquivo
5. Browser CDP abstração implementada: seletores de ChatGPT, Claude.ai e Gemini extraídos de `server/browser-llm.js` para arquivo de configuração `server/browser-selectors.json` — atualizar seletores requer editar apenas o JSON, não o código
6. `server/browser-selectors.json` tem versionamento: campo `lastVerified` por plataforma (ex: `"chatgpt": { "lastVerified": "2026-02-24", "selectors": {...} }`) — permite rastrear quando seletores foram validados por última vez
7. Ao falhar por seletor não encontrado, `browser-llm.js` loga erro específico com plataforma e seletor esperado — facilita diagnóstico quando UI de terceiro muda
8. Dark/light mode toggle implementado: respeita `prefers-color-scheme` por padrão; usuário pode sobrescrever via botão na nav; preferência salva em localStorage
9. Sistema de exploração gamificado: indicador visual mostra quais nichos foram explorados (baseado em `exploration_history` do banco); ícone de check ou badge de contagem no card do nicho
10. `npm run typecheck` existe e executa `tsc --noEmit` sem erros — arquivos JavaScript migrados para TypeScript ou tipados via JSDoc, começando pelos módulos de maior risco (`server/job-queue.js`, `src/utils.js`)

## 🤖 CodeRabbit Integration

**Story Type Analysis:**
- Primary Type: Quality Engineering + Technical Infrastructure
- Secondary Type: Developer Experience + Resilience
- Complexity: Alta — TypeScript migration é incremental; Browser CDP abstraction requer mapeamento cuidadoso
- Nota: Este sprint é o mais aberto — priorizar testes (ACs 1-4) antes de tudo

**Specialized Agent Assignment:**
- Primary: @dev (testes, Browser CDP, TypeScript)
- Supporting: @qa (definição de casos de teste, cobertura mínima, smoke tests)

**Quality Gate Tasks:**
- [ ] Pre-Commit (@qa): revisar plano de testes antes de implementação
- [ ] Pre-Commit (@dev): confirmar que testes de integração usam banco de dados de teste (não produção)
- [ ] Pre-Commit (@dev): `npm test` deve passar sem conexão ao Supabase de produção (usar mocks ou env de teste)
- [ ] Pre-Commit (@dev): `npm run lint && npm run typecheck` sem erros

**CodeRabbit Focus Areas:**
- Primary: Verificar que testes testam comportamento, não implementação
- Primary: Confirmar que `browser-selectors.json` tem todos os seletores críticos mapeados
- Secondary: Verificar que tipos TypeScript são precisos (sem `any` desnecessário)

## Tasks / Subtasks

- [ ] **T1** — Configurar framework de testes (AC: 3, 4)
  - [ ] T1.1 — Instalar `vitest` (ou `jest`) como devDependency
  - [ ] T1.2 — Criar `vitest.config.js` com configuração básica (include: `src/**/*.test.js`, `server/**/*.test.js`)
  - [ ] T1.3 — Adicionar `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"` ao `package.json`
  - [ ] T1.4 — Confirmar que `npm test` funciona (mesmo sem nenhum teste ainda)

- [ ] **T2** — Testes de unidade (AC: 1)
  - [ ] T2.1 — `server/utils.test.js` (se existir) ou `src/utils.test.js`:
    - `escapeHtml()`: testa `<`, `>`, `&`, `"`, `'`
    - `renderObj()`: testa objeto simples, aninhado, e valores null
    - `sanitizeInput()`: testa caracteres de controle, truncamento
  - [ ] T2.2 — `server/prompt-loader.test.js`:
    - Testa cache hit e miss
    - Testa TTL expirado → releitura do disco
    - Usa arquivo de prompt temporário no filesystem
  - [ ] T2.3 — `server/job-queue.test.js`:
    - Mock do Supabase client com `vi.mock` / `jest.mock`
    - Testa `addJob()`, `updateJob()`, `getJob()`, `cleanup_stuck_jobs()`
    - Testa cenário de job > 90 min → marcado como `failed`
  - [ ] T2.4 — Verificar cobertura > 80% nas unidades especificadas

- [ ] **T3** — Testes de integração (AC: 2)
  - [ ] T3.1 — Configurar banco de dados de teste: Supabase local via `supabase start` ou banco separado com variáveis `TEST_SUPABASE_URL`, `TEST_SUPABASE_KEY`
  - [ ] T3.2 — `server/pipeline.integration.test.js`:
    - Teste do fluxo: POST /api/pipeline/start → verificar job no banco → simular conclusão → verificar job_outputs
    - Usar mock do `agent-executor.js` para não disparar Chrome real
  - [ ] T3.3 — `server/jobs.integration.test.js`:
    - Teste de paginação: criar 25 jobs → GET /api/jobs?page=1 → 20 jobs; page=2 → 5 jobs
    - Teste de filtros: GET /api/jobs?status=failed → apenas jobs falhos
  - [ ] T3.4 — `server/cancel.integration.test.js`:
    - Teste de cancelamento: criar job running → DELETE /api/jobs/:id/cancel → status = cancelled

- [ ] **T4** — Abstração de seletores Browser CDP (AC: 5, 6, 7)
  - [ ] T4.1 — Criar `server/browser-selectors.json`:
    ```json
    {
      "chatgpt": {
        "lastVerified": "2026-02-24",
        "inputSelector": "#prompt-textarea",
        "submitSelector": "button[data-testid='send-button']",
        "responseSelector": ".markdown.prose"
      },
      "claude": {
        "lastVerified": "2026-02-24",
        "inputSelector": ".ProseMirror",
        "submitSelector": "button[aria-label='Send message']",
        "responseSelector": ".font-claude-message"
      },
      "gemini": {
        "lastVerified": "2026-02-24",
        "inputSelector": ".ql-editor",
        "submitSelector": "button.send-button",
        "responseSelector": ".model-response-text"
      }
    }
    ```
  - [ ] T4.2 — Refatorar `server/browser-llm.js`: carregar seletores via `require('./browser-selectors.json')` em vez de strings hardcoded
  - [ ] T4.3 — Quando `page.waitForSelector(selector)` falha, lançar erro com contexto:
    ```javascript
    throw new Error(`[CDP] Seletor não encontrado na plataforma "${platform}": "${selector}". Verificar se UI foi atualizada. Última validação: ${selectors[platform].lastVerified}`);
    ```
  - [ ] T4.4 — Documentar no README como atualizar seletores quando uma plataforma mudar UI

- [ ] **T5** — Dark/light mode (AC: 8)
  - [ ] T5.1 — Em `src/styles/tokens.css`, duplicar custom properties para tema escuro:
    ```css
    :root { --bg: #0a0a0f; --text: #e8e8f0; /* dark by default */ }
    [data-theme="light"] { --bg: #f8f8fc; --text: #1a1a2e; }
    ```
  - [ ] T5.2 — Em `src/main.js`: detectar `prefers-color-scheme` e aplicar `data-theme` ao `<html>`
  - [ ] T5.3 — Adicionar botão de toggle na nav: clique alterna entre dark/light e salva em `localStorage.getItem('theme')`
  - [ ] T5.4 — Confirmar que os 8 tokens principais (bg, text, surface, accent, border, etc.) estão definidos em ambos os temas

- [ ] **T6** — Gamificação de exploração (AC: 9) *(depende de TD-1.2 DB-02)*
  - [ ] T6.1 — `GET /api/exploration/counts` retorna `{ nicho_id: count }` para o usuário atual (ou total se single-user)
  - [ ] T6.2 — Na landing view, após carregar nichos: buscar contagens e exibir badge numérico no card de cada nicho com explorações > 0
  - [ ] T6.3 — Nicho com 0 explorações: nenhum indicador (estado padrão)
  - [ ] T6.4 — Tooltip no badge: "Explorado X vez(es)"

- [ ] **T7** — Base para TypeScript / tipagem via JSDoc (AC: 10)
  - [ ] T7.1 — Instalar TypeScript e `@types/node`, `@types/express` como devDependencies
  - [ ] T7.2 — Criar `tsconfig.json` com `"allowJs": true, "checkJs": true, "noEmit": true, "strict": false` (modo JS com checagem gradual)
  - [ ] T7.3 — Adicionar `"typecheck": "tsc --noEmit"` ao `package.json`
  - [ ] T7.4 — Anotar `server/job-queue.js` com JSDoc:
    ```javascript
    /** @typedef {{ id: string, nicho_id: string, status: 'pending'|'running'|'completed'|'failed'|'cancelled', created_at: string }} Job */
    /** @param {string} jobId @returns {Promise<Job|null>} */
    async function getJob(jobId) { ... }
    ```
  - [ ] T7.5 — Anotar `src/utils.js` com JSDoc para `escapeHtml`, `renderObj`, `sanitizeInput`
  - [ ] T7.6 — `npm run typecheck` passa sem erros nos arquivos anotados

## Dev Notes

**Contexto relevante:**
- Este sprint deve ser iniciado apenas após Sprints 1-3 validados em produção — não é urgente
- A migração completa para TypeScript (.ts) está fora do escopo desta story — apenas tipagem gradual via JSDoc e configuração do `tsconfig.json`
- Para testes de integração (T3), usar o Supabase local (`supabase start`) para não poluir produção
- Browser CDP (T4) é a task de maior incerteza — os seletores mudam a cada update das plataformas; o objetivo é tornar a manutenção mais fácil, não eliminar o problema
- Dark/light mode (T5) é trivial se os tokens CSS já estiverem bem estruturados (garantido pelo TD-1.3 T13)

**Ferramentas sugeridas:**
- Test framework: `vitest` (mais leve que Jest, integra melhor com Vite)
- Coverage: `@vitest/coverage-v8`
- Mocking Supabase: `vi.mock('@supabase/supabase-js')` ou classe fake local

**Arquivos afetados:**
- `server/browser-llm.js` (abstração de seletores)
- `server/browser-selectors.json` (CRIAR)
- `server/job-queue.test.js` (CRIAR)
- `server/prompt-loader.test.js` (CRIAR)
- `server/pipeline.integration.test.js` (CRIAR)
- `server/jobs.integration.test.js` (CRIAR)
- `src/utils.test.js` (CRIAR)
- `src/main.js` (theme detection)
- `src/styles/tokens.css` (light theme vars)
- `src/views/landing.js` (badges de exploração)
- `tsconfig.json` (CRIAR)
- `vitest.config.js` (CRIAR)
- `package.json` (test scripts, devDependencies)

**Ordem de prioridade se Sprint 4 tiver budget limitado:**
1. **T1 + T2** (testes de unidade) — foundation que permite refatorar com segurança
2. **T3** (testes de integração) — fecha o loop nos fluxos críticos
3. **T4** (CDP abstração) — manutenção mais fácil, alto ROI
4. **T5** (dark/light mode) — polish
5. **T6** (gamificação) — feature adicional
6. **T7** (TypeScript base) — fundação para crescimento futuro

### Testing

- `npm test` → todos os testes passam; nenhuma falha de timeout ou conexão real ao banco
- `npm run test:coverage` → relatório mostra > 80% em utils.js, prompt-loader.js, job-queue.js
- Mudar seletor em `browser-selectors.json` → próximo pipeline usa seletor novo sem restart
- Simular seletor errado → erro loga plataforma + seletor + data de última verificação
- Alternar tema dark/light → persistido no localStorage → preservado após reload
- Ver badge numérico na landing após 3 explorações de um nicho
- `npm run typecheck` → sem erros type

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-02-24 | 1.0 | Story criada pela Fase 10 do Brownfield Discovery | @pm |

## Dev Agent Record
*(A ser preenchido pelo @dev durante implementação)*

## QA Results
*(A ser preenchido pelo @qa após implementação)*
