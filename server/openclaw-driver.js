/**
 * OpenClaw Driver — Adapter for OpenClaw Gateway
 *
 * Connects to the locally running OpenClaw Gateway (port 18789)
 * to leverage browser automation for AI interactions.
 *
 * OpenClaw can:
 * - Control Chrome tabs via CDP (chatgpt.com, claude.ai, gemini.google.com, grok.x.ai)
 * - Execute skills (web_fetch, file operations, etc.)
 * - Use its own LLM routing (local models via Ollama)
 *
 * This driver provides a unified interface for the Council Orchestrator.
 */

const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789'
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN

if (!OPENCLAW_TOKEN) {
    console.warn('[OpenClaw] OPENCLAW_TOKEN not set in environment - OpenClaw Gateway will not be available')
}

/**
 * Check if OpenClaw Gateway is running and healthy
 */
export async function checkOpenClawHealth() {
    try {
        const res = await fetch(`${OPENCLAW_URL}/v1/models`, {
            headers: { 'Authorization': `Bearer ${OPENCLAW_TOKEN}` },
            signal: AbortSignal.timeout(5000),
        })

        if (!res.ok) return { available: false, error: `HTTP ${res.status}` }

        const data = await res.json()
        return {
            available: true,
            models: data.data || [],
            gateway: OPENCLAW_URL,
        }
    } catch (err) {
        return { available: false, error: err.message }
    }
}

/**
 * Send a prompt via OpenClaw's chat completions endpoint.
 * This routes through OpenClaw's configured model (e.g., Ollama on Alienware).
 *
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User prompt
 * @param {object} opts - { model, maxTokens, temperature, timeout }
 * @returns {string} Response text
 */
export async function sendViaOpenClaw(systemPrompt, userPrompt, opts = {}) {
    const model = opts.model || 'custom/gpt-oss:20b'
    const maxTokens = opts.maxTokens || 4096
    const temperature = opts.temperature || 0.7
    const timeout = opts.timeout || 120_000

    const res = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            max_tokens: maxTokens,
            temperature,
        }),
        signal: AbortSignal.timeout(timeout),
    })

    if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`OpenClaw API error: ${res.status} ${body}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
}

/**
 * Execute an OpenClaw skill (e.g., web_fetch for the Researcher)
 *
 * @param {string} skillName - Skill to execute
 * @param {object} params - Skill parameters
 * @returns {object} Skill result
 */
export async function executeOpenClawSkill(skillName, params = {}) {
    try {
        // OpenClaw skills are invoked via chat with tool-use instructions
        const prompt = buildSkillPrompt(skillName, params)

        const result = await sendViaOpenClaw(
            'You are a skill executor. Execute the requested task and return the result.',
            prompt,
            { timeout: 60_000 }
        )

        return { success: true, result }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

/**
 * Use OpenClaw to fetch and extract content from a URL
 * Leverages OpenClaw's web_fetch skill for the Researcher agent
 *
 * @param {string} url - URL to fetch
 * @param {string} extractionGoal - What to extract from the page
 * @returns {string} Extracted content
 */
export async function webFetch(url, extractionGoal = 'Extract all relevant content') {
    const prompt = `Fetch the following URL and extract the content.

URL: ${url}

Extraction Goal: ${extractionGoal}

Return the extracted content in clean markdown format. Include key facts, data, and quotes.`

    return await sendViaOpenClaw(
        'You are a web research agent. Fetch URLs and extract structured information.',
        prompt,
        { timeout: 90_000 }
    )
}

function buildSkillPrompt(skillName, params) {
    switch (skillName) {
        case 'web_fetch':
            return `Use the web_fetch skill to retrieve content from: ${params.url}\nExtract: ${params.goal || 'main content'}`
        case 'file_read':
            return `Read the file at: ${params.path}`
        case 'shell_exec':
            return `Execute the following command: ${params.command}`
        default:
            return `Execute skill "${skillName}" with parameters: ${JSON.stringify(params)}`
    }
}

/**
 * Get OpenClaw configuration info
 */
export function getOpenClawConfig() {
    return {
        url: OPENCLAW_URL,
        tokenConfigured: !!OPENCLAW_TOKEN,
    }
}
