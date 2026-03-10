# UX/UI Specialist Review — Fase 6
## Brownfield Discovery — BRAINET MVP v3.0.0

**Agente:** @ux-design-expert (Uma)
**Data:** 2026-02-23
**Fase:** 6 de 10 — Validação Especialista UX
**Documento base:** `docs/prd/technical-debt-DRAFT.md`
**Fontes analisadas:**
- `docs/frontend/frontend-spec.md` — spec UX criada na Fase 3
- `src/style.css` — CSS global (27KB, tokens + estilos)
- `src/views/landing.js`, `pipeline.js`, `jobs.js`, `stats.js`, `graph.js`, `niche-detail.js`, `channel-spawner.js`
- `src/main.js` — router manual
- `index.html` — nav bar e estrutura base

---

## 1. Validação dos Débitos UX (UX-01 a UX-25)

### UX-01 — `API_BASE` hardcoded ✅ CONFIRMADO — Severidade: **CRÍTICO**

Presente em `pipeline.js`, `jobs.js`, `stats.js`. Confirmado: `const API_BASE = 'http://localhost:3001'` em 3 arquivos sem importação compartilhada.

**Ajuste de esforço:** **2h** (DRAFT dizia 1h — inclui criação de `src/config.js`, substituição nos 3 arquivos, teste de build)

---

### UX-02 — Sem responsividade ✅ CONFIRMADO — Severidade: **CRÍTICO**

Zero breakpoints. Largura mínima funcional: ~1024px. Afeta todas as views.

**Ajuste de esforço:** **24h** (confirmado). Escopo real: 3 breakpoints (320px, 768px, 1024px) × 7 views + nav hamburguer + result overlay adaptativo.

**Nota adicional:** O canvas de particles em `src/components/particles.js` também precisa reescalar para mobile — adicionar 2h ao escopo.

---

### UX-03 — `escapeHtml()` duplicada ✅ CONFIRMADO — Severidade: **CRÍTICO**

Confirmado em `jobs.js` e `pipeline.js`. Implementações idênticas, mas divergência futura é risco real de XSS.

**Ajuste de esforço:** **1h** — extração para `src/utils.js` + importação nos 2 arquivos. Rápido, mas deve ser P0.

---

### UX-04 — Result overlay sem acessibilidade ✅ CONFIRMADO — Severidade: **CRÍTICO**

`landing.js:70` — `document.body.appendChild(overlay)` sem `role="dialog"`, sem `aria-modal="true"`, sem trap de foco, sem gestão de foco ao fechar, sem `aria-labelledby`.

**Ajuste de esforço:** **6h** (DRAFT dizia 4h). Inclui: role + aria-modal + aria-labelledby + trap de foco (focusable elements query) + restaurar foco ao fechar + testar com leitor de tela.

---

### UX-05 — Outputs truncados na UI ✅ CONFIRMADO + AGRAVADO — Severidade: **CRÍTICO**

`jobs.js` trunca em 5000 chars com `[ver completo no workspace]`. `pipeline.js` trunca preview em 500 chars. Ambos direcionam para o Obsidian Vault externo — que é o DT-01/DT-02 do sistema. **Quando DT-01 e DB-01 forem resolvidos (workspace → banco de dados), UX-05 se torna bloqueador UX** pois os outputs terão destino mas a UI não renderiza.

**Ajuste de esforço:** **20h** (DRAFT dizia 16h). Inclui: markdown renderer (marked.js ou similar), modal/page de output completo, scroll navigation entre agentes, download como .md.

**Dependência:** DB-01 deve estar resolvido antes do UX-05 ter utilidade total.

---

### UX-06 — Sem skeleton loaders ✅ CONFIRMADO — Severidade: **ALTO**

Todas as views assíncronas mostram texto "Carregando..." ou ficam em branco.

**Ajuste de esforço:** **8h** (confirmado). Design de 5 variantes de skeleton (stats strip, jobs list, graph placeholder, niche card, pipeline steps) + animação shimmer via CSS.

---

### UX-07 — Sem estados de erro para APIs ✅ CONFIRMADO — Severidade: **ALTO**

`stats.js` e `graph.js` falham silenciosamente quando o backend está offline. O usuário vê tela em branco sem entender o que aconteceu.

