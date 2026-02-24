# Database Specialist Review — Fase 5
## Brownfield Discovery — BRAINET MVP v3.0.0

**Agente:** @data-engineer (Dara)
**Data:** 2026-02-23
**Fase:** 5 de 10 — Revisão Especialista DB
**Documento base:** `docs/prd/technical-debt-DRAFT.md`
**Fontes analisadas:**
- `server/data/jobs.json` — estrutura real dos dados em produção
- `data/nichos.json` — taxonomia hierárquica (663 linhas, 8 nichos)
- `server/job-queue.js` — mecanismo de persistência atual
- `server/config.js` — configuração do workspace externo
- `.env.example` — variáveis de ambiente já planejadas

---

## 1. Validação dos Débitos DB (DB-01 a DB-05)

### DB-01 — Persistência de jobs em JSON flat ✅ CONFIRMADO — Severidade: **CRÍTICO** (elevado de ALTO)

**Validação:** Confirmado e agravado. Análise do `jobs.json` em produção revelou problemas adicionais não documentados no DRAFT:

| Problema adicional | Evidência |
|---|---|
| Jobs "running" permanentemente | 4 de 5 jobs estão em `"status": "running"` — presos desde reinício do servidor |
| `duration` como string | `"duration": "77.7s"` — impossível fazer queries por duração |
| Sem mecanismo de cleanup | Jobs travados nunca são marcados como `failed` |
| Outputs inline gigantes | Output do agente 1 do job `job_1771614173655` tem 2353 chars — cresce com uso |
| Erros duplicados | `outputs["1"]` contém `"[ERROR] No AI tabs..."` E `errors[]` também registra — dupla fonte de verdade |

**Severidade elevada para CRÍTICO:** Corrompimento de dados e impossibilidade de auditoria em produção tornam isto bloqueador para qualquer crescimento de uso.

**Esforço revisado:** 40h (era 24h) — schema + migração + refactor completo de `job-queue.js`

---

### DB-02 — Histórico de exploração não persistido no servidor ✅ CONFIRMADO — Severidade: **ALTO**

**Validação:** Confirmado. O campo `exploracoes` em `nichos.json` é um contador estático (ex: `"exploracoes": 12`). Nenhuma granularidade — impossível saber qual subtema/ângulo foi explorado, quando, ou quantas vezes.

**Esforço revisado:** 8h — tabela + endpoint POST + atualizar frontend

---

### DB-03 — Outputs dos agentes sem storage estruturado ✅ CONFIRMADO — Severidade: **ALTO**

**Validação:** Confirmado e parcialmente resolvido pelo DB-01. Os outputs estão inline no `jobs.json` (dentro do JSON flat). Ao migrar para DB relacional, os outputs naturalmente ganham tabela separada `job_outputs`. O problema do Obsidian Vault (path hardcoded) é cobertura do DT-02/DT-09.

**Esforço revisado:** 0h autônomo — absorvido pelo DB-01 (tabela `job_outputs`)

---

### DB-04 — Taxonomia de nichos sem CRUD ✅ CONFIRMADO — Severidade: **MÉDIO**

**Validação:** Confirmado. Para adicionar/editar um ângulo, o usuário precisa editar `data/nichos.json` manualmente (663 linhas) e reiniciar o servidor. A estrutura hierárquica profunda (`nichos → subtemas → formatos → ângulos`) torna edições manuais especialmente propensas a erros.

**Esforço revisado:** 16h — migração da hierarquia + endpoints CRUD básicos

---

### DB-05 — Sem rastreabilidade de uso ✅ CONFIRMADO — Severidade: **MÉDIO**

**Validação:** Confirmado. Não existe log de execuções, métricas de quais ângulos são mais explorados, taxas de erro por agente, nem rastreio de qual modo (SOLO/COUNCIL/CASCADE) foi usado. O campo `errors[]` existe mas não é consultável sem carregar o arquivo inteiro.

**Esforço revisado:** 8h — middleware de logging + tabela de auditoria

---

### DB-06 — NOVO DÉBITO IDENTIFICADO — Jobs travados sem recovery automático — Severidade: **ALTO**

