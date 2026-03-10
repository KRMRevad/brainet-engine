# Story TD-1.4: Reliability + UX Avançada

## Status
Draft

## Executor Assignment
```
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["linting", "manual-review", "browser-test"]
depends_on: ["TD-1.2", "TD-1.3"]
```

## Story

**As a** usuário do BRAINET,
**I want** poder cancelar pipelines em andamento, ver o sistema se recuperar de quedas de conexão, e navegar a lista de jobs com filtros e paginação,
**so that** o sistema seja confiável para uso intenso diário sem necessidade de intervenção manual.

## Acceptance Criteria

1. Interface de CRUD de nichos existe: `GET /api/nichos`, `POST /api/nichos`, `PUT /api/nichos/:id`, `DELETE /api/nichos/:id` — todos com autenticação; dados persistidos no Supabase (tabela `nichos`)
2. View de administração de nichos (`/admin/nichos`) permite: listar, adicionar nicho com subtemas/formatos/ângulos, editar nome, e desativar (soft delete) — sem editar JSON manualmente
3. Middleware de auditoria registra em tabela `usage_logs`: endpoint chamado, nicho_id (se presente), timestamp, duração da requisição — sem PII
4. Botão "Cancelar Pipeline" visível durante execução; ao clicar, envia `DELETE /api/jobs/:id` ao servidor, interrompe o processo de automação browser (Chrome), e exibe status "Cancelado" na UI
5. Conexão SSE em `pipeline.js` tem reconexão automática: se a conexão cair, tenta reconectar com backoff exponencial (1s → 2s → 4s → 8s → max 30s); após 3 tentativas, exibe botão manual "Reconectar"
6. Lista de jobs tem paginação: 20 itens por página; botões "Anterior" / "Próxima" funcionam; página atual preservada no URL (`/jobs?page=2`)
7. Lista de jobs tem filtros: por status (`pending`, `running`, `completed`, `failed`), e por texto livre (busca por nicho name) — filtros combinam com paginação; preservados no URL
8. Confirmação antes de executar pipeline: modal simples exibe nicho selecionado, modo de execução, e estimativa de duração — botões "Executar" e "Cancelar"
9. vis-network (grafo de nichos) carregado via dynamic import apenas ao entrar na Graph View — não incluído no bundle inicial
10. Rate limiting aplicado em endpoints de alta frequência: `POST /api/pipeline/start` — máximo 5 req/min por IP; retorna 429 com mensagem amigável
11. Canvas particles de `src/components/particles.js` pausam ao sair da landing view e reiniciam ao voltar — não executam em jobs, pipeline ou outras views

## 🤖 CodeRabbit Integration

**Story Type Analysis:**
- Primary Type: Reliability + UX Enhancement
- Secondary Type: Performance (lazy loading, rate limiting)
- Complexity: Média-Alta — pipeline cancellation é cirúrgica mas de alto risco; SSE reconnection é crítica

**Specialized Agent Assignment:**
- Primary: @dev (implementação)

**Quality Gate Tasks:**
- [ ] Pre-Commit (@dev): testar cancelamento de pipeline ativo — processo Chrome deve ser encerrado
- [ ] Pre-Commit (@dev): testar SSE disconnect/reconnect via DevTools Network tab
- [ ] Pre-Commit (@dev): confirmar que vis-network não está no bundle inicial (verificar `npm run build` output)
- [ ] Pre-Commit (@dev): `npm run lint` sem erros

**CodeRabbit Focus Areas:**
- Primary: Verificar que `DELETE /api/jobs/:id` realmente mata o processo de automação no browser
- Primary: Confirmar que paginação + filtros não causam N+1 queries no Supabase
- Secondary: Verificar que o backoff exponencial não cria múltiplos EventSource simultâneos

## Tasks / Subtasks

- [ ] **T1** — CRUD de nichos (AC: 1, 2)
  - [ ] T1.1 — Criar endpoints em `server/server.js` ou `server/routes/nichos.js`:
    - `GET /api/nichos` — lista todos (com subtemas, formatos, ângulos)
    - `POST /api/nichos` — cria nicho + hierarquia
    - `PUT /api/nichos/:id` — atualiza nome/dados
    - `DELETE /api/nichos/:id` — soft delete (`active = false`)
  - [ ] T1.2 — Todos os endpoints com `requireAuth` middleware
  - [ ] T1.3 — Criar `src/views/admin-nichos.js` com lista de nichos + formulário inline de edição
  - [ ] T1.4 — Adicionar rota `/admin/nichos` ao router (protegida — só acessível se autenticado)
  - [ ] T1.5 — Botão "Adicionar Nicho" abre formulário com campos: nome, subtemas (multiline), formatos, ângulos
  - [ ] T1.6 — Testar: criar nicho → aparece na landing; editar → atualiza na landing