**Ajuste de esforço:** **4h** (DRAFT dizia 8h — foi superestimado). Componente de erro reutilizável com mensagem + retry button. Simples.

---

### UX-08 — Sem history API no router ✅ CONFIRMADO — Severidade: **ALTO**

`main.js` usa `navigateTo()` sem `window.history.pushState`. URLs não mudam. Back/forward do browser não funcionam. Sem deep links.

**Ajuste de esforço:** **8h** (confirmado). Requer: mapeamento de rotas → URLs, `pushState` no navigateTo, `popstate` listener, parsing de URL inicial ao carregar.

---

### UX-09 — Animação do dado não cancelável ✅ CONFIRMADO — Severidade: **ALTO** (revisão: MÉDIO para uso repetido)

1800ms fixos. Em primeiro uso é UX intencional — cria antecipação. Em uso repetido é frustrante.

**Decisão de severidade:** Manter ALTO pela frequência de repetição (este é o principal gesto da UI, executado múltiplas vezes por sessão).

**Ajuste de esforço:** **3h** (DRAFT não estimou). Inclui: click-to-skip (cancela timeout restante), `prefers-reduced-motion` media query (skip completo), reduzir para 800ms a partir da 3ª execução na sessão.

---

### UX-10 — Sem cancelamento de pipeline ✅ CONFIRMADO — Severidade: **ALTO**

`pipeline.js` — sem botão de cancelamento. Pipeline pode durar 3-10 minutos.

**Ajuste de esforço:** **14h** (DRAFT dizia 12h). Inclui: endpoint `DELETE /api/pipeline/:id` no backend + kill do processo CDP + frontend cancel button + confirmação "tem certeza?" + feedback de cancelamento.

---

### UX-11 — Sem reconexão SSE ✅ CONFIRMADO — Severidade: **ALTO**

SSE com `EventSource` sem retry. Queda de conexão = pipeline "desaparece" para o usuário.

**Ajuste de esforço:** **8h** (DRAFT dizia 6h). Inclui: reconnect com backoff exponencial (1s, 2s, 4s, 8s, max 30s), indicador visual de reconexão, recuperação de estado do job via poll ao reconectar, max retry após 5 falhas.

---

### UX-12 — Channel Spawner e Pipeline fora da nav ✅ CONFIRMADO — Severidade: **ALTO**

Features principais só acessíveis via overlay ou niche-detail. Sem deep link. Usuario novo não descobre.

**Ajuste de esforço:** **4h** — Adicionar entrada na nav para `Pipeline` e `Canais` (ou sub-menu). Alternativa: tornar a landing o hub central e deixar nav como utilitário (graph/jobs/stats são secundários).

---

### UX-13 — CSS monolítico 27KB ✅ CONFIRMADO — Severidade: **MÉDIO**

27KB de CSS linear sem separação por componente. Colisões de nomes de classe.

**Ajuste de esforço:** **12h** (DRAFT dizia 16h — superestimado se feito com import statements CSS). Criar `src/styles/` com: `tokens.css`, `base.css`, `nav.css`, `landing.css`, `pipeline.css`, `jobs.css`, `graph.css`, `stats.css`.

---

### UX-14 — Tamanhos de fonte hardcoded ✅ CONFIRMADO — Severidade: **MÉDIO**

`font-size: 0.75rem` inline em template literals, não consumindo tokens. Os tokens de tipografia existem em `:root` mas não definem escala de tamanhos.

**Ajuste de esforço:** **4h** — Adicionar `--font-size-xs/sm/md/lg/xl/2xl` ao `style.css`, substituir valores inline.

---

### UX-15 — Sem paginação na jobs list ✅ CONFIRMADO — Severidade: **MÉDIO**

Lista flat de todos os jobs. Com uso intensivo (50+ jobs), a UI vai degradar.

**Ajuste de esforço:** **4h** — Paginação client-side (10 por página), navegação prev/next, "mostrando 1-10 de N".

---

### UX-16 — Sem filtros na jobs list ✅ CONFIRMADO — Severidade: **MÉDIO**

Sem filtro por status (pending/running/complete/failed), nicho ou data.

**Ajuste de esforço:** **4h** — Filter bar com select de status + select de nicho + date range picker simples.

