# 🚀 KICKOFF — BRAINET Council 12-Hour Sprint

**Status:** ✅ APPROVED & STARTED
**Date:** 2026-02-26
**Duration:** 12 hours (Phase 1: 6h + Phase 2: 6h)
**Total Subtasks:** 12 (consolidated)
**Complexity:** COMPLEX

---

## 📋 Your Starting Checklist

Before starting implementation:

- [ ] **Chrome running with debugging port:**
  ```bash
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9225
  ```

- [ ] **4 tabs open & logado:**
  - `claude.ai`
  - `gemini.google.com`
  - `chatgpt.com`
  - `grok.x.ai` (or x.com/i/grok)

- [ ] **Environment variables in .env:**
  ```bash
  OPENCLAW_GATEWAY_URL=http://localhost:18789
  OPENCLAW_TOKEN=...
  SCRAPLING_URL=http://100.66.114.87:3000
  ALIENWARE_IP=100.66.114.87
  ELEVENLABS_API_KEY=...
  ELEVENLABS_VOICE_ID=...
  SUPABASE_URL=...
  SUPABASE_ANON_KEY=...
  ```

- [ ] **Alienware services running:**
  ```bash
  # SSH into Alienware or check via Tailscale
  curl http://100.66.114.87:11434/api/tags  # Ollama
  curl http://100.66.114.87:5678/api/v1/workflows  # n8n
  curl http://100.66.114.87:3000/health  # Scrapling MCP
  ```

- [ ] **n8n accessible:**
  http://100.66.114.87:5678 (login with user credentials)

---

## 🎯 Task Execution Order

### **PHASE 1: Council Implementation (6h)**

```
1.1 (20min) — Setup Scrapling MCP on Alienware
    ↓
1.2 (60min) — Integrate Puppeteer ↔ Scrapling (HTTP)
    ↓
1.3 (10min) — Validate state machine
    ↓
1.4 (10min) — Deploy Supabase schema
    ↓
1.5 (15min) — Test API endpoints
    ↓
1.6 (10min) — Load system prompts
    ↓
1.7 (60min) — E2E test with real Chrome
    ↓
⏱️ BUFFER: 80min (for delays)
    ↓
✅ Phase 1 Complete
```

### **PHASE 2: Content Generation (6h)**

```
2.1 (75min) — n8n WF2: Council → ElevenLabs TTS → audio.mp3
    ↓
2.2 (75min) — n8n WF3a: Keywords → Google Whisk → images
    ↓
2.3 (75min) — n8n WF3b: Audio+images → Google Flow → video.mp4
    ↓
2.4 (75min) — Supabase Storage buckets + repo helpers
    ↓
2.5 (60min) — E2E test: full pipeline (texto+áudio+imagens+vídeo)
    ↓
✅ Phase 2 Complete = 🎉 SPRINT COMPLETE
```

---

## ⚠️ Critical Context

**70% of Phase 1 already exists — DO NOT rewrite:**

```javascript
✅ server/council-orchestrator.js     (state machine)
✅ server/openclaw-driver.js          (fallback gateway)
✅ server/scrapling-bridge.js         (Alienware bridge)
✅ supabase/migrations/003_council_jobs.sql  (schema)
✅ squads/brainet-squad/agents/*.prompt.md   (4 prompts)
✅ server/server.js                   (3 API routes)
```

**What you're building:**
- 1.1-1.2: Integrate Scrapling MCP with Puppeteer (HTTP-based)
- 1.7: E2E validation (real Chrome)
- 2.1-2.5: All Phase 2 (n8n workflows + storage + full E2E)

---

## 🔧 Task 1.1 — Setup Scrapling MCP (20 min)

**Goal:** Verify Scrapling MCP server is running on Alienware and accessible via Tailscale.

**Steps:**

1. **Verify Tailscale connection:**
   ```bash
   tailscale status
   # Should show Alienware at 100.66.114.87
   ```

2. **Check Scrapling MCP on Alienware:**
   ```bash
   curl -s http://100.66.114.87:3000/health
   # Expected response: { "status": "ok", "scrapling_mcp": true }
   ```

