# 🏛️ BRAINET Council 12-Hour Sprint — Detailed Subtask Breakdown

**Status:** Ready for Developer Review
**Date:** 2026-02-26
**Total Subtasks:** 13 (1 new, 12 building on existing code)

---

## 📊 Implementation Status Overview

| Phase | Subtask | What's Needed | Existing Code | Status | Time |
|-------|---------|---------------|---------------|--------|------|
| **Phase 1** | 1.1 | Scrapling MCP setup (Alienware) | scrapling-bridge.js | ⚠️ Integration | 20m |
| | 1.2 | Puppeteer ↔ Scrapling integration | browser-llm.js + openclaw-driver.js | ⚠️ Integration | 60m |
| | 1.3 | State machine validation | council-orchestrator.js | ✅ Existing | 10m |
| | 1.4 | Supabase schema creation | 003_council_jobs.sql | ✅ Existing | 10m |
| | 1.5 | API endpoints (POST/GET) | server.js (3 rotas) | ✅ Existing | 15m |
| | 1.6 | System prompts for 4 roles | squads/brainet-squad/agents/ | ✅ Existing | 10m |
| | 1.7 | E2E test (real Chrome + 4 tabs) | tests/e2e/ | ❌ New | 60m |
| **Phase 2** | 2.1 | n8n WF2 (TTS pipeline) | n8n/workflows/ | ❌ New | 75m |
| | 2.2 | n8n WF3a (Image generation) | n8n/workflows/ | ❌ New | 75m |
| | 2.3 | n8n WF3b (Video generation) | n8n/workflows/ | ❌ New | 75m |
| | 2.4 | Supabase Storage buckets | supabase/migrations/ | ❌ New | 45m |
| | 2.5 | fase2_status tracking | supabase/migrations/ | ❌ New | 30m |
| | 2.6 | E2E test (full content pipeline) | tests/e2e/ | ❌ New | 60m |

**Legend:** ✅ = Exists as-is | ⚠️ = Exists, needs integration | ❌ = Needs new development

---

## 🔍 Detailed Subtask Cards

### **PHASE 1: Council Implementation**

---

#### **1.1 — Setup Scrapling MCP on Alienware** (20 min)
**Status:** ⚠️ INTEGRATION (file exists)
**Service:** Infrastructure
**Files:**
- `server/config/scrapling.js` — ✅ Exists (scrapling-bridge.js already here)
- `.env.example` — Add SCRAPLING_URL, ALIENWARE_IP

**What Exists:**
```javascript
// server/scrapling-bridge.js (~140 linhas)
// ✅ Bridge HTTP para Scrapling MCP no Alienware
// ✅ scrapeUrl(), batchScrape(), anti-detecção
```

**What Dev Must Do:**
1. Confirm Alienware: `pip install scrapling[all]` completed
2. Verify Scrapling MCP server listening on Alienware
   ```bash
   curl -s http://100.66.114.87:3000/health
   # Expected: { "status": "ok", "scrapling_mcp": true }
   ```
3. Test batchScrape with 3 URLs (concurrent_requests=3)
4. Add .env vars if missing:
   ```
   SCRAPLING_URL=http://100.66.114.87:3000
   ALIENWARE_IP=100.66.114.87
   TAILSCALE_ENABLED=true
   ```

**Verification Command:**
```bash
npm run test:integration -- --grep "Scrapling"
# Should test: fingerprint spoofing, element tracking, batch concurrency
```

**Notes:**
- Scrapling MCP is built-in (no extra bridge needed!)
- Focus on confirming connection via Tailscale
- Test adaptive element detection (change className → still finds element)

---

#### **1.2 — Integrate Puppeteer CDP ↔ Scrapling** (60 min)
**Status:** ⚠️ INTEGRATION (both files exist, need sync)
**Service:** Backend
**Files:**
- `server/llm/browser-llm.js` — ✅ Exists (472 linhas)
- `server/openclaw-driver.js` — ✅ Exists (150 linhas)
- `server/config/scrapling.js` — ✅ Exists (140 linhas)