**Dependência:** UX-16 depende de DB-01 (status `failed` não existe no JSON atual — todos ficam como `running`).

---

### UX-17 — Back button inconsistente ✅ CONFIRMADO — Severidade: **MÉDIO**

`pipeline.js:83` — back navega para niche-detail passando `data.nicho`, mas se usuário chegou via URL direta (pós UX-08), `data.nicho` será undefined → redirect para landing sem aviso.

**Ajuste de esforço:** **2h** — Guard com fallback para landing + mensagem de contexto perdido.

---

### UX-18 — Sem empty states ✅ CONFIRMADO — Severidade: **MÉDIO**

`landing.js` — se `nichos.json` não carrega (backend offline, arquivo corrompido), UI fica em branco.

**Ajuste de esforço:** **4h** — 5 empty states: nichos não carregados, jobs vazio, graph sem conexões, stats sem dados, outputs vazios.

---

### UX-19 — Sem confirmação antes do pipeline ✅ CONFIRMADO — Severidade: **MÉDIO**

Usuário clica "Executar Pipeline" e começa imediatamente sem resumo. Pipeline pode levar 10+ minutos.

**Ajuste de esforço:** **3h** (DRAFT não estimou). Step de confirmação com: nicho/subtema/ângulo/modo selecionado + duração estimada ("~8 minutos") + botão Confirmar/Cancelar.

---

### UX-20 — `renderObj()` inline ✅ CONFIRMADO — Severidade: **MÉDIO**

Util de debug duplicável em `pipeline.js:390`. Absorbido no escopo de UX-03 (criação de `src/utils.js`).

**Ajuste de esforço:** **0h autônomo** — absorvido por UX-03.

---

### UX-21 — vis-network sem lazy loading ✅ CONFIRMADO — Severidade: **BAIXO**

Bundle ~500KB carregado em todas as views, mesmo que usuário nunca visite Graph View.

**Ajuste de esforço:** **4h** — Dynamic import: `const { Network } = await import('vis-network')` apenas quando Graph View é ativada + loading state.

---

### UX-22 — Sem dark/light mode ✅ CONFIRMADO — Severidade: **BAIXO**

Dark-only. `prefers-color-scheme: light` não implementado.

**Ajuste de esforço:** **8h** — Variáveis CSS já em `:root`. Criar `@media (prefers-color-scheme: light)` override + toggle manual com localStorage.

---

### UX-23 — Emojis como ícones ✅ CONFIRMADO — Severidade: **BAIXO** (revisão da proposta)

Emojis em botões sem `aria-label` são inacessíveis. Substituição completa por SVG seria esforço grande.

**Proposta revisada:** Manter emojis (fazem parte da identidade visual do BRAINET) mas adicionar `aria-label` em todos os botões com emoji. Custo muito menor.

**Ajuste de esforço:** **2h** (DRAFT dizia 4h para substituição — manter emojis + aria-labels é suficiente).

---

### UX-24 — Sem gamificação de exploração ✅ CONFIRMADO — Severidade: **BAIXO**

Sem indicador de nichos completamente explorados (todos os ângulos já vistos).

**Ajuste de esforço:** **6h** — Barra de progresso por nicho + badge "Explorado" + integração com DB de exploration_history (depende de DB-02).

**Dependência:** Requer DB-02.

---

### UX-25 — Modo Council sem aviso proativo ✅ CONFIRMADO — Severidade: **BAIXO**

Chrome + AI tabs necessários para COUNCIL/CASCADE. Aviso só aparece após tentativa de execução.

**Ajuste de esforço:** **2h** — Detectar modo COUNCIL/CASCADE ao selecionar + verificar status do Chrome via health check + mostrar warning inline.

---

## 2. Novos Débitos Identificados

### UX-26 — NOVO: Event listeners não removidos ao trocar de view — Severidade: **MÉDIO**

**Descoberta (`frontend-spec.md`, Seção 11):** Views são substituídas via `innerHTML` do container mas event listeners adicionados diretamente nos elementos criados persistem em closures. Com navegação intensa, possíveis memory leaks.

**Evidência:** Pipeline view adiciona listener no SSE `EventSource` sem `removeEventListener` ao sair da view.