3. **Test adaptive element detection:**
   ```bash
   curl -X POST http://100.66.114.87:3000/find-element \
     -H "Content-Type: application/json" \
     -d '{
       "selectors": ["#prompt-textarea", ".message-input", "[role=textbox]"],
       "adaptive": true
     }'
   # Expected: { "selector": "#prompt-textarea", "confidence": 0.95 }
   ```

4. **Test batch scraping (3 concurrent):**
   ```bash
   curl -X POST http://100.66.114.87:3000/batch-scrape \
     -H "Content-Type: application/json" \
     -d '{
       "urls": ["https://example.com", "https://test.com"],
       "concurrent_requests": 3,
       "stealth": true
     }'
   # Expected: Array of scraped content
   ```

5. **Add .env vars (if missing):**
   ```bash
   SCRAPLING_URL=http://100.66.114.87:3000
   ALIENWARE_IP=100.66.114.87
   ```

**Verification:**
```bash
npm run test:integration -- --grep "Scrapling"
```

**⏱️ Estimated: 20 min**

---

## 🔧 Task 1.2 — Puppeteer ↔ Scrapling Integration (60 min)

**Goal:** Replace hardcoded CSS selectors with adaptive detection via Scrapling MCP HTTP.

**Architecture:**
```
Node.js (browser-llm.js)
  ↓ HTTP POST
Scrapling MCP (Alienware:3000)
  ↓ return adaptive selector
Node.js receives selector
  ↓ apply in Puppeteer
Puppeteer finds element + types prompt
  ↓ capture response
Node.js calls Scrapling again (extract content)
Scrapling returns parsed response (HTML → text)
```

**Steps:**

1. **Update browser-llm.js:**
   - Replace hardcoded selectors with `findElementViaScrapling()`
   - Function should POST to `$SCRAPLING_URL/find-element`
   - Receive adaptive selector + apply in Puppeteer

   ```javascript
   // BEFORE:
   const promptBox = await page.$('#prompt-textarea');

   // AFTER:
   const { selector } = await findElementViaScrapling(page, {
     selectors: ['#prompt-textarea', '.message-input', '[role=textbox]'],
     adaptive: true
   });
   const promptBox = await page.$(selector);
   ```

2. **Implement for all 4 tabs:**
   - claude.ai: chat input selector
   - gemini.google.com: textarea selector
   - chatgpt.com: message input
   - grok.x.ai: compose area

3. **Response parsing via Scrapling:**
   - After Puppeteer captures response HTML
   - Call Scrapling: `POST /extract-content`
   - Return clean text

4. **Test with real Chrome (manual):**
   - Start Chrome with debugging port
   - Open all 4 tabs (logado)
   - Send test prompt to each via browser-llm.js
   - Verify responses are parsed correctly

**Verification:**
```bash
npm test -- --grep "BrowserLLM"
npm run typecheck
```

**⏱️ Estimated: 60 min**

**⚠️ Critical:** This integration is key to robustness. If UI changes, Scrapling adapts; Puppeteer doesn't.

---

## 🔧 Task 1.3 — Validate State Machine (10 min)

**Goal:** Review existing state machine code — no changes needed, just verify.

**What to check:**

1. Open `server/council/council-orchestrator.js`
2. Review state transitions:
   - ✅ queued → routing
   - ✅ routing → processing
   - ✅ processing → synthesizing (after 60s timeout OR all agentes respond)
   - ✅ synthesizing → complete
   - ✅ any state → error (on exception)
   - ✅ any state → timeout (if 5min with no agente response)

3. Verify fallback logic:
   - Chrome timeout (60s) → try OpenClaw
   - OpenClaw timeout (30s) → skip agente, continue
   - If only 1 agente responds → Capitão synthesizes with partial data (OK)

4. Check Supabase updates:
   - Each agente response updates `resultado_pesquisador`, etc.
   - Estado updates `status` column
   - Supports partial results tracking

**If code looks correct:** ✅ SKIP to next task
**If issues found:** Report + fix before proceeding

**⏱️ Estimated: 10 min**

---

## 🔧 Task 1.4 — Deploy Supabase Schema (10 min)