**Descoberta:** Todos os 4 jobs com status `"running"` têm `updatedAt` de 3+ dias atrás. Após reinício do servidor, nenhum mecanismo marca esses jobs como `failed`. O usuário vê jobs "em execução" que nunca terminam.

| Job ID | Status | Última atualização |
|---|---|---|
| `job_1771614173655_n2zkd2` | running | 2026-02-20T19:09:27 |
| `job_1771608326683_sdrub9` | running | 2026-02-20T17:45:00 |
| `job_1771578831857_wgndfo` | running | 2026-02-20T09:13:51 |
| `job_1771578623077_iieg5q` | running | 2026-02-20T09:10:23 |

**Solução:** Stored procedure ou cron job que marca como `failed` jobs com `updated_at < NOW() - INTERVAL '30 minutes'` e `status = 'running'`.

**Esforço:** 4h — função SQL + pg_cron ou endpoint de cleanup

---

## 2. Respostas às Perguntas de @architect

### Pergunta 1: Supabase vs SQLite — qual escolher?

**Resposta: Supabase (PostgreSQL gerenciado)**

Justificativa técnica:

| Critério | SQLite | Supabase |
|---|---|---|
| **Dependência de HD externo** | Elimina o HD, mas cria dependência de arquivo local | Elimina AMBAS as dependências (HD e arquivo local) |
| **Concorrência** | Write locks frequentes sob carga (agrava DT-06) | MVCC do PostgreSQL — sem write locks em reads |
| **Já no `.env.example`** | Não planejado | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` já presentes |
| **SSE como recurso** | Necessita polling ou implementação própria | Supabase Realtime substitui o SSE atual |
| **Storage de arquivos** | Necessita outro serviço | Supabase Storage nativo para outputs grandes |
| **Custo atual** | Free (arquivo) | Free tier (500MB DB + 1GB Storage) — suficiente para MVP |
| **Evolução** | Migração futura complexa | Já está na stack planejada do projeto |

**Conclusão:** SQLite seria uma solução temporária que criaria um terceiro débito a resolver. Supabase é o destino planejado — ir direto.

---

### Pergunta 2: Schema mínimo para substituir os 2 JSONs com integridade

**Ver Seção 3 abaixo** (DDL completo).

Schema mínimo: **7 tabelas** (nichos, subtemas, formatos, angulos, jobs, job_agents, job_outputs) + 2 opcionais (job_errors, exploration_history).

---

### Pergunta 3: Outputs dos agentes — Supabase Storage ou coluna TEXT?

**Resposta: TEXT no banco (por agora), com caminho para Storage se necessário**

Análise dos dados reais:
- Output mais longo observado em produção: **2353 chars** (~2.3KB)
- PostgreSQL TEXT suporta até 1GB — sem limitação prática
- Full pipeline completo (6 agentes): estimativa máxima ~50KB por job
- Supabase Storage adiciona latência de rede + lógica de upload/download para dados pequenos

**Recomendação:** Coluna TEXT em `job_outputs.content`. Adicionar flag `content_type` para future-proofing:
```sql
content_type TEXT DEFAULT 'inline' CHECK (content_type IN ('inline', 'storage_url'))
```
Se outputs ultrapassarem 100KB regularmente, migrar para Storage sem breaking change.

---

### Pergunta 4: Como modelar a taxonomia hierárquica?

**Resposta: 4 tabelas normalizadas com UUIDs, IDs slug preservados em `nichos`**

Estratégia:
- `nichos` mantém `id TEXT` (slug) como PK — preserva backward compatibility com `nichoId` nos jobs
- `subtemas`, `formatos`, `angulos` usam `UUID` gerado — não têm slugs únicos globais
- Foreign keys garantem integridade referencial
- Soft-delete via `deleted_at` para manter histórico de jobs que referenciam ângulos removidos

Para queries de navegação (frontend do dice engine):
```sql
-- Buscar todos os ângulos de um nicho + subtema + formato
SELECT a.texto
FROM angulos a
JOIN formatos f ON a.formato_id = f.id
JOIN subtemas s ON f.subtema_id = s.id
WHERE s.nicho_id = 'temperanca'
  AND s.slug = 'equilibrio-alimentar'
  AND f.slug = 'longform-video';
