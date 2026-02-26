/**
 * LLM Resolution Hierarchy — Smart task routing
 *
 * Tiers (in priority order):
 *   1. worker   — Simple script transforms (no LLM needed)
 *   2. local    — Mac Ollama (localhost:11434)
 *   3. remote   — Alienware Ollama via Tailscale
 *   4. browser  — ChatGPT/Claude/Gemini via CDP
 *   5. api      — OpenAI/Anthropic cloud APIs
 *   6. glm5     — GLM5 model via MCP (Modal)
 *
 * The resolver tries each tier in order. If a tier fails or is unavailable,
 * it automatically falls through to the next one.
 */

import config from './config.js'
import { llmComplete, checkLLMHealth } from './llm-client.js'
import { councilExecute, checkCouncilHealth } from './council.js'

// ── Tier Health Cache ────────────────────────────────────────
const healthCache = {
    local: { ok: null, checkedAt: 0, model: null },
    remote: { ok: null, checkedAt: 0, model: null },
    browser: { ok: null, checkedAt: 0, count: 0 },
    api: { ok: null, checkedAt: 0, provider: null },
    glm5: { ok: null, checkedAt: 0 },
}

const HEALTH_TTL = 60_000 // 1 minute cache

// ── Task Complexity Classification ───────────────────────────
const COMPLEXITY = {
    SIMPLE: 'simple',     // formatting, lookup, short answers
    MEDIUM: 'medium',     // summarize, translate, short generation
    COMPLEX: 'complex',   // research, creative writing, long generation
    CRITICAL: 'critical', // reasoning, multi-step, long-form content
}

/**
 * Classify task complexity based on prompt content
 */
export function classifyTask(prompt, context = {}) {
    const len = (prompt || '').length
    const lower = (prompt || '').toLowerCase()

    // If agent specifies minimum tier, use its complexity level
    if (context.agentId && config.resolver?.agentTiers?.[context.agentId]) {
        const tier = config.resolver.agentTiers[context.agentId]
        if (tier.minTier === 'browser' || tier.minTier === 'api') return COMPLEXITY.COMPLEX
        if (tier.minTier === 'local') return COMPLEXITY.MEDIUM
    }

    // Force heavy to complex+
    if (context.heavy) return COMPLEXITY.CRITICAL

    // Heuristic classification
    if (len < 200 && !lower.includes('research') && !lower.includes('creative')) {
        return COMPLEXITY.SIMPLE
    }

    if (len < 1000) {
        if (lower.includes('summarize') || lower.includes('translate') || lower.includes('format')) {
            return COMPLEXITY.MEDIUM
        }
    }

    if (lower.includes('research') || lower.includes('analyze') || lower.includes('creative') ||
        lower.includes('write a complete') || lower.includes('matrix') || lower.includes('pipeline')) {
        return COMPLEXITY.CRITICAL
    }

    return len > 2000 ? COMPLEXITY.CRITICAL : COMPLEXITY.COMPLEX
}

// ── Tier Minimum Mapping ─────────────────────────────────────
const TIER_ORDER = ['worker', 'local', 'remote', 'browser', 'api', 'glm5']

function getTierIndex(tierName) {
    return TIER_ORDER.indexOf(tierName)
}

function getMinTierForComplexity(complexity) {
    switch (complexity) {
        case COMPLEXITY.SIMPLE: return 'worker'
        case COMPLEXITY.MEDIUM: return 'local'
        case COMPLEXITY.COMPLEX: return 'browser'
        case COMPLEXITY.CRITICAL: return 'browser'
        default: return 'local'
    }
}

// ── Health Checks ────────────────────────────────────────────

async function checkOllamaHealth(url, cacheKey) {
    const cached = healthCache[cacheKey]
    if (cached.ok !== null && Date.now() - cached.checkedAt < HEALTH_TTL) return cached

    try {
        const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000) })
        const data = await res.json()
        const models = data.models || []
        cached.ok = models.length > 0
        cached.model = models[0]?.name || null
        cached.models = models.map(m => m.name)
        cached.checkedAt = Date.now()
    } catch {
        cached.ok = false
        cached.model = null
        cached.checkedAt = Date.now()
    }

    return cached
}

async function checkBrowserHealth() {
    const cached = healthCache.browser
    if (cached.ok !== null && Date.now() - cached.checkedAt < HEALTH_TTL) return cached

    try {
        const health = await checkCouncilHealth()
        cached.ok = health.connected && health.totalAvailable > 0
        cached.count = health.totalAvailable || 0
        cached.ais = health.ais || {}
        cached.checkedAt = Date.now()
    } catch {
        cached.ok = false
        cached.count = 0
        cached.checkedAt = Date.now()
    }

    return cached
}