**Esforço:** **8h** — Padrão de cleanup: cada view exporta `destroy()` que remove listeners. Integrar no router.

---

### UX-27 — NOVO: Canvas de particles ativo em todas as views — Severidade: **BAIXO**

**Descoberta (`frontend-spec.md`, Seção 10):** `src/components/particles.js` (canvas animado) está sempre ativo, inclusive em views de jobs e stats que não se beneficiam da animação.

**Impacto:** CPU/GPU consumidos desnecessariamente, especialmente em laptops com bateria.

**Esforço:** **2h** — Pausar animação em views não-landing (`cancelAnimationFrame`), retomar ao voltar para landing.

---

## 3. Respostas às Perguntas de @architect

### Pergunta 1: Micro-framework vs vanilla router?

**Resposta: Refatorar o router vanilla — NÃO migrar para framework no MVP**

Análise:

| Critério | Preact/Solid | Vanilla Refatorado |
|---|---|---|
| Esforço de migração | ~120h (reescrever 7 views) | ~8h (history API) |
| Risco de regressão | Alto (reescrever tudo) | Baixo (mudança isolada) |
| Benefício para MVP | Componentes reutilizáveis | Deep links funcionando |
| Compatibilidade com design tokens | Neutra | Nativa (tokens CSS já existem) |
| Decisão de migração futura | Não prejudicada | Não prejudicada |

**O caso para framework seria válido SE:**
- O projeto escalar para time de 3+ devs
- Forem criados 10+ componentes novos
- Houver necessidade de SSR

Para um single-user tool com 7 views existentes, o ROI não justifica. **Implementar history API + cleanup de listeners (UX-08 + UX-26) entrega 80% do benefício do framework.**

---

### Pergunta 2: vis-network é crítico ou substituível?

**Resposta: Manter vis-network com lazy loading (UX-21)**

O Graph View tem valor real para o produto:
- Visualiza o universo de nichos/subtemas de forma navegável
- Permite ao usuário "ver o mapa" antes de explorar
- Diferencial visual do BRAINET

**Mas:** 500KB carregado em todas as views é indefensável.

**Solução:** Dynamic import `import('vis-network')` apenas quando Graph View é ativada. Custo: 4h. Benefício: bundle inicial reduz ~500KB → ~50KB de diferença no load time.

**Substituição alternativa:** D3.js force graph seria ~50KB mas requer reimplementação completa. Não justifica o esforço no MVP.

---

### Pergunta 3: Animação de 1800ms — intencional ou reduzível?

**Resposta: Intencional — mas precisa de skip e respeito ao `prefers-reduced-motion`**

A animação do dado É o produto. É o primeiro gesto, cria antecipação, define o tom lúdico do BRAINET. Remover seria perda de identidade.

**Porém há dois problemas reais:**
1. **Repetição:** Usuário típico executa o dado 5-15x por sessão. 1800ms × 10 = 30 segundos gastos em animação
2. **Acessibilidade:** `prefers-reduced-motion` não é respeitado — violação WCAG 2.3.3

**Proposta (UX-09 revisado):**
- Primeira execução na sessão: 1800ms (experiência completa)
- Execuções seguintes: 800ms (snappy)
- `prefers-reduced-motion: reduce` → 0ms (resultado instantâneo)
- Click durante animação → skip para resultado imediatamente

---

### Pergunta 4: Channel Spawner tem UX bem definida?

**Resposta: NÃO — Channel Spawner é a view menos definida do sistema**

Análise do `src/views/channel-spawner.js`:
- Acessível apenas via overlay result ou niche-detail (não tem rota própria)
- Propósito: criar um "canal" baseado em nicho/ângulo selecionado
- O que faz exatamente: **não está totalmente claro no código atual**
- Parece gerar uma estrutura de conteúdo para um canal (YouTube/Instagram?), mas output vai para workspace externo (DT-01)

**Problemas de UX:**
1. Sem rota própria → sem deep link (relacionado a UX-08)
2. Não aparece na nav (relacionado a UX-12)
3. Output vai para path externo — dead-end na UI (relacionado a UX-05 + DT-01)
4. Fluxo de volta da view não está documentado