**What Exists:**
```javascript
// browser-llm.js
// ✅ connectToChrome(port=9225)
// ✅ sendPrompt(tabName, prompt) — hardcoded seletores
// ⚠️ parseResponse(html) — needs Scrapling integration

// openclaw-driver.js
// ✅ sendViaOpenClaw(prompt) — fallback
// ✅ health check

// scrapling-bridge.js
// ✅ StealthyFetcher, Smart Element Tracking
// ✅ batchScrape() com bypass Cloudflare
```

**What Dev Must Do:**
1. Update `browser-llm.js` to use Scrapling for element detection instead of hardcoded selectors:
   ```javascript
   // BEFORE (hardcoded):
   const promptBox = await page.$('#prompt-textarea');

   // AFTER (Scrapling adaptive):
   const promptBox = await scrapling.findElement(page, {
     selectors: ['#prompt-textarea', '#chat-input', '[data-testid="prompt"]'],
     adaptive: true
   });
   ```

2. Replace hardcoded selectors in all 4 tabs:
   - claude.ai → `#prompt-textarea` (or adaptive)
   - gemini.google.com → Chat textarea
   - chatgpt.com → Textarea with role=textbox
   - grok.x.ai → Message input

3. Test parsing responses via Scrapling content extraction:
   ```javascript
   const response = await scrapling.extractContent(page, {
     selector: '.response-text',
     adaptive: true
   });
   ```

4. Validate fallback: If Puppeteer timeout (60s) → call OpenClaw instead

**Verification Command:**
```bash
npm test -- --grep "BrowserLLM" && npm run typecheck
```

**Notes:**
- Scrapling's Smart Element Tracking handles UI changes automatically
- No need to rewrite, just enhance with adaptive detection
- Test with real Chrome (port 9225) + 4 logados tabs

---

#### **1.3 — Validate Council Orchestrator State Machine** (10 min)
**Status:** ✅ EXISTING (file is complete)
**Service:** Backend
**Files:**
- `server/council/council-orchestrator.js` — ✅ Complete implementation
- `server/council/state-machine.js` — ✅ State transitions defined

**What Exists:**
```javascript
// ✅ queued → routing → processing → synthesizing → complete
// ✅ Fan-out: Pesq || Vision || Desaf (paralelo)
// ✅ Fallback: Chrome timeout → OpenClaw → partial synthesis
// ✅ Supabase updates: resultado_pesquisador, visionario, desafiador, capitao
```

**What Dev Must Do:**
1. Review code: Confirm state transitions match spec
2. Validate error handling (does it fall back properly?)
3. No changes needed — this is production-ready

**Verification Command:**
```bash
npm test -- --grep "StateManager" && npm run typecheck
```

**Notes:**
- This is architectural foundation — already solid
- Just validate it works with real Supabase data

---

#### **1.4 — Create Supabase Schema** (10 min)
**Status:** ✅ EXISTING (SQL file is complete)
**Service:** Database
**Files:**
- `supabase/migrations/003_council_jobs.sql` — ✅ Ready to deploy

**What Exists:**
```sql
-- ✅ Table: council_jobs
-- ✅ Columns: id, status, resultado_pesquisador, resultado_visionario,
--           resultado_desafiador, resultado_capitao, fase2_status, audio_url, video_url
-- ✅ State machine: queued|routing|processing|synthesizing|complete|error|timeout
-- ✅ JSONB tracking for partial results
```

**What Dev Must Do:**
1. Deploy migration to Supabase:
   ```bash
   supabase migration up
   # or
   psql $SUPABASE_CONNECTION_URL < supabase/migrations/003_council_jobs.sql
   ```

2. Verify table creation:
   ```bash
   psql $SUPABASE_CONNECTION_URL -c "\dt council_jobs"
   ```

3. No code changes — schema is final

**Verification Command:**
```bash
npm run test:db -- --grep "council_jobs"
```

**Notes:**
- Migration is idempotent (safe to run multiple times)
- JSONB fields allow partial result tracking
- Indexes on status field for fast queries

---

#### **1.5 — Validate API Endpoints** (15 min)
**Status:** ✅ EXISTING (routes already in server.js)
**Service:** Backend
**Files:**
- `server/server.js` — ✅ 3 council routes already added:
  - POST /api/council/job
  - GET /api/council/:jobId
  - GET /api/council/jobs

