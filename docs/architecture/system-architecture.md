# BRAINET MVP — Brownfield Architecture Document

**Data:** 2026-02-23
**Versão:** 1.0
**Autor:** @architect (Aria)
**Escopo:** Documentação completa do estado atual do codebase — para Brownfield Discovery

---

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-02-23 | 1.0 | Análise brownfield inicial completa | @architect |

---

## Quick Reference — Arquivos Críticos

| Finalidade | Arquivo |
|-----------|---------|
| Entry point frontend | `src/main.js` |
| Entry point backend | `server/server.js` |
| Configuração central | `server/config.js` |
| Taxonomia de nichos | `data/nichos.json` |
| Pipeline de agentes | `server/agent-executor.js` |
| Orquestrador de IAs | `server/council.js` |
| Automação de browser | `server/browser-llm.js` |
| Client LLM API | `server/llm-client.js` |
| Fila de jobs | `server/job-queue.js` |
| Carregador de prompts | `server/prompt-loader.js` |
| Busca web | `server/web-search.js` |
| Merge de respostas | `server/merge-engine.js` |
| Dice Engine frontend | `src/dice-engine.js` |
| HTML base | `index.html` |

---

## High Level Architecture

### Resumo Técnico

BRAINET MVP é um sistema de produção de conteúdo orientado por IA. O usuário seleciona um nicho (ou usa o "Feeling Lucky" aleatório), escolhe um ângulo, e dispara um pipeline sequencial de agentes de IA que produzem pesquisa, Q&As, análise, estratégia e roteiros prontos para publicação.

**Diferencial arquitetural:** O sistema pode operar em dois modos mutuamente excludentes:
1. **AI Council** — Automação de browsers abertos (ChatGPT, Claude, Gemini) via Chrome CDP
2. **API Fallback** — Chamada direta às APIs de LLM configuradas

### Stack Tecnológico Real

| Camada | Tecnologia | Versão | Notas |
|--------|-----------|--------|-------|
| Frontend Runtime | Navegador (ES Modules) | Moderno | Sem TypeScript |
| Build Tool | Vite | ^6.0.0 | Dev na porta 5173 |
| Frontend Framework | Vanilla JS | — | SPA manual, sem React/Vue |
| Visualização de Grafos | vis-network + vis-data | ^9.1.9 / ^7.1.9 | Dependência pesada |
| Backend | Node.js | 18+ recomendado | ESM nativo (`"type":"module"`) |
| API Framework | Express | ^4.21.0 | REST + SSE |
| Comunicação real-time | SSE (Server-Sent Events) | — | Sem WebSocket |
| Browser automation | puppeteer-core | ^24.0.0 | Via CDP |
| CORS | cors | ^2.8.5 | Completamente aberto |
| Process runner | concurrently | ^9.0.0 | Dev only |
| Persistência de jobs | JSON file | — | Sem banco de dados |
| LLM APIs | OpenAI / Anthropic / Ollama | — | Configurável via env |
| Busca web | Brave Search API | — | Opcional (fallback dummy) |

### Modos de Operação dos Agentes

```
SOLO MODE      → 1 AI responde (chatgpt por padrão)
COUNCIL MODE   → 3 AIs respondem em paralelo → merge
CASCADE MODE   → 3 AIs refinam sequencialmente (A → B refina A → C refina B)
API FALLBACK   → Chrome não disponível → chama API diretamente
```

---

## Estrutura do Repositório (Real)