**Recomendação:** Channel Spawner precisa de um redesign de fluxo completo **após** DB-01 e DT-01 serem resolvidos (porque o output precisa ter destino na UI). Não é prioridade para o sprint atual.

---

### Pergunta 5: CSS custom properties vs Tailwind?

**Resposta: Manter CSS custom properties — NÃO adicionar Tailwind no MVP**

O design system atual tem uma base excelente:
- Tokens de cor, espaçamento, tipografia, border-radius, sombras, animações — todos definidos
- Nomenclatura consistente (`--bg-primary`, `--space-md`, `--radius-lg`)
- 8 cores temáticas por nicho já mapeadas

**O problema NÃO é o sistema de tokens. O problema é a inconsistência de consumo:**
- Alguns estilos usam tokens via `var(--)`
- Outros têm valores hardcoded inline em template literals

**Por que NÃO Tailwind:**
- Requer reescrever ~100% do HTML/CSS gerado por template literals
- Classes utilitárias não funcionam bem com HTML gerado dinamicamente via `innerHTML`
- Adicionaria ~30KB de CSS não-utilizado (sem purging eficiente no vanilla JS)

**Solução: criar classes utilitárias CSS próprias baseadas nos tokens:**
```css
/* src/styles/utils.css */
.flex { display: flex; }
.gap-md { gap: var(--space-md); }
.text-accent { color: var(--text-accent); }
.font-size-sm { font-size: var(--font-size-sm); }
```
Custo: 4h. Resolve a inconsistência sem dependência externa.

---

## 4. Estimativas de Esforço — Revisão Completa

### P0 — Bloqueadores

| ID | Débito | Esforço DRAFT | Esforço Revisado | Delta |
|----|--------|--------------|-----------------|-------|
| UX-01 | API_BASE hardcoded | 1h | **2h** | +1h |
| UX-03 | escapeHtml duplicada | 1h | **1h** | = |
| UX-04 | Overlay sem a11y | 4h | **6h** | +2h |
| **Subtotal P0** | | **6h** | **9h** | **+3h** |

### P1 — Próximo Sprint

| ID | Débito | Esforço DRAFT | Esforço Revisado | Delta |
|----|--------|--------------|-----------------|-------|
| UX-02 | Sem responsividade | 24h | **26h** | +2h (particles) |
| UX-05 | Outputs truncados | 16h | **20h** | +4h (markdown renderer) |
| UX-08 | Sem history API | 8h | **8h** | = |
| UX-10 | Sem cancelamento pipeline | 12h | **14h** | +2h (backend) |
| UX-11 | Sem reconexão SSE | 6h | **8h** | +2h (recovery state) |
| **Subtotal P1** | | **66h** | **76h** | **+10h** |

### P2 — Backlog Prioritário

| ID | Débito | Esforço DRAFT | Esforço Revisado | Delta |
|----|--------|--------------|-----------------|-------|
| UX-06 | Sem skeleton loaders | 8h | **8h** | = |
| UX-07 | Sem estados de erro | — | **4h** | novo |
| UX-09 | Animação não cancelável | — | **3h** | novo |
| UX-12 | Channel Spawner/Pipeline fora nav | — | **4h** | novo |
| UX-13 | CSS monolítico | 16h | **12h** | -4h |
| UX-14 | Font-size hardcoded | — | **4h** | novo |
| UX-17 | Back button inconsistente | — | **2h** | novo |
| UX-18 | Sem empty states | — | **4h** | novo |
| UX-19 | Sem confirmação pipeline | — | **3h** | novo |
| UX-26 | Listeners não removidos (NEW) | — | **8h** | novo |
| **Subtotal P2** | | **24h** | **52h** | **+28h** |

### P3 — Roadmap / Low Priority

| ID | Débito | Esforço DRAFT | Esforço Revisado | Delta |
|----|--------|--------------|-----------------|-------|
| UX-15 | Sem paginação jobs | — | **4h** | novo |
| UX-16 | Sem filtros jobs | — | **4h** | novo |
| UX-20 | renderObj() inline | — | **0h** | absorvido UX-03 |
| UX-21 | vis-network sem lazy load | — | **4h** | novo |
| UX-22 | Sem dark/light mode | — | **8h** | novo |
| UX-23 | Emojis sem aria-label | — | **2h** | novo (revisado) |
| UX-24 | Sem gamificação | — | **6h** | novo |
| UX-25 | Council sem aviso proativo | — | **2h** | novo |
| UX-27 | Particles sempre ativos (NEW) | — | **2h** | novo |
| **Subtotal P3** | | **0h estimado** | **32h** | novo |