**What Exists:**
```javascript
// ✅ POST /api/council/job
//   Body: { tema, contexto, objetivo, profundidade, fontes[], restricoes, metadados }
//   Returns: { jobId, status: "queued" }
//
// ✅ GET /api/council/:jobId
//   Returns: { status, resultado_pesquisador, visionario, desafiador, capitao, fase2_status }
//
// ✅ GET /api/council/jobs
//   Returns: [{ id, status, createdAt, ...}]
```

**What Dev Must Do:**
1. Test endpoints with curl:
   ```bash
   # Test 1: Create job
   curl -X POST http://localhost:3000/api/council/job \
     -H "Content-Type: application/json" \
     -d '{"tema":"test","objetivo":"pesquisa"}'

   # Test 2: Get job
   curl http://localhost:3000/api/council/{jobId}

   # Test 3: List jobs
   curl http://localhost:3000/api/council/jobs
   ```

2. Verify input validation (JSON Schema)
3. No code changes needed — endpoints are production-ready

**Verification Command:**
```bash
npm run test:api -- --grep "council"
```

**Notes:**
- All 3 routes follow REST conventions
- Input validation via schema (already implemented)
- Output Markdown is structured for Phase 2

---

#### **1.6 — System Prompts for 4 Council Roles** (10 min)
**Status:** ✅ EXISTING (4 prompts in squads folder)
**Service:** Backend
**Files:**
- `squads/brainet-squad/agents/capitao.prompt.md` — ✅ Exists
- `squads/brainet-squad/agents/pesquisador.prompt.md` — ✅ Exists
- `squads/brainet-squad/agents/visionario.prompt.md` — ✅ Exists
- `squads/brainet-squad/agents/desafiador.prompt.md` — ✅ Exists

**What Exists:**
```markdown
# ✅ 4 System Prompts
- Capitão: "You are the Chairman of the council. Synthesize insights..."
- Pesquisador: "You are the Researcher. Search for data and analyze..."
- Visionário: "You are the Visionary. Generate innovative ideas..."
- Desafiador: "You are the Challenger. Question assumptions..."
```

**What Dev Must Do:**
1. Load prompts in council-orchestrator.js:
   ```javascript
   const capitaoPrompt = await loadPrompt('squads/brainet-squad/agents/capitao.prompt.md');
   const pesqPrompt = await loadPrompt('squads/brainet-squad/agents/pesquisador.prompt.md');
   // ... etc
   ```

2. Inject into each LLM's system context before sendPrompt()
3. No content changes — prompts are already optimized

**Verification Command:**
```bash
grep -l "system\|role\|Chairman" squads/brainet-squad/agents/*.prompt.md
```

**Notes:**
- Prompts are Markdown files (human-readable)
- Tone + style is already tuned for each role
- Just load and pass to browser-llm.js

---

#### **1.7 — E2E Test: Council with Real Chrome** (60 min)
**Status:** ❌ NEW (needs to be written)
**Service:** Frontend (browser automation)
**Files:**
- `tests/e2e/council.spec.ts` — NEW
- `tests/fixtures/council-input.json` — NEW

**What Dev Must Do:**
1. Create E2E test that:
   - Starts Chrome with `--remote-debugging-port=9225`
   - Opens 4 tabs with real sites (claude.ai, gemini, chatgpt, grok)
   - Sends 1 council job via POST /api/council/job
   - Polls GET /api/council/:jobId until complete (timeout 10min)
   - Verifies all 4 agentes responderam
   - Validates Markdown output structure

2. Test code structure:
   ```typescript
   describe('Council E2E', () => {
     it('should orchestrate 4 LLMs and synthesize', async () => {
       // 1. Start Chrome (manual: user must do this)
       // 2. POST job
       const job = await POST('/api/council/job', {...});

       // 3. Poll until complete
       let result;
       for (let i = 0; i < 600; i++) { // 10 min timeout
         result = await GET(`/api/council/${job.id}`);
         if (result.status === 'complete') break;
         await sleep(1000);
       }

       // 4. Validate output
       expect(result.resultado_pesquisador).toBeDefined();
       expect(result.resultado_visionario).toBeDefined();
       expect(result.resultado_desafiador).toBeDefined();
       expect(result.resultado_capitao).toMatch(/^## Síntese/);
     });
   });
   ```

3. Add debug logging if any agente fails

**Verification Command:**
```bash
npm run test:e2e -- --grep "Council"
# Note: Requires manual Chrome startup first!
```