```

Para compatibilidade com o frontend atual que consome JSON, adicionar uma **view materializada**:
```sql
CREATE MATERIALIZED VIEW nichos_json AS
SELECT jsonb_build_object(
  'id', n.id, 'nome', n.nome, ...
  'subtemas', (SELECT jsonb_agg(...) FROM subtemas s WHERE s.nicho_id = n.id)
) AS data
FROM nichos n;
```

---

### Pergunta 5: Multi-tenancy ou single-user?

**Resposta: Single-user por design, mas preparar coluna `user_id` para future-proofing**

Análise:
- O Browser CDP (Agente Council) requer Chrome aberto no host local — arquiteturalmente impossível de ser multi-tenant sem mudança fundamental
- O MVP é explicitamente single-user (1 criador de conteúdo)

**Recomendação:** Não implementar auth no MVP. Mas adicionar coluna `user_id UUID` nullable em `jobs` e `exploration_history` — quando auth for adicionado (pós-MVP), um simples `UPDATE` e RLS policy habilita multi-tenancy sem schema change.

```sql
-- Por agora: nullable, sem constraint de FK para auth.users
-- Futuro: ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
ALTER TABLE jobs ADD COLUMN user_id UUID;
```

---

## 3. Schema Proposto — DDL Completo

```sql
-- ============================================================
-- BRAINET MVP v3.0.0 — Schema PostgreSQL / Supabase
-- @data-engineer (Dara) — 2026-02-23
-- Fase 5 — Brownfield Discovery
-- ============================================================

-- -------------------------
-- TAXONOMIA DE CONTEÚDO
-- -------------------------

CREATE TABLE nichos (
  id           TEXT PRIMARY KEY,                    -- slug (ex: "temperanca")
  nome         TEXT NOT NULL,
  emoji        TEXT,
  cor          TEXT,
  cor_secundaria TEXT,
  arquetipo    TEXT,
  vicio_curado TEXT,
  virtude_promovida TEXT,
  canal_existente   BOOLEAN DEFAULT false,
  peso         INTEGER DEFAULT 1,
  exploracoes  INTEGER DEFAULT 0,                   -- migrar de JSON; incrementar via trigger
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ                          -- soft delete
);

COMMENT ON TABLE nichos IS 'Nichos de conteúdo do BRAINET. ID é o slug (ex: temperanca).';

CREATE TABLE subtemas (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug      TEXT NOT NULL,
  nicho_id  TEXT NOT NULL REFERENCES nichos(id) ON DELETE RESTRICT,
  nome      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (slug, nicho_id)
);

CREATE INDEX idx_subtemas_nicho ON subtemas(nicho_id);

CREATE TABLE formatos (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug       TEXT NOT NULL,
  subtema_id UUID NOT NULL REFERENCES subtemas(id) ON DELETE RESTRICT,
  nome       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (slug, subtema_id)
);

CREATE INDEX idx_formatos_subtema ON formatos(subtema_id);

CREATE TABLE angulos (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  formato_id UUID NOT NULL REFERENCES formatos(id) ON DELETE RESTRICT,
  texto      TEXT NOT NULL,                         -- ex: "Açúcar: o vício mais aceito do mundo"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_angulos_formato ON angulos(formato_id);

-- -------------------------
-- JOBS (substitui jobs.json)
-- -------------------------

CREATE TABLE jobs (
  id           TEXT PRIMARY KEY,                    -- manter formato existente durante migração
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  nicho_id     TEXT REFERENCES nichos(id),
  nicho_nome   TEXT NOT NULL,                       -- desnormalizado p/ histórico
  subtema      TEXT NOT NULL,
  formato      TEXT NOT NULL,
  angulo       TEXT NOT NULL,
  current_agent INTEGER,
  duration_ms  INTEGER,                             -- era string "77.7s" — converter para ms
  user_id      UUID,                                -- nullable: preparação para auth futuro
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_status    ON jobs(status);
CREATE INDEX idx_jobs_nicho_id  ON jobs(nicho_id);
CREATE INDEX idx_jobs_created   ON jobs(created_at DESC);

COMMENT ON COLUMN jobs.duration_ms IS 'Duração em milissegundos. Migrado de string "77.7s".';

-- -------------------------
-- AGENTES POR JOB
-- -------------------------

CREATE TABLE job_agents (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id       TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  agent_num    INTEGER NOT NULL CHECK (agent_num BETWEEN 1 AND 6),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'running', 'complete', 'error')),
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  output_length INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, agent_num)
);