### Totais

| Nível | Esforço DRAFT | Esforço Revisado |
|-------|--------------|-----------------|
| P0 (Bloqueadores) | 6h | **9h** |
| P1 (Próximo sprint) | 66h | **76h** |
| P2 (Backlog prio) | 24h | **52h** |
| P3 (Roadmap) | não estimado | **32h** |
| **TOTAL UX** | **~96h** | **169h** |

---

## 5. Novas Dependências Identificadas

```
UX-05 (outputs truncados)
  └── depende de → DB-01 (banco de dados para outputs)
  └── depende de → DT-01 (workspace path resolvido)

UX-08 (history API)
  └── habilita → UX-17 (back button fix)
  └── habilita → UX-12 (Channel Spawner com rota própria)

UX-03 (escapeHtml utils)
  └── absorve → UX-20 (renderObj inline)

UX-24 (gamificação exploração)
  └── depende de → DB-02 (exploration_history)

UX-16 (filtros jobs)
  └── depende de → DB-01 (status "failed" não existe no JSON atual)

UX-26 (cleanup listeners)
  └── habilita → UX-08 (router history sem memory leaks)
```

---

## 6. Métricas de Impacto — Design System

| Métrica | Estado Atual | Pós-Remediação |
|---------|-------------|---------------|
| Tokens definidos em `:root` | ✅ 40+ tokens | Manter + adicionar escala de tipografia |
| Tokens consumidos nas views | ❌ ~30% das ocorrências | Meta: 90%+ |
| CSS custom properties vs inline | ~40% inline | Meta: <5% inline |
| Arquivos CSS | 1 monolítico (27KB) | 8 modulares (~3KB cada) |
| Violações WCAG AA críticas | 4 | 0 (pós P0+P1) |
| Views sem skeleton | 5/5 | 0/5 (pós P2) |
| Views responsivas | 0/5 | 5/5 (pós P1) |

---

## 7. Descobertas Adicionais

| Achado | Impacto | Ação |
|--------|---------|------|
| Channel Spawner não tem fluxo documentado | UX indefinida | Redesign pós DB-01 |
| Canvas particles sem pause por view | CPU waste | UX-27 (P3) |
| `prefers-reduced-motion` não respeitado | WCAG 2.3.3 | Incluído em UX-09 |
| Pipeline view sem guard contra `data.nicho undefined` | Possível crash silencioso | Incluído em UX-17 |
| `font-size` inline em template literals impede tokens | Inconsistência sistêmica | UX-14 (P2) |
| Checklist de handoff da Fase 3: wireframes do estado ideal NÃO criados | Gap de especificação | Criar pós-discovery (Fase 10) |

---

## 8. Recomendação Final para @architect

**Quick wins absolutos (total 9h — P0):**
- UX-01, UX-03, UX-04 são intervenções cirúrgicas de menos de um dia cada
- Executáveis antes de qualquer outra mudança, sem dependências

**Sprint de Fundação UX (total 76h — P1):**
- UX-02 (responsividade) + UX-08 (history API) + UX-05 (outputs) + UX-10 + UX-11
- **Só iniciar UX-05 depois de DB-01 estar em staging**

**Backlog Prioritário (total 52h — P2):**
- Iniciar UX-26 (cleanup listeners) JUNTO com UX-08 (history API) — são inseparáveis
- UX-13 (CSS modular) pode ser feito em paralelo por um desenvolvedor diferente

**Channel Spawner:** não redesenhar até DT-01 + DB-01 estarem resolvidos. A UX da feature depende do destino dos outputs.

**CSS:** manter custom properties. Criar classes utilitárias próprias baseadas nos tokens (4h). Não adicionar Tailwind.

---

*— Uma, desenhando com empatia 💝*
*@ux-design-expert | Fase 6 de 10 — Brownfield Discovery — BRAINET MVP v3.0.0*