**Notes:**
- This test validates the entire Phase 1 integration
- User must manually open Chrome with debugging port
- Test runs for up to 10 minutes (LLMs are slow)
- If a single agente times out, synthesis still works (partial OK)

---

### **PHASE 2: Content Generation Pipeline**

---

#### **2.1 — n8n Workflow: TTS (ElevenLabs)** (75 min)
**Status:** ❌ NEW (workflow needs to be built)
**Service:** Backend (n8n automation)
**Files:**
- `n8n/workflows/WF2-content-extraction.json` — NEW
- `server/content/text-cleaner.js` — NEW (helper for Markdown → text)

**What Dev Must Do:**
1. Create n8n workflow in UI (or via JSON):
   ```yaml
   Nodes:
     1. Webhook: Listen for POST from Council (resultado_capitao)
     2. Markdown Cleaner: Remove headers/bullets, convert to prose
     3. ElevenLabs Node: Call TTS API
     4. Save Audio: Upload to Supabase Storage
     5. Update DB: Set audio_url + fase2_status=audio_complete
   ```

2. Create text-cleaner.js helper:
   ```javascript
   // Input: Markdown "## Síntese...\n### Riscos..."
   // Output: Prose text suitable for narration
   function cleanMarkdown(md) {
     return md
       .replace(/^#+\s*/gm, '') // Remove headers
       .replace(/^-\s*/gm, '')  // Remove bullets
       .trim();
   }
   ```

3. Configure ElevenLabs:
   - API Key: $ELEVENLABS_API_KEY
   - Voice ID: $ELEVENLABS_VOICE_ID
   - Stability: 0.7
   - Output format: mp3

4. Deploy workflow to Alienware n8n (port 5678)

**Verification Command:**
```bash
# Trigger workflow manually in n8n UI
# POST http://localhost:3000/api/council/job with tema
# Should create audio.mp3 within 2 minutes
curl http://100.66.114.87:5678/api/v1/workflows | grep WF2
```

**Notes:**
- ElevenLabs API is paid (but user has subscription)
- Test with sample Markdown first
- Monitor n8n logs for errors

---

#### **2.2 — n8n Workflow: Image Generation (Google Whisk)** (75 min)
**Status:** ❌ NEW (workflow needs to be built)
**Service:** Backend (n8n automation)
**Files:**
- `n8n/workflows/WF3a-image-generation.json` — NEW
- `server/content/whisk-bridge.js` — NEW (Google Whisk API wrapper)

**What Dev Must Do:**
1. Create n8n workflow:
   ```yaml
   Nodes:
     1. Get Job: Fetch Council job from Supabase
     2. Extract Keywords: Parse tema + top 3-5 keywords
     3. Generate Whisk Prompts: "Tema: X, estilo artístico, marca autêntica"
     4. Call Whisk API: 3-5 imagens via Google Gemini Advanced
     5. Download Images: Save to Supabase Storage
     6. Update DB: Set images_urls[] + fase2_status=image_complete
   ```

2. Create whisk-bridge.js:
   ```javascript
   // Wrapper para Whisk API (pode ser REST ou browser automation)
   async function generateImages(tema, keywords, count=3) {
     // Option A: Usar Google Whisk API (se disponível)
     // Option B: OpenClaw automation do Whisk UI
     // Retorna: [{ url, metadata }]
   }
   ```

3. Configure Google Gemini Advanced:
   - Uses user's existing Gemini subscription
   - Focus: Imagens autênticas + traços artísticos da marca

4. Handle image downloads:
   - Download from Whisk output
   - Upload to Supabase Storage bucket `council-images`
   - Generate signed URLs (7-day expiry)

**Verification Command:**
```bash
# Test workflow manually
# Should generate 3-5 images within 3 minutes
ls supabase-storage/council-images/*.png | wc -l
# Should show 3+
```

**Notes:**
- Whisk é interface Google (pode precisar de browser automation com OpenClaw)
- Imagens devem ter estilo coerente (tunar prompt)
- Se Whisk indisponível, fallback para Imagen API direta

---

#### **2.3 — n8n Workflow: Video Generation (Google Flow)** (75 min)
**Status:** ❌ NEW (workflow needs to be built)
**Service:** Backend (n8n automation)
**Files:**
- `n8n/workflows/WF3b-video-generation.json` — NEW
- `server/content/flow-bridge.js` — NEW (Google Flow API wrapper)

