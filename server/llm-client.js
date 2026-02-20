/**
 * BRAINET LLM Client
 * Unified interface for OpenAI, Anthropic, and Ollama
 */

import config from './config.js'

/**
 * Send a completion request to the configured LLM.
 * @param {string} systemPrompt - The agent's full prompt from workspace
 * @param {string} userPrompt - The specific task/input
 * @param {object} opts - { heavy: boolean, temperature: number }
 * @returns {string} The LLM response text
 */
export async function llmComplete(systemPrompt, userPrompt, opts = {}) {
    const provider = config.llm.provider
    const model = opts.heavy ? config.llm.heavyModel : config.llm.model
    const maxTokens = opts.heavy ? config.llm.heavyMaxTokens : config.llm.maxTokens
    const temperature = opts.temperature ?? config.llm.temperature

    console.log(`[LLM] Provider: ${provider}, Model: ${model}, Heavy: ${!!opts.heavy}`)

    switch (provider) {
        case 'openai':
            return await openaiComplete(systemPrompt, userPrompt, model, maxTokens, temperature)
        case 'anthropic':
            return await anthropicComplete(systemPrompt, userPrompt, model, maxTokens, temperature)
        case 'ollama':
            return await ollamaComplete(systemPrompt, userPrompt, model, maxTokens, temperature)
        default:
            throw new Error(`Unknown LLM provider: ${provider}`)
    }
}

// --- OPENAI ---
async function openaiComplete(systemPrompt, userPrompt, model, maxTokens, temperature) {
    const key = config.llm.openaiKey
    if (!key) throw new Error('OPENAI_API_KEY not set. Export it in your shell or .env file.')

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
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
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`OpenAI API error (${res.status}): ${err}`)
    }

    const data = await res.json()
    return data.choices[0].message.content
}

// --- ANTHROPIC ---
async function anthropicComplete(systemPrompt, userPrompt, model, maxTokens, temperature) {
    const key = config.llm.anthropicKey
    if (!key) throw new Error('ANTHROPIC_API_KEY not set. Export it in your shell or .env file.')

    const anthropicModel = model.startsWith('claude') ? model : 'claude-sonnet-4-20250514'

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: anthropicModel,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt },
            ],
            max_tokens: maxTokens,
            temperature,
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Anthropic API error (${res.status}): ${err}`)
    }

    const data = await res.json()
    return data.content[0].text
}

// --- OLLAMA ---
async function ollamaComplete(systemPrompt, userPrompt, model, maxTokens, temperature) {
    const ollamaModel = model.includes('/') ? model : (model.startsWith('gpt') ? 'llama3.1' : model)

    const res = await fetch(`${config.llm.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: ollamaModel,
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
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Ollama error (${res.status}): ${err}. Is Ollama running?`)
    }

    const data = await res.json()
    return data.message.content
}

/**
 * Check if LLM is configured and reachable
 */
export async function checkLLMHealth() {
    const provider = config.llm.provider

    try {
        if (provider === 'ollama') {
            const res = await fetch(`${config.llm.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
            return { ok: res.ok, provider, models: res.ok ? (await res.json()).models?.map(m => m.name) : [] }
        }

        if (provider === 'openai') {
            return { ok: !!config.llm.openaiKey, provider, model: config.llm.model }
        }

        if (provider === 'anthropic') {
            return { ok: !!config.llm.anthropicKey, provider, model: config.llm.model }
        }
    } catch (e) {
        return { ok: false, provider, error: e.message }
    }
}