```
engine/
├── index.html                    # Shell HTML da SPA
├── package.json                  # brainet-mvp v3.0.0, ESM
├── vite.config.js                # Build: outDir=dist, port 3000 (⚠️ conflita com package.json)
├── .env.example                  # Template de variáveis de ambiente
├── .env                          # ⚠️ Existente (não commitado)
│
├── src/                          # Frontend (Vite/Vanilla JS)
│   ├── main.js                   # Bootstrap + Router manual
│   ├── style.css                 # CSS global (27KB — monolítico)
│   ├── dice-engine.js            # Lógica de seleção de nicho ponderada
│   ├── channel-spawner.js        # Criação de canais de conteúdo
│   ├── pipeline-runner.js        # Orquestração frontend do pipeline
│   ├── components/
│   │   └── particles.js          # Canvas background animado
│   └── views/
│       ├── landing.js            # View principal (Dice + I'm Feeling Lucky)
│       ├── graph.js              # Visualização de grafo de nichos
│       ├── niche-detail.js       # Detalhe de um nicho específico
│       ├── channel-spawner.js    # View de criação de canal
│       ├── pipeline.js           # View do pipeline em execução (SSE consumer)
│       ├── stats.js              # Estatísticas de exploração
│       └── jobs.js               # Lista de jobs
│
├── server/                       # Backend Express
│   ├── server.js                 # Entry point, rotas REST + SSE
│   ├── config.js                 # ⚠️ Config centralizada (inclui workspace hardcoded)
│   ├── agent-executor.js         # Pipeline sequencial: Agente 1→2→3→5→6
│   ├── council.js                # Orquestrador SOLO/COUNCIL/CASCADE
│   ├── browser-llm.js            # Automação Chrome via CDP (19KB — arquivo mais complexo)
│   ├── llm-client.js             # Fallback: OpenAI / Anthropic / Ollama
│   ├── job-queue.js              # Fila de jobs em memória + persistência JSON
│   ├── merge-engine.js           # Merge de respostas multi-AI
│   ├── prompt-loader.js          # Carrega prompts do Obsidian Vault externo
│   ├── web-search.js             # Brave Search API (4 pillars)
│   └── data/
│       └── jobs.json             # Persistência de jobs (gerado em runtime)
│
├── data/
│   └── nichos.json               # Taxonomia: 8 nichos, subtemas, formatos, ângulos (663 linhas)
│
├── dist/                         # Build output (vazio atualmente)
├── outputs/                      # Outputs locais (vazio — outputs vão para Obsidian)
├── docs/                         # Documentação (este arquivo)
│
├── .aios-core/                   # Framework AIOS (meta-framework de agentes)
├── .agent/                       # Definições de agentes AIOS
├── .antigravity/                 # Agentes alternativos AIOS
├── .claude/                      # Configuração Claude Code
└── node_modules/                 # Dependências
```

---

## Módulos e Responsabilidades

### Frontend

#### `src/main.js` — Router SPA
- Router manual sem biblioteca: `navigateTo(viewName, data)`
- Mapa de views: 7 views registradas
- Estado global em memória: `currentView`, `viewData`
- Bootstrap via `DOMContentLoaded`
- Atualiza stats de navegação via `dice-engine.getTaxonomyStats()`

#### `src/dice-engine.js` — Motor de Seleção
- Carrega `data/nichos.json` como módulo ES (import estático)
- `rollDice()`: seleção ponderada que penaliza nichos muito explorados
- `deepenNiche()`: seleciona subtema → formato → ângulo aleatórios
- `feelingLucky()`: rollDice + deepenNiche em sequência
- **⚠️ DÉBITO:** histórico em `localStorage` — não persiste entre dispositivos/browsers

#### `src/pipeline-runner.js` — Orquestração Frontend
- Consome SSE do backend para atualizações em tempo real
- Interface entre view pipeline e API backend

### Backend

#### `server/server.js` — API REST + SSE
Endpoints:
```
GET  /api/health                     → Status do sistema (LLM, search, council)
GET  /api/nichos                     → Retorna nichos.json completo
GET  /api/agents                     → Lista agentes do pipeline
POST /api/pipeline/start             → Cria job + inicia pipeline em background
GET  /api/pipeline/events/:jobId     → SSE stream de progresso
GET  /api/pipeline/status/:jobId     → Status do job
GET  /api/pipeline/output/:jobId     → Job completo com outputs
GET  /api/jobs                       → Lista todos os jobs
```
**⚠️ DÉBITO:** Nenhuma autenticação. CORS completamente aberto. Sem rate limiting.
**⚠️ DÉBITO:** `nichos.json` lido diretamente no servidor (duplica o import do frontend).

#### `server/config.js` — Configuração Central
- Porta backend: `3001`
- LLM configurável: `openai` | `anthropic` | `ollama` (via `LLM_PROVIDER`)
- Modelos: `gpt-4o-mini` (padrão), `gpt-4o` (heavy)
- **⚠️ DÉBITO CRÍTICO:** `workspace` hardcoded: `/Volumes/Seagate 500/Obsidian Vault/EVAD/1 BRAINET `
  - Path macOS específico para HD externo
  - Sistema quebra se o volume não estiver montado
  - Prompts dos agentes vivem neste path externo, fora do repositório