**What Dev Must Do:**
1. Create n8n workflow:
   ```yaml
   Nodes:
     1. Get Job: Fetch Council + audio + images
     2. Prepare Input: Audio track (mp3) + image sequence
     3. Call Flow API: Generate vídeo (Veo 3.1)
     4. Monitor: Poll status (can take 5-10 min)
     5. Download Video: Save to Supabase Storage
     6. Update DB: Set video_url + fase2_status=complete
   ```

2. Create flow-bridge.js:
   ```javascript
   // Google Flow (Veo 3.1) API wrapper
   async function generateVideo(audioUrl, imageUrls) {
     // Call Flow API
     // Returns: { jobId, status: 'generating' }
     // Poll until: status: 'complete', videoUrl: '...'
   }
   ```

3. Handle long processing:
   - Flow can take 5-10 minutes
   - n8n node must have long timeout (900s)
   - Implement retry logic (if API errors)

4. Fallback option:
   - If Flow unavailable, can use CapCut CLI locally
   - Combine audio + images via ffmpeg

**Verification Command:**
```bash
# Test workflow
# Should generate video within 15 minutes (including wait time)
ls supabase-storage/council-videos/*.mp4 | wc -l
# Should show 1
```

**Notes:**
- Flow é serviço novo (pode ter latência)
- Vídeo deve ser sincronizado áudio + imagens
- Se falhar, tente fallback CapCut

---

#### **2.4 — Supabase Storage Buckets** (45 min)
**Status:** ❌ NEW (migrations need to be written)
**Service:** Infrastructure (database)
**Files:**
- `supabase/migrations/004_storage_buckets.sql` — NEW
- `server/storage/cdn-config.js` — NEW (signed URL helper)

**What Dev Must Do:**
1. Create Supabase Storage buckets via SQL:
   ```sql
   -- Create buckets
   INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
   ('council-audio', 'council-audio', false, 524288000),  -- 500MB
   ('council-images', 'council-images', false, 524288000),
   ('council-videos', 'council-videos', false, 5368709120);  -- 5GB

   -- Set RLS policies (public read via signed URL)
   ```

2. Create cdn-config.js helper:
   ```javascript
   async function getSignedUrl(bucket, filename, expiresIn = 604800) {
     // 604800 = 7 days
     const { data, error } = await supabase
       .storage.from(bucket)
       .createSignedUrl(filename, expiresIn);
     return data.signedUrl;
   }
   ```

3. Configure CDN:
   - Use Supabase CDN (built-in) or Cloudflare
   - Cache headers: 30 days for media
   - Compression: gzip for small files

4. Test:
   ```bash
   # Upload test file
   curl -X POST https://supabase.co/storage/v1/object/council-audio/test.mp3 \
     -H "Authorization: Bearer $SUPABASE_KEY" \
     --data-binary @test.mp3

   # Get signed URL
   curl https://api.supabase.co/storage/v1/object/sign/council-audio/test.mp3
   ```

**Verification Command:**
```bash
supabase link
supabase db push
# Then test: npm run test:storage
```

**Notes:**
- Buckets are private by default (signed URLs for access)
- 7-day expiry prevents stale links
- Auto-expire old media via cron job (future improvement)

---

#### **2.5 — Add fase2_status Tracking** (30 min)
**Status:** ❌ NEW (migration needs to be written)
**Service:** Database
**Files:**
- `supabase/migrations/005_phase2_tracking.sql` — NEW
- `server/db/council-repo.js` — Update existing file

**What Dev Must Do:**
1. Add columns to council_jobs table:
   ```sql
   ALTER TABLE council_jobs ADD COLUMN fase2_status TEXT DEFAULT 'pending';
   ALTER TABLE council_jobs ADD COLUMN audio_url TEXT;
   ALTER TABLE council_jobs ADD COLUMN images_urls TEXT[];
   ALTER TABLE council_jobs ADD COLUMN video_url TEXT;
   ALTER TABLE council_jobs ADD COLUMN media_expires_at TIMESTAMP;

   -- Enum for phase2_status
   CREATE TYPE fase2_status_enum AS ENUM (
     'pending',
     'audio_processing',
     'audio_complete',
     'image_processing',
     'image_complete',
     'video_processing',
     'complete'
   );
   ```