**Goal:** Run migration to create `council_jobs` table with full state machine support.

**Steps:**

1. **Deploy migration:**
   ```bash
   supabase migration up
   # OR manually:
   psql $SUPABASE_CONNECTION_URL < supabase/migrations/003_council_jobs.sql
   ```

2. **Verify table:**
   ```bash
   psql $SUPABASE_CONNECTION_URL -c "\d council_jobs"
   # Should show: id, status, resultado_pesquisador, resultado_visionario,
   #              resultado_desafiador, resultado_capitao, fase2_status,
   #              audio_url, images_urls, video_url, created_at
   ```

3. **Test insert:**
   ```bash
   psql $SUPABASE_CONNECTION_URL -c "
   INSERT INTO council_jobs (id, status, resultado_pesquisador)
   VALUES ('test-1', 'queued', null)
   RETURNING id, status;"
   # Should return: test-1 | queued
   ```

**Verification:**
```bash
npm run test:db -- --grep "council_jobs"
```

**⏱️ Estimated: 10 min**

---

## 🔧 Task 1.5 — Test API Endpoints (15 min)

**Goal:** Verify 3 council routes work correctly.

**Test 1: POST /api/council/job**
```bash
curl -X POST http://localhost:3000/api/council/job \
  -H "Content-Type: application/json" \
  -d '{
    "tema": "Tendências de IA em 2026",
    "contexto": "Análise para o mercado brasileiro",
    "objetivo": "pesquisa",
    "profundidade": "padrão",
    "fontes": ["https://example.com"],
    "restricoes": {"idioma": "pt-BR"},
    "metadados": {"usuario_id": "user-123"}
  }'

# Expected: { "jobId": "uuid", "status": "queued" }
```

**Test 2: GET /api/council/:jobId**
```bash
curl http://localhost:3000/api/council/{jobId-from-test-1}

# Expected: { "id": "...", "status": "queued", "resultado_pesquisador": null, ... }
```

**Test 3: GET /api/council/jobs**
```bash
curl http://localhost:3000/api/council/jobs

# Expected: [{ "id": "...", "status": "queued", "createdAt": "...", ... }]
```

**Verification:**
```bash
npm run test:api -- --grep "council"
```

**⏱️ Estimated: 15 min**

---

## 🔧 Task 1.6 — Load System Prompts (10 min)

**Goal:** Integrate 4 system prompts into council orchestrator.

**Steps:**

1. Update `server/council/council-orchestrator.js`:
   ```javascript
   const fs = require('fs');

   const PROMPTS = {
     capitao: fs.readFileSync('squads/brainet-squad/agents/capitao.prompt.md', 'utf-8'),
     pesquisador: fs.readFileSync('squads/brainet-squad/agents/pesquisador.prompt.md', 'utf-8'),
     visionario: fs.readFileSync('squads/brainet-squad/agents/visionario.prompt.md', 'utf-8'),
     desafiador: fs.readFileSync('squads/brainet-squad/agents/desafiador.prompt.md', 'utf-8')
   };

   async function executePesquisador(inputPrompt) {
     return sendPrompt('gemini.google.com', {
       systemPrompt: PROMPTS.pesquisador,
       userPrompt: inputPrompt
     });
   }
   // ... etc for other roles
   ```

2. Verify prompts load correctly
3. No content changes — prompts already exist and are optimized

**Verification:**
```bash
grep -l "system\|role\|Capitão\|Pesquisador" squads/brainet-squad/agents/*.prompt.md | wc -l
# Should return: 4
```

**⏱️ Estimated: 10 min**

---

## 🔧 Task 1.7 — E2E Test with Real Chrome (60 min)

**Goal:** Write test validating entire Phase 1 with real browser tabs.

**Prerequisites:**
- Chrome running with `--remote-debugging-port=9225`
- All 4 tabs open & logado
- Task 1.1-1.6 completed