- Roteamento inteligente de agentes para modos do Council

#### `server/agent-executor.js` — Pipeline de Agentes
Pipeline definido (hardcoded):
```javascript
PIPELINE_AGENTS = [
  { id: 1, nome: 'Pesquisa Profunda',       heavy: true,  hasSearch: true },
  { id: 2, nome: 'Extração de Conhecimento', heavy: true  },
  { id: 3, nome: 'Matrix Mente Superior',    heavy: true  },
  // ⚠️ Agente 4 removido do MVP (TODO no código)
  { id: 5, nome: 'Estratégia Multicanal',    heavy: false },
  { id: 6, nome: 'Roteirista Estratégico',   heavy: true  },
]
```
- Execução sequencial: cada agente recebe o output do anterior como contexto
- Erros não param o pipeline: agente com falha retorna `[ERROR] message` e continua
- Outputs salvos no workspace Obsidian externo

#### `server/council.js` — Orquestrador de IAs
Modos de operação por agente (config.council.agentRouting):
```
Agente 1: COUNCIL → gemini lidera, combina respostas
Agente 2: CASCADE → chatgpt → claude → gemini
Agente 3: COUNCIL → claude lidera, merge estruturado
Agente 5: SOLO → chatgpt
Agente 6: CASCADE → claude → chatgpt → gemini
qa_fire:  COUNCIL → select_best
```
- Fallback automático para API se Chrome não conectar
- Usa `Promise.allSettled` para paralelismo em COUNCIL mode

#### `server/browser-llm.js` — Automação Chrome CDP
- **Arquivo mais complexo do sistema (19KB)**
- Conecta ao Chrome via `puppeteer-core` em porta CDP configurável (9225)
- Detecta tabs abertas de ChatGPT/Claude/Gemini
- Injeta prompts via DOM manipulation nas interfaces web
- **⚠️ DÉBITO CRÍTICO:** Extremamente frágil — depende de:
  - Chrome rodando com flag `--remote-debugging-port=9225`
  - Tabs específicas abertas e logadas
  - Seletores CSS das interfaces (quebra com updates das UIs)

#### `server/llm-client.js` — Fallback API
- Suporte a OpenAI, Anthropic, Ollama
- `heavy: true` → usa modelo pesado (`gpt-4o` ou `heavyModel` configurado)
- **⚠️ DÉBITO:** Anthropic hardcoda modelo `claude-sonnet-4-20250514` quando modelo não começa com "claude"

#### `server/job-queue.js` — Fila de Jobs
- Estado em memória (`let jobs = []`)
- Persistência em `server/data/jobs.json`
- **⚠️ DÉBITO:** Sem proteção contra acesso concorrente
- **⚠️ DÉBITO:** Sem limite de tamanho da fila (cresce indefinidamente)
- Job ID gerado com `timestamp + random` (não UUID)

#### `server/prompt-loader.js` — Carregador de Prompts
- Lê arquivos `.md` do Obsidian Vault externo
- Cache em memória por session (Map)
- Limpa tags Obsidian: frontmatter, wikilinks
- 13 arquivos de prompt mapeados (Agentes 1-13 + QA Fire + QA Blind)
- **⚠️ DÉBITO CRÍTICO:** Prompts não versionados junto ao código

#### `server/web-search.js` — Busca Web
- 4 pilares: `ouro` (fontes primárias), `vivas` (criadores), `popular` (cultura), `polemica` (debate)
- 5 queries por pilar, 10 resultados por query
- Fallback gracioso sem API key (resultados dummy mas pipeline funciona)

#### `server/merge-engine.js` — Merge de Respostas
3 modos de merge:
- `select_best`: scoring heurístico por comprimento, estrutura markdown, URLs
- `combine`: combina todas com ranking e seção de "pontos únicos"
- `structured`: usa melhor como base + adiciona seções únicas das outras

---

## Fluxo de Dados Principal

```
[Frontend] User clica "Run Pipeline"
    ↓
POST /api/pipeline/start { nichoId, angulo, subtema, formato, councilMode }
    ↓
[server.js] Cria Job → executePipeline() em background
    ↓
[agent-executor.js] Para cada agente (1→2→3→5→6):
    1. Web search (somente Agente 1 via Brave API)
    2. loadAgentPrompt() → lê .md do Obsidian Vault externo
    3. buildUserPrompt() → injeta contexto + outputs anteriores
    4. councilExecute() → tenta Chrome CDP, fallback para API
    5. saveAgentOutput() → escreve .md no Obsidian Vault
    6. emitProgress() → SSE para frontend
    ↓
[Frontend SSE consumer] Atualiza UI em tempo real
    ↓
[pipeline_complete event] SSE fecha, job marcado como 'complete'
```