2. Update council-repo.js with helper methods:
   ```javascript
   async updatePhase2Status(jobId, status) {
     return supabase
       .from('council_jobs')
       .update({ fase2_status: status })
       .eq('id', jobId);
   }

   async setAudioUrl(jobId, audioUrl) {
     return supabase
       .from('council_jobs')
       .update({
         audio_url: audioUrl,
         fase2_status: 'audio_complete'
       })
       .eq('id', jobId);
   }
   ```

3. Deploy migration

**Verification Command:**
```bash
psql $SUPABASE_CONNECTION_URL -c "\d council_jobs" | grep fase2_status
# Should show new columns
```

**Notes:**
- Enum prevents invalid status values
- Images stored as ARRAY TEXT (flexible for 3-5 images)
- media_expires_at for cleanup job (future)

---

#### **2.6 — E2E Test: Full Content Pipeline** (60 min)
**Status:** ❌ NEW (needs to be written)
**Service:** Frontend (E2E browser automation)
**Files:**
- `tests/e2e/content-pipeline.spec.ts` — NEW
- `tests/fixtures/content-pipeline-input.json` — NEW

**What Dev Must Do:**
1. Create E2E test that validates entire 12-hour sprint:
   ```typescript
   describe('Content Pipeline E2E', () => {
     it('should transform council job → text+audio+images+video', async () => {
       // 1. POST council job
       const job = await POST('/api/council/job', {
         tema: 'Tendências de IA em 2026',
         objetivo: 'pesquisa',
         profundidade: 'profunda'
       });

       // 2. Wait for Phase 1 (council) → complete
       let result = await pollUntilComplete(job.id, 'result', 10 * 60 * 1000);

       // 3. Monitor Phase 2 (content)
       result = await pollUntilComplete(job.id, 'fase2_status', 30 * 60 * 1000);

       // 4. Verify all outputs exist
       expect(result.resultado_capitao).toBeDefined(); // Markdown
       expect(result.audio_url).toBeDefined();        // MP3
       expect(result.images_urls.length).toBeGreaterThanOrEqual(3); // PNGs
       expect(result.video_url).toBeDefined();        // MP4

       // 5. Verify media is accessible
       const audio = await fetch(result.audio_url);
       expect(audio.status).toBe(200);

       const images = await Promise.all(
         result.images_urls.map(url => fetch(url))
       );
       expect(images.every(r => r.status === 200)).toBe(true);

       const video = await fetch(result.video_url);
       expect(video.status).toBe(200);
     });
   });
   ```

2. Key verification steps:
   - ✅ Council job created
   - ✅ Phase 1 completes (all 4 agentes respond)
   - ✅ Phase 2a: Audio generated (ElevenLabs)
   - ✅ Phase 2b: Images generated (Whisk)
   - ✅ Phase 2c: Video generated (Flow)
   - ✅ All signed URLs are valid + accessible
   - ✅ Content expires correctly (7-day window)

3. Timeout handling:
   - Phase 1: 10 min max
   - Phase 2: 30 min max (Flow is slow)

**Verification Command:**
```bash
npm run test:e2e -- --grep "ContentPipeline" --timeout 1800000
# 1800000ms = 30 min timeout
```

**Notes:**
- This is the ultimate validation test
- If this passes, entire sprint is successful
- Expect long run time due to API calls
- Add debug logging for troubleshooting

---

## ⚠️ Developer Context (COPY THIS TO PASS TO DEV)