- [ ] **T2** — Middleware de auditoria (AC: 3)
  - [ ] T2.1 — Criar migration `supabase/migrations/003_usage_logs.sql`:
    ```sql
    CREATE TABLE usage_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      endpoint TEXT NOT NULL,
      nicho_id UUID REFERENCES nichos(id),
      duration_ms INTEGER,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    ```
  - [ ] T2.2 — Criar middleware `server/middleware/audit.js` que insere em `usage_logs` após a resposta
  - [ ] T2.3 — Aplicar middleware apenas em endpoints de pipeline e exploração (não em health/auth)
  - [ ] T2.4 — Confirmar: tabela crescendo a cada pipeline executado

- [ ] **T3** — Cancelamento de pipeline (AC: 4)
  - [ ] T3.1 — Em `server/agent-executor.js`, manter referência ao processo ativo: `activeJobs.set(jobId, { process, browser })`
  - [ ] T3.2 — Implementar `DELETE /api/jobs/:id/cancel`:
    - Buscar entry em `activeJobs`
    - Fechar browser/tab puppeteer se aberto
    - Atualizar status no banco para `"cancelled"`
    - Remover de `activeJobs`
  - [ ] T3.3 — Em `src/views/pipeline.js`: exibir botão "Cancelar Pipeline" durante execução
  - [ ] T3.4 — Ao clicar, chamar `DELETE /api/jobs/:id/cancel` → mostrar status "Cancelado"
  - [ ] T3.5 — Testar: pipeline em andamento → cancelar → Chrome fecha → status atualiza

- [ ] **T4** — Reconexão SSE com backoff exponencial (AC: 5)
  - [ ] T4.1 — Em `src/views/pipeline.js`, extrair lógica SSE para função `connectToSSE(jobId)` que retorna `EventSource`
  - [ ] T4.2 — Implementar lógica de reconexão:
    ```javascript
    let retryCount = 0;
    const delays = [1000, 2000, 4000, 8000, 16000, 30000];

    function scheduleReconnect() {
      const delay = delays[Math.min(retryCount, delays.length - 1)];
      retryCount++;
      if (retryCount > 3) showReconnectButton();
      else setTimeout(() => connectToSSE(jobId), delay);
    }
    ```
  - [ ] T4.3 — No `onerror` do EventSource, chamar `scheduleReconnect()` e fechar a conexão atual
  - [ ] T4.4 — Botão "Reconectar" (aparece após 3 tentativas) chama `connectToSSE` diretamente e reseta `retryCount`
  - [ ] T4.5 — Testar via DevTools Network: offline durante pipeline → reconecta automaticamente

- [ ] **T5** — Paginação na lista de jobs (AC: 6)
  - [ ] T5.1 — `GET /api/jobs?page=1&limit=20` — implementar paginação no servidor com Supabase `.range()`
  - [ ] T5.2 — Response inclui `{ jobs: [...], total, page, limit }`
  - [ ] T5.3 — Em `src/views/jobs.js`: renderizar botões "Anterior" / "Próxima" com contagem `Página X de Y`
  - [ ] T5.4 — Página atual persistida no URL: navegar para `/jobs?page=2` carrega página 2 diretamente

- [ ] **T6** — Filtros na lista de jobs (AC: 7) *(depende de DB-01 do TD-1.2)*
  - [ ] T6.1 — `GET /api/jobs?status=failed&search=texto` — suporte a filtros no servidor
  - [ ] T6.2 — Em `src/views/jobs.js`: adicionar `<select>` de status e `<input>` de busca
  - [ ] T6.3 — Filtros preservados no URL: `/jobs?status=failed&page=1`
  - [ ] T6.4 — Combinação de filtros + paginação funciona corretamente