**Test code structure:**
```typescript
import { test, expect } from '@playwright/test';

test('Council E2E: Orchestrate 4 LLMs and synthesize', async () => {
  // 1. POST council job
  const response = await fetch('http://localhost:3000/api/council/job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tema: 'Impacto da IA no mercado imobiliário',
      contexto: 'Incorporadora em SP quer usar IA para precificação',
      objetivo: 'pesquisa',
      profundidade: 'profunda',
      fontes: ['https://example.com']
    })
  });
  const { jobId } = await response.json();

  // 2. Poll until complete (timeout 10min)
  let result, attempts = 0;
  while (attempts < 600) { // 600s = 10min
    const jobResponse = await fetch(`http://localhost:3000/api/council/${jobId}`);
    result = await jobResponse.json();
    if (result.status === 'complete') break;
    await new Promise(r => setTimeout(r, 1000)); // 1s between polls
    attempts++;
  }

  // 3. Verify all 4 agentes responded
  expect(result.resultado_pesquisador).toBeDefined();
  expect(result.resultado_visionario).toBeDefined();
  expect(result.resultado_desafiador).toBeDefined();
  expect(result.resultado_capitao).toBeDefined();

  // 4. Validate Capitão output structure
  expect(result.resultado_capitao).toMatch(/^## Síntese do Conselho/);
  expect(result.resultado_capitao).toContain('### Análise Principal');
  expect(result.resultado_capitao).toContain('### Riscos');
  expect(result.resultado_capitao).toContain('### Recomendações');
  expect(result.resultado_capitao).toContain('### Fontes');
});
```

**Run test:**
```bash
npm run test:e2e -- --grep "Council" --timeout 600000
```

**Debugging tips:**
- If agente times out: Check Chrome tab is responding (click it manually)
- If Scrapling errors: Verify Alienware connection via `curl http://100.66.114.87:3000/health`
- If OpenClaw fallback triggered: Check logs in `server/logs/council.log`

**⏱️ Estimated: 60 min (including debug time)**

**✅ Phase 1 Complete!**

---

## 🎬 PHASE 2: Content Generation (6h)

After Phase 1 passes, you move to Phase 2. This involves creating 3 n8n workflows.

**Quick overview:**
- **2.1:** Council Markdown → text cleaner → ElevenLabs TTS → audio.mp3
- **2.2:** Extract keywords → Google Whisk prompts → call Whisk API → download images
- **2.3:** Combine audio + images → call Google Flow → generate video
- **2.4:** Create Supabase Storage buckets + repo helpers
- **2.5:** E2E test full pipeline

**Time estimate per task:** 75 min (except 2.5 = 60 min)

---

## 🆘 Troubleshooting

| Issue | Check |
|-------|-------|
| Puppeteer can't connect to Chrome | `curl http://localhost:9225/json` — Chrome must have `--remote-debugging-port=9225` |
| Scrapling MCP not responding | `curl http://100.66.114.87:3000/health` — Alienware must be running Scrapling |
| API returns 401 | Check SUPABASE_ANON_KEY in .env |
| State machine stuck in "processing" | Check logs: `tail -f server/logs/council.log` |
| n8n workflow fails | Check n8n UI at `http://100.66.114.87:5678` for error details |

---

## 📞 Quick Commands

```bash
# Start dev server
npm run dev

# Run tests
npm test
npm run test:integration
npm run test:api
npm run test:e2e -- --grep "Council"

# View logs
tail -f server/logs/council.log

# Check health
curl http://localhost:3000/api/health
curl http://100.66.114.87:3000/health  # Scrapling
curl http://100.66.114.87:5678/api/v1/info  # n8n

# Supabase
supabase status
psql $SUPABASE_CONNECTION_URL -c "SELECT * FROM council_jobs LIMIT 1;"
```

---

## 🎯 Success Criteria

**Phase 1:** ✅
- All 4 LLM tabs respond to council job
- State machine transitions properly
- Supabase tracks each agente's response
- E2E test passes

**Phase 2:** ✅
- Council output → audio.mp3 (ElevenLabs)
- Tema keywords → 3-5 images (Google Whisk)
- Audio + images → video.mp4 (Google Flow)
- All assets have signed URLs
- Full E2E test < 30 min

**Sprint Complete:** 🎉
- Conselho operacional + fábrica de conteúdo = produção ready

---

**Good luck, dev! You've got this. 🚀**

— Aria, architecting the future 🏗️