```
⚠️ CRITICAL CONTEXT FOR DEVELOPER

70% of Phase 1 already exists in your codebase.
These files are PRODUCTION-READY and must NOT be rewritten:

✅ EXISTING FILES (70% Phase 1):
  - server/council-orchestrator.js (browser-first, state machine)
  - server/openclaw-driver.js (gateway port 18789, fallback)
  - server/scrapling-bridge.js (Alienware MCP, adaptive tracking)
  - server/server.js (3 council routes: POST/GET)
  - supabase/migrations/003_council_jobs.sql (state machine schema)
  - squads/brainet-squad/agents/*.prompt.md (4 system prompts)
  - squads/brainet-squad/schemas/council-input.schema.json (input validation)
  - squads/brainet-squad/data/routing-weights.yaml (objective → weights)
  - .env (OPENCLAW_GATEWAY_URL, OPENCLAW_TOKEN, SCRAPLING_URL, ALIENWARE_IP)

❌ WHAT YOU MUST BUILD (30% Phase 1 + 100% Phase 2):

PHASE 1 (REMAINING 30%):
  1.1 — Scrapling MCP setup (Alienware) + env vars
  1.2 — Puppeteer ↔ Scrapling integration (replace hardcoded selectors)
  1.3 — Validate state machine (just test, don't rewrite)
  1.4 — Deploy Supabase schema (just migrate, don't change SQL)
  1.5 — Test API endpoints (just verify, they're already there)
  1.6 — Load system prompts (just integrate, prompts exist)
  1.7 — E2E test with real Chrome + 4 tabs (NEW development)

PHASE 2 (100% NEW):
  2.1 — n8n WF2: Council Markdown → ElevenLabs TTS → audio.mp3
  2.2 — n8n WF3a: Tema keywords → Google Whisk → images
  2.3 — n8n WF3b: Audio + images → Google Flow → video.mp4
  2.4 — Supabase Storage buckets (council-audio, council-images, council-videos)
  2.5 — Add fase2_status tracking columns + cleanup logic
  2.6 — E2E test: full pipeline (1 input → texto+áudio+imagens+vídeo)

FOCUS YOUR TIME ON:
  • Integrating Scrapling's adaptive element tracking (1.2)
  • Writing real E2E tests with Chrome (1.7, 2.6)
  • Building 3 n8n workflows (2.1, 2.2, 2.3)
  • Don't waste time rewriting council-orchestrator, it's solid!

INFRASTRUCTURE CHECK:
  ✅ Mac: Chrome + puppeteer-core + OpenClaw (molt-mac) + Scrapling venv
  ✅ Alienware: Ollama (gpt-oss:20b) + n8n + Scrapling MCP
  ✅ Tailscale: Connecting both (6ms latency)
  ✅ Supabase: Ready for migrations

START HERE:
  1. Verify Scrapling MCP on Alienware is running (subtask 1.1)
  2. Update browser-llm.js to use Scrapling adaptive tracking (1.2)
  3. Run E2E test with real Chrome (1.7)
  4. Then move to Phase 2 n8n workflows (2.1-2.3)

Questions? Check:
  - server/council-orchestrator.js (state machine)
  - squads/brainet-squad/README.md (squad structure)
  - docs/plans/BRAINET-COUNCIL-12H-DETAILED.md (this file)
```

---

## 🎯 Time Breakdown

### Phase 1: Council (6h)

| Subtask | Type | Time | Note |
|---------|------|------|------|
| 1.1 | Integration | 20m | Scrapling MCP setup |
| 1.2 | Integration | 60m | Puppeteer ↔ Scrapling |
| 1.3 | Validation | 10m | Review state machine |
| 1.4 | Migration | 10m | Deploy Supabase |
| 1.5 | Testing | 15m | Verify endpoints |
| 1.6 | Integration | 10m | Load prompts |
| 1.7 | Development | 60m | E2E test (Chrome real) |
| Buffer | — | 80m | Slack for delays |
| **TOTAL** | | **6h** | |

### Phase 2: Content (6h)

| Subtask | Type | Time | Note |
|---------|------|------|------|
| 2.1 | Development | 75m | n8n TTS workflow |
| 2.2 | Development | 75m | n8n Image workflow |
| 2.3 | Development | 75m | n8n Video workflow |
| 2.4 | Infrastructure | 45m | Storage buckets |
| 2.5 | Database | 30m | fase2_status tracking |
| 2.6 | Development | 60m | E2E full pipeline |
| **TOTAL** | | **6h** | |

---

## ✅ Approval Options

**Choose one:**

1. ✅ **Approve Plan & Start** — Save as `in_progress`, create task list, begin implementation
2. 📋 **Show More Details** — Display all verification commands + error handling
3. 🔄 **Adjust Timeline** — Rebalance time estimates
4. 🚫 **Cancel & Restart** — Different approach

---

**Created:** 2026-02-26
**By:** @architect (Aria)
**Status:** Ready for Developer Review