async function checkApiHealth() {
    const cached = healthCache.api
    if (cached.ok !== null && Date.now() - cached.checkedAt < HEALTH_TTL) return cached

    try {
        const result = await checkLLMHealth()
        cached.ok = result.ok
        cached.provider = config.llm.provider
        cached.checkedAt = Date.now()
    } catch {
        cached.ok = false
        cached.checkedAt = Date.now()
    }

    return cached
}

// ── Resolve (Main Entry Point) ────────────────────────────────

/**
 * Resolve a prompt through the tier hierarchy.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} opts - { heavy, agentId, councilMode, maxTokens, temperature }
 * @returns {Promise<{text, tier, model?, fallbackChain, duration}>}
 */
export async function resolve(systemPrompt, userPrompt, opts = {}) {
    const complexity = classifyTask(userPrompt, opts)
    const minTier = getMinTierForComplexity(complexity)
    const minIdx = getTierIndex(minTier)
    const startTime = Date.now()
    const fallbackChain = []

    // Agent-specific tier override
    let agentMinIdx = minIdx
    if (opts.agentId && config.resolver?.agentTiers?.[opts.agentId]?.minTier) {
        agentMinIdx = Math.max(minIdx, getTierIndex(config.resolver.agentTiers[opts.agentId].minTier))
    }

    const startIdx = Math.max(minIdx, agentMinIdx)

    console.log(`[Resolver] Complexity: ${complexity}, Min tier: ${TIER_ORDER[startIdx]}, Agent: ${opts.agentId || 'none'}`)

    // Try each tier in order from startIdx
    for (let i = startIdx; i < TIER_ORDER.length; i++) {
        const tier = TIER_ORDER[i]

        try {
            const result = await tryTier(tier, systemPrompt, userPrompt, opts)
            if (result) {
                const duration = ((Date.now() - startTime) / 1000).toFixed(1)
                console.log(`[Resolver] ✅ Resolved via ${tier} in ${duration}s`)
                return {
                    text: result.text,
                    tier,
                    model: result.model || null,
                    mode: result.mode || tier,
                    sources: result.sources || [tier],
                    analysis: result.analysis || `Resolved via ${tier}`,
                    fallbackChain,
                    duration: parseFloat(duration),
                }
            }
        } catch (err) {
            console.warn(`[Resolver] ❌ Tier ${tier} failed:`, err.message)
            fallbackChain.push({ tier, error: err.message })
        }
    }

    // All tiers exhausted
    throw new Error(`[Resolver] All tiers exhausted. Fallback chain: ${fallbackChain.map(f => f.tier).join(' → ')}`)
}

// ── Tier Implementations ─────────────────────────────────────

async function tryTier(tier, systemPrompt, userPrompt, opts) {
    switch (tier) {
        case 'worker':
            return await tryWorker(systemPrompt, userPrompt, opts)

        case 'local':
            return await tryOllama(
                config.resolver?.local?.url || process.env.OLLAMA_URL || 'http://localhost:11434',
                config.resolver?.local?.model || process.env.LOCAL_MODEL || null,
                systemPrompt, userPrompt, opts, 'local'
            )

        case 'remote':
            if (!config.resolver?.remote?.enabled && !process.env.REMOTE_OLLAMA_URL) return null
            return await tryOllama(
                config.resolver?.remote?.url || process.env.REMOTE_OLLAMA_URL,
                config.resolver?.remote?.model || process.env.REMOTE_MODEL || null,
                systemPrompt, userPrompt, opts, 'remote'
            )

        case 'browser':
            return await tryBrowser(systemPrompt, userPrompt, opts)

        case 'api':
            return await tryApi(systemPrompt, userPrompt, opts)

        case 'glm5':
            return await tryGlm5(systemPrompt, userPrompt, opts)

        default:
            return null
    }
}

/**
 * Tier 1: Worker — Simple script transforms
 */
async function tryWorker(systemPrompt, userPrompt, opts) {
    // Workers handle deterministic tasks (no LLM needed)
    // Currently no worker scripts registered — skip
    return null
}

/**
 * Tier 2/3: Ollama (local or remote)
 */
async function tryOllama(url, modelOverride, systemPrompt, userPrompt, opts, cacheKey) {
    const health = await checkOllamaHealth(url, cacheKey)
    if (!health.ok) return null

    const model = modelOverride || health.model
    if (!model) return null

    const maxTokens = opts.maxTokens || (opts.heavy ? 8192 : 4096)
    const temperature = opts.temperature ?? 0.7

    const res = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            stream: false,
            options: {
                num_predict: maxTokens,
                temperature,
            },
        }),
        signal: AbortSignal.timeout(120_000), // 2 min timeout
    })

    if (!res.ok) throw new Error(`Ollama ${cacheKey} HTTP ${res.status}`)

    const data = await res.json()
    const text = data.message?.content || ''
    if (!text.trim()) return null

    return {
        text,
        model,
        mode: `ollama_${cacheKey}`,
        sources: [`ollama:${model}`],
        analysis: `Resolved via Ollama (${cacheKey}): ${model}`,
    }
}