---

## Dados: Taxonomia `nichos.json`

```
Estrutura: nichos[] → subtemas[] → formatos[] → angulos[]

8 nichos atualmente:
- espiritualidade (Anjos e Arcanjos, etc.)
- [outros 7 a explorar]

Campos de nicho:
- id, nome, emoji, cor, corSecundaria
- arquetipo, vicioCurado, virtudePromovida
- canalExistente (ex: "321.Arcanjos")
- peso (para seleção ponderada)
- exploracoes (contador manual no JSON)
```

**⚠️ DÉBITO:** `exploracoes` no JSON é estático — não atualiza dinamicamente. O contador real é no `localStorage`.

---

## Débitos Técnicos Identificados

### CRÍTICO

| ID | Débito | Área | Impacto |
|----|--------|------|---------|
| DT-01 | `workspace` hardcoded para path macOS específico (`/Volumes/Seagate 500/...`) | Backend | Sistema quebra em qualquer outro ambiente |
| DT-02 | Prompts dos agentes (13 arquivos .md) em Obsidian Vault externo, sem versionamento | Backend | Reprodutibilidade zero; perda total se HD externo falhar |
| DT-03 | `browser-llm.js` (CDP) frágil — seletores CSS das UIs de ChatGPT/Claude/Gemini quebram sem aviso | Backend | Feature principal pode parar a qualquer update das UIs |
| DT-04 | Nenhuma autenticação ou autorização nas APIs REST | Backend | Qualquer um na rede pode disparar pipelines |
| DT-05 | CORS completamente aberto (`app.use(cors())`) | Backend | Segurança em ambiente de produção |

### ALTO

| ID | Débito | Área | Impacto |
|----|--------|------|---------|
| DT-06 | Job queue sem proteção de concorrência (array em memória + write file sequencial) | Backend | Corrupção de dados sob carga |
| DT-07 | Nenhum teste (unit, integration ou E2E) | Geral | Qualquer mudança pode quebrar silenciosamente |
| DT-08 | Agente 4 removido do pipeline sem documentação ou toggle (comentário TODO) | Backend | Pipeline incompleto, intenção não clara |
| DT-09 | Conflito de porta: `vite.config.js` define port 3000, `package.json dev` usa 5173 | Frontend | Confusão durante desenvolvimento |
| DT-10 | Outputs dos jobs salvos em path externo (mesmo workspace Obsidian) — sem cópia local | Backend | Outputs perdidos se HD externo não estiver montado |

### MÉDIO

| ID | Débito | Área | Impacto |
|----|--------|------|---------|
| DT-11 | `data/nichos.json` lido diretamente no servidor e importado estaticamente no frontend | Dados | Dessincronização, dupla fonte de verdade |
| DT-12 | `exploracoes` em `nichos.json` é estático; histórico real só em localStorage | Dados | Estatísticas imprecisas, não persistidas |
| DT-13 | `src/style.css` monolítico (27KB) sem organização por componente | Frontend | Manutenção difícil, risco de colisões CSS |
| DT-14 | Sem TypeScript — sem validação de tipos em runtime | Geral | Erros em produção difíceis de rastrear |
| DT-15 | Sem ESLint ou formatador configurado | Geral | Inconsistência de código |
| DT-16 | Job ID com `timestamp + Math.random()` em vez de UUID | Backend | Colisões (improváveis mas possíveis) |
| DT-17 | Cache de prompts em memória sem TTL — reinicia a cada restart | Backend | Sem forma de recarregar prompts sem reiniciar o server |

### BAIXO

| ID | Débito | Área | Impacto |
|----|--------|------|---------|
| DT-18 | Sem rate limiting nas APIs | Backend | Abuse potencial |
| DT-19 | `slash-commands.yaml` na raiz (resquício de configuração) | Geral | Arquivo órfão |
| DT-20 | `dist/` e `outputs/` vazios commitados | Geral | Ruído no repositório |
| DT-21 | Modelo Anthropic hardcoded em `llm-client.js` quando não começa com "claude" | Backend | Silently usa modelo errado |