- [ ] **T7** — Confirmação antes do pipeline (AC: 8)
  - [ ] T7.1 — Em `src/views/pipeline.js`, antes do submit: exibir modal com:
    - Nome do nicho selecionado
    - Modo de execução (SOLO/COUNCIL/CASCADE)
    - Estimativa: "~15-40 minutos"
  - [ ] T7.2 — Botões: "Executar Agora" e "Cancelar"
  - [ ] T7.3 — Modal tem `role="alertdialog"`, `aria-modal="true"` e trap de foco

- [ ] **T8** — Lazy loading do vis-network (AC: 9)
  - [ ] T8.1 — Em `src/views/graph.js`, substituir import estático por dynamic import:
    ```javascript
    async function initGraph() {
      const { Network } = await import('vis-network');
      // ... inicialização
    }
    ```
  - [ ] T8.2 — Verificar `npm run build`: vis-network não deve aparecer no bundle principal
  - [ ] T8.3 — Skeleton loader na Graph View enquanto vis-network carrega

- [ ] **T9** — Rate limiting (AC: 10)
  - [ ] T9.1 — Instalar `express-rate-limit` (ou implementação simples com Map + timestamp)
  - [ ] T9.2 — Aplicar em `POST /api/pipeline/start`: 5 req/min por IP
  - [ ] T9.3 — Response 429: `{ error: "Muitas requisições. Aguarde antes de executar outro pipeline." }`
  - [ ] T9.4 — Frontend exibe mensagem do 429 ao usuário

- [ ] **T10** — Canvas particles por view (AC: 11)
  - [ ] T10.1 — Em `src/components/particles.js`, adicionar métodos `pause()` e `resume()`
  - [ ] T10.2 — `pause()`: cancela o `requestAnimationFrame` loop
  - [ ] T10.3 — `resume()`: reinicia o loop
  - [ ] T10.4 — Em `src/main.js`, chamar `particles.pause()` ao sair da landing view e `particles.resume()` ao voltar

## Dev Notes

**Contexto relevante:**
- T3 (cancelamento) é a task de maior risco: requer referência ao processo puppeteer ativo em memória. Se o servidor restartar durante o pipeline, a referência é perdida. Documentar esse limite no código — cleanup job é o fallback.
- Para SSE reconnection (T4), usar `EventSource` nativo (sem polyfill) — já suportado em todos os browsers modernos relevantes
- O rate limiting (T9) não precisa de Redis — Map em memória é suficiente para single-user MVP
- Lazy loading do vis-network (T8) é simples com dynamic import — verificar se Vite já faz code splitting automático para isso

**Arquivos afetados:**
- `server/server.js` (novos endpoints CRUD, rate limiting)
- `server/agent-executor.js` (activeJobs Map, cancel logic)
- `server/middleware/audit.js` (CRIAR)
- `src/views/pipeline.js` (cancelar, SSE reconnect, confirmação)
- `src/views/jobs.js` (paginação, filtros)
- `src/views/graph.js` (lazy loading)
- `src/views/admin-nichos.js` (CRIAR)
- `src/components/particles.js` (pause/resume)
- `src/main.js` (particles lifecycle)
- `supabase/migrations/003_usage_logs.sql` (CRIAR)
- `package.json` (express-rate-limit)
- `index.html` (nav link para /admin)

**Não requer:**
- Testes automatizados (Sprint 4+)
- TypeScript (Sprint 4+)
- Redesign visual (fora do escopo do epic)

### Testing

- Iniciar pipeline → clicar Cancelar → Chrome deve fechar → status = "cancelled" no banco
- Offline durante pipeline (DevTools → Network → Offline) → aguardar 3 tentativas → botão "Reconectar" aparece
- Voltar online → reconectar → pipeline resume na UI
- Criar 25 jobs de teste → lista mostra 20 → clicar "Próxima" → 5 na página 2
- Filtrar por `status=failed` → lista mostra apenas jobs falhos
- Executar `POST /api/pipeline/start` 6 vezes em 1 minuto → 6ª retorna 429
- Verificar `npm run build` → vis-network em chunk separado
- Navegar da landing para jobs → canvas particles param; voltar → reiniciam

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-02-24 | 1.0 | Story criada pela Fase 10 do Brownfield Discovery | @pm |

## Dev Agent Record
*(A ser preenchido pelo @dev durante implementação)*

## QA Results
*(A ser preenchido pelo @qa após implementação)*