/**
 * Tier 4: Browser AI Council
 */
async function tryBrowser(systemPrompt, userPrompt, opts) {
    const health = await checkBrowserHealth()
    if (!health.ok) return null

    const result = await councilExecute(systemPrompt, userPrompt, {
        ...opts,
        skipFallback: true, // Don't let council.js do its own fallback — we handle it
    })

    if (!result?.text?.trim()) return null

    return {
        text: result.text,
        mode: result.mode || 'browser',
        sources: result.sources || ['browser'],
        analysis: result.analysis || 'Resolved via browser AI council',
    }
}

/**
 * Tier 5: Cloud API (OpenAI/Anthropic)
 */
async function tryApi(systemPrompt, userPrompt, opts) {
    const health = await checkApiHealth()
    if (!health.ok) return null

    const text = await llmComplete(systemPrompt, userPrompt, {
        heavy: opts.heavy,
        maxTokens: opts.maxTokens,
        temperature: opts.temperature,
    })

    if (!text?.trim()) return null

    return {
        text,
        model: opts.heavy ? config.llm.heavyModel : config.llm.model,
        mode: 'api',
        sources: [config.llm.provider],
        analysis: `Resolved via ${config.llm.provider} API`,
    }
}

/**
 * Tier 6: GLM5 via MCP
 */
async function tryGlm5(systemPrompt, userPrompt, opts) {
    // GLM5 is accessed via MCP tool — we call it as an HTTP endpoint if configured
    const glm5Url = process.env.GLM5_URL || config.resolver?.glm5?.url
    if (!glm5Url) return null

    try {
        const res = await fetch(glm5Url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: userPrompt,
                system_prompt: systemPrompt,
            }),
            signal: AbortSignal.timeout(60_000),
        })

        if (!res.ok) return null
        const data = await res.json()
        const text = data.response || data.text || data.content || ''
        if (!text.trim()) return null

        return {
            text,
            model: 'glm5',
            mode: 'glm5',
            sources: ['glm5-modal'],
            analysis: 'Resolved via GLM5 (Modal)',
        }
    } catch {
        return null
    }
}

// ── Health Summary (for API endpoints) ────────────────────────

/**
 * Get health status of all tiers
 */
export async function getResolverHealth() {
    const localUrl = config.resolver?.local?.url || process.env.OLLAMA_URL || 'http://localhost:11434'
    const remoteUrl = config.resolver?.remote?.url || process.env.REMOTE_OLLAMA_URL
    const remoteEnabled = !!(config.resolver?.remote?.enabled || process.env.REMOTE_OLLAMA_URL)

    const [localH, remoteH, browserH, apiH] = await Promise.allSettled([
        checkOllamaHealth(localUrl, 'local'),
        remoteEnabled ? checkOllamaHealth(remoteUrl, 'remote') : Promise.resolve({ ok: false, model: null }),
        checkBrowserHealth(),
        checkApiHealth(),
    ])

    const local = localH.status === 'fulfilled' ? localH.value : { ok: false }
    const remote = remoteH.status === 'fulfilled' ? remoteH.value : { ok: false }
    const browser = browserH.status === 'fulfilled' ? browserH.value : { ok: false }
    const api = apiH.status === 'fulfilled' ? apiH.value : { ok: false }

    return {
        tiers: [
            { name: 'worker', status: 'passive', description: 'No workers registered' },
            {
                name: 'local',
                status: local.ok ? 'online' : 'offline',
                model: local.model || null,
                models: local.models || [],
                url: localUrl,
            },
            {
                name: 'remote',
                status: remoteEnabled ? (remote.ok ? 'online' : 'offline') : 'disabled',
                model: remote.model || null,
                url: remoteUrl || null,
            },
            {
                name: 'browser',
                status: browser.ok ? 'online' : 'offline',
                count: browser.count || 0,
                ais: browser.ais || {},
            },
            {
                name: 'api',
                status: api.ok ? 'online' : 'offline',
                provider: api.provider || null,
            },
            {
                name: 'glm5',
                status: process.env.GLM5_URL ? 'configured' : 'not_configured',
            },
        ],
        activeTiers: ['worker', 'local', 'remote', 'browser', 'api', 'glm5']
            .filter((t, i) => {
                if (t === 'worker') return false
                if (t === 'local') return local.ok
                if (t === 'remote') return remote.ok
                if (t === 'browser') return browser.ok
                if (t === 'api') return api.ok
                if (t === 'glm5') return !!process.env.GLM5_URL
                return false
            }),
        timestamp: new Date().toISOString(),
    }
}

/**
 * Invalidate all health caches (force re-check)
 */
export function invalidateHealthCache() {
    Object.values(healthCache).forEach(c => { c.ok = null; c.checkedAt = 0 })
}

export { COMPLEXITY, TIER_ORDER }