---

## Padrões de Código Existentes

### Padrão Consistente
- ESM nativo em todo o projeto (`import`/`export`)
- Funções nomeadas (não arrow functions) para lógica de negócio
- JSDoc em funções públicas
- `console.log` com prefixo `[ModuleName]` para rastreamento

### Padrões Inconsistentes
- Tratamento de erros: algumas funções `throw`, outras retornam string `[ERROR]`
- Views frontend: sem padrão unificado de componente
- Prompts builder: switch/case gigante em `prompt-loader.js` (6 funções separadas por agente)

---

## Integração com Serviços Externos

| Serviço | Finalidade | Arquivo de Integração | Chave de Env |
|---------|-----------|----------------------|--------------|
| Brave Search API | Pesquisa web (4 pillars) | `server/web-search.js` | `BRAVE_API_KEY` |
| OpenAI API | LLM fallback | `server/llm-client.js` | `OPENAI_API_KEY` |
| Anthropic API | LLM fallback | `server/llm-client.js` | `ANTHROPIC_API_KEY` |
| Ollama | LLM local | `server/llm-client.js` | `OLLAMA_URL` |
| Chrome CDP | Browser automation | `server/browser-llm.js` | `CHROME_DEBUG_PORT` (default: 9225) |
| Obsidian Vault | Prompts + Outputs | `server/prompt-loader.js`, `agent-executor.js` | `workspace` hardcoded |

---

## Setup de Desenvolvimento

### Comandos
```bash
npm run dev      # Frontend Vite (porta 5173)
npm run server   # Backend Express (porta 3001)
npm run start    # Ambos simultaneamente (concurrently)
npm run build    # Build Vite → dist/
npm run chrome   # Abre Chrome com CDP habilitado na porta 9225
```

### Variáveis de Ambiente Necessárias (`.env`)
```bash
# Mínimo para funcionar (API fallback sem busca):
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai

# Para busca web funcionar:
BRAVE_API_KEY=BSA...

# Para AI Council funcionar (browser CDP), sem env adicional:
# Apenas rodar: npm run chrome
# E abrir chatgpt.com, claude.ai, gemini.google.com

# Para Anthropic:
ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=anthropic

# Para Ollama local:
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
```

### Requisitos Externos (⚠️ NÃO DOCUMENTADOS no repo)
1. **HD Externo montado** em `/Volumes/Seagate 500/` — necessário para carregar prompts e salvar outputs
2. **Obsidian Vault** com estrutura `EVAD/1 BRAINET /templates/estrutural/0 Workflow e Agentes/` contendo 13 arquivos de prompt `.md`
3. **Chrome instalado** para modo AI Council

---

## Restrições e Gotchas

1. **Workspace path** — Qualquer desenvolvedor novo precisa do HD externo ou mudar `config.js` manualmente
2. **Prompts fora do repo** — Não é possível entender o comportamento dos agentes sem acesso ao Obsidian Vault
3. **Browser automation é primary** — O fallback API funciona, mas a feature central é o Council via browser
4. **Pipeline não para em erro** — `agent-executor.js` continua mesmo se um agente falhar (output = string de erro)
5. **SSE fecha após `pipeline_complete`** — Se o frontend desconectar antes, perde os eventos mas o job continua
6. **Jobs em memória** — Reiniciar o server carrega jobs do JSON, mas listeners SSE são perdidos

---

## Testes — Estado Atual

- **Unit Tests:** 0
- **Integration Tests:** 0
- **E2E Tests:** 0
- **Cobertura:** 0%
- **Linting:** Não configurado

---

## Apêndice — Roteamento do AI Council

```javascript
// Configuração em server/config.js
agentRouting: {
  1: { mode: 'council',  lead: 'gemini',   mergeMode: 'combine'       },
  2: { mode: 'cascade',  order: ['chatgpt', 'claude', 'gemini']        },
  3: { mode: 'council',  lead: 'claude',   mergeMode: 'structured'    },
  5: { mode: 'solo',     lead: 'chatgpt'                               },
  6: { mode: 'cascade',  order: ['claude', 'chatgpt', 'gemini']        },
  qa_fire: { mode: 'council', mergeMode: 'select_best'                 },
}
// Agentes sem routing explícito → defaultMode (default: 'solo')
// COUNCIL_MODE env var pode sobrescrever o defaultMode
```