CREATE INDEX idx_job_agents_job_id ON job_agents(job_id);

-- -------------------------
-- OUTPUTS DOS AGENTES
-- -------------------------

CREATE TABLE job_outputs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id       TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  agent_num    INTEGER NOT NULL,
  content      TEXT NOT NULL,                       -- markdown; TEXT suporta até 1GB
  content_type TEXT DEFAULT 'inline'
               CHECK (content_type IN ('inline', 'storage_url')), -- future: Supabase Storage
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, agent_num),
  FOREIGN KEY (job_id, agent_num) REFERENCES job_agents(job_id, agent_num)
);

COMMENT ON COLUMN job_outputs.content_type IS
  'inline = conteúdo direto no banco. storage_url = URL do Supabase Storage (para outputs > 100KB).';

-- -------------------------
-- ERROS DOS JOBS
-- -------------------------

CREATE TABLE job_errors (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id     TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  agent_num  INTEGER,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_errors_job_id ON job_errors(job_id);

-- -------------------------
-- HISTÓRICO DE EXPLORAÇÃO
-- (migrar de localStorage)
-- -------------------------

CREATE TABLE exploration_history (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nicho_id   TEXT NOT NULL REFERENCES nichos(id),
  subtema    TEXT,
  formato    TEXT,
  angulo     TEXT,
  user_id    UUID,                                  -- nullable: preparação para auth
  explored_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exploration_nicho    ON exploration_history(nicho_id);
CREATE INDEX idx_exploration_explored ON exploration_history(explored_at DESC);

-- -------------------------
-- FUNÇÕES DE SUPORTE
-- -------------------------

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER nichos_updated_at
  BEFORE UPDATE ON nichos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Cleanup: marcar jobs travados como failed (DB-06)
-- Executar via pg_cron a cada 5 minutos OU endpoint /api/jobs/cleanup
CREATE OR REPLACE FUNCTION cleanup_stuck_jobs()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE jobs
  SET status = 'failed', updated_at = NOW()
  WHERE status = 'running'
    AND updated_at < NOW() - INTERVAL '30 minutes';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_stuck_jobs IS
  'Marca como failed jobs running há mais de 30min. Migração direta dos 4 jobs travados em produção.';

-- Incrementar exploracoes em nichos
CREATE OR REPLACE FUNCTION increment_exploracoes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE nichos SET exploracoes = exploracoes + 1 WHERE id = NEW.nicho_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exploration_counter
  AFTER INSERT ON exploration_history
  FOR EACH ROW EXECUTE FUNCTION increment_exploracoes();
```

---

## 4. Estratégia de Migração dos Dados Existentes

### Fase 1 — Migrar `data/nichos.json` (sem downtime)
```javascript
// Script de seed: node scripts/seed-nichos.js
// 1. Ler nichos.json
// 2. Para cada nicho → INSERT INTO nichos
// 3. Para cada subtema → INSERT INTO subtemas
// 4. Para cada formato → INSERT INTO formatos
// 5. Para cada angulo → INSERT INTO angulos
// Idempotente: ON CONFLICT DO NOTHING
```

### Fase 2 — Migrar `server/data/jobs.json` (com normalização)
```javascript
// 1. Para cada job → INSERT INTO jobs (converter duration "77.7s" → 77700ms)
// 2. Para cada job.agents[n] → INSERT INTO job_agents
// 3. Para cada job.outputs[n] → INSERT INTO job_outputs
// 4. Para cada job.errors[n] → INSERT INTO job_errors
// 5. Executar cleanup_stuck_jobs() → 4 jobs "running" → "failed"
```

### Fase 3 — Atualizar servidor (com feature flag)
```javascript
// server/config.js — adicionar:
USE_DATABASE: process.env.USE_DATABASE === 'true'  // false por padrão

// server/job-queue.js — adicionar camada de abstração:
// if (config.USE_DATABASE) → usar Supabase client
// else → usar arquivo JSON (backward compat durante transição)
```

---

## 5. Estimativas de Esforço Revisadas

| ID | Débito | Severidade | Esforço | Notas |
|----|--------|-----------|---------|-------|
| DB-01 | Persistência em JSON flat | **CRÍTICO** (rev.) | **40h** | Schema + migração + refactor job-queue.js |
| DB-06 | Jobs travados (NEW) | ALTO | **4h** | Absorvido no DB-01, mas isolado para quick fix |
| DB-02 | Exploração não persistida | ALTO | **8h** | Tabela + endpoint + frontend |
| DB-04 | Taxonomia sem CRUD | MÉDIO | **16h** | Endpoints CRUD + validação hierarquia |
| DB-05 | Sem rastreabilidade | MÉDIO | **8h** | Middleware + tabela auditoria |
| DB-03 | Outputs sem storage | ALTO | **0h** | Absorvido por DB-01 (job_outputs) |

**Total estimado:** 76h (era 24h no DRAFT — revisão aumentou por análise dos dados reais)

---

## 6. Dependências Atualizadas

```
DB-01 (migração JSON → Supabase)
  └── resolve → DB-03 (job_outputs table)
  └── resolve → DB-06 (cleanup function)
  └── habilita → DB-02 (exploration_history table)
  └── habilita → DB-05 (logging no banco)
  └── bloqueia qualquer → deploy em produção com dados persistidos

DB-04 (CRUD de nichos) é independente — pode ser feito em paralelo com DB-01
```

---

## 7. Validação das Perguntas do DRAFT — Respostas Consolidadas

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Supabase ou SQLite? | **Supabase** — já planejado em `.env.example`, elimina HD externo, escala melhor |
| 2 | Schema mínimo? | **7 tabelas** — ver Seção 3. Nichos preservam slug como PK para backward compat |
| 3 | Outputs em Storage ou TEXT? | **TEXT** por agora — outputs < 50KB em prod. `content_type` flag prepara migração |
| 4 | Taxonomia hierárquica? | **4 tabelas normalizadas** com UUID + view materializada para backward compat do frontend |
| 5 | Multi-tenancy? | **Single-user por design** (Chrome CDP impossibilita). Coluna `user_id nullable` para futuro |

---

## 8. Descobertas Adicionais (Não Catalogadas no DRAFT)

| Achado | Impacto | Ação recomendada |
|--------|---------|-----------------|
| 4 de 5 jobs travados em "running" desde 2026-02-20 | Interface mostra jobs "ativos" que estão mortos | Executar `cleanup_stuck_jobs()` imediatamente |
| `duration` armazenado como string "77.7s" | Impossível filtrar/ordenar por duração | Converter para INTEGER (ms) na migração |
| Outputs de error dentro de `outputs{}` E `errors[]` | Dupla fonte de verdade sobre falhas | Consolidar em `job_errors` tabela, limpar de `job_outputs` |
| Agent 4 nunca aparece nos dados reais | Confirmado: pipeline pula de 3 → 5 em todos os jobs | Documentar em DT-08: Agent 4 = proposital |
| `nichos.json` `exploracoes` é contador estático | Não reflete uso real (counter incrementado como?) | Trigger no banco resolve automaticamente |

---

## 9. Recomendação Final para @architect

**Prioridade máxima:** DB-01 + DB-06 como um único sprint de "database foundation".

Sequência recomendada:
1. **Sprint DB-Foundation (44h):** Criar schema Supabase + seed nichos.json + migrar jobs.json + refactor job-queue.js + cleanup jobs travados
2. **Sprint DB-History (8h):** Migrar localStorage → exploration_history + endpoint
3. **Sprint DB-Analytics (16h):** CRUD de nichos + rastreabilidade

Sem DB-Foundation, qualquer deploy em produção acumula dados perdidos. Este é o **bloqueador principal** do projeto.

---

*— Dara, arquitetando dados 🗄️*
*@data-engineer | Fase 5 de 10 — Brownfield Discovery — BRAINET MVP v3.0.0*
