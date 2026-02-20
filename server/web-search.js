/**
 * BRAINET Web Search Client
 * Uses Brave Search API for Agent 1 research
 * Falls back to no-search mode if no API key
 */

import config from './config.js'

/**
 * Search web for research sources by pillar
 * @param {string} subject - The niche/topic
 * @param {string} pillar - 'ouro' | 'vivas' | 'popular' | 'polemica'
 * @returns {Array} Array of search results
 */
export async function searchByPillar(subject, pillar) {
    const queries = generateQueries(subject, pillar)
    const allResults = []

    for (const query of queries.slice(0, config.search.maxQueriesPerPillar)) {
        try {
            const results = await braveSearch(query)
            allResults.push(...results)
        } catch (e) {
            console.warn(`[Search] Query failed: "${query}" — ${e.message}`)
        }
    }

    // Deduplicate by URL
    const seen = new Set()
    return allResults.filter(r => {
        if (seen.has(r.url)) return false
        seen.add(r.url)
        return true
    })
}

/**
 * Generate search queries per pillar
 */
function generateQueries(subject, pillar) {
    const base = subject

    switch (pillar) {
        case 'ouro':
            return [
                `${base} livro PDF filetype:pdf`,
                `${base} artigo acadêmico peer-reviewed`,
                `${base} handbook textbook guia completo`,
                `${base} tese dissertação pesquisa científica`,
                `${base} documentos oficiais referência`,
            ]
        case 'vivas':
            return [
                `${base} YouTube channel canal especialista`,
                `${base} blog newsletter especializado`,
                `${base} podcast episódio recente 2025 2026`,
                `${base} perfil Instagram X Twitter especialista`,
                `${base} RSS feed conteúdo atualizado`,
            ]
        case 'popular':
            return [
                `${base} popular prática ritual oração`,
                `${base} "todo mundo sabe" crença tradição`,
                `${base} meme viral trending cultura pop`,
                `${base} comunidade fórum Reddit grupo Facebook`,
                `${base} dica caseira sabedoria popular funciona`,
            ]
        case 'polemica':
            return [
                `${base} controvérsia debate polêmica`,
                `${base} mito mentira não funciona verdade`,
                `${base} "vs" versus comparação diferença`,
                `${base} crítica refutação resposta`,
                `${base} "unpopular opinion" Reddit ${base}`,
            ]
        default:
            return [`${base}`]
    }
}

/**
 * Execute a Brave Search API query
 */
async function braveSearch(query) {
    const apiKey = config.search.apiKey
    if (!apiKey) {
        console.warn('[Search] No BRAVE_API_KEY set. Using dummy results.')
        return generateDummyResults(query)
    }

    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${config.search.maxResultsPerQuery}`

    const res = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': apiKey,
        },
    })

    if (!res.ok) {
        throw new Error(`Brave Search error (${res.status})`)
    }

    const data = await res.json()

    return (data.web?.results || []).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        source: r.meta_url?.hostname || new URL(r.url).hostname,
        age: r.age || null,
    }))
}

/**
 * Dummy results when no API key is available
 * The LLM will still generate good research using its training data
 */
function generateDummyResults(query) {
    return [
        {
            title: `[Pesquisa simulada] Resultados para: "${query}"`,
            url: `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
            snippet: `Pesquisa real requer BRAVE_API_KEY. O LLM usará seu conhecimento interno para gerar pesquisa sobre: ${query}`,
            source: 'brave.com',
            age: null,
        }
    ]
}

/**
 * Full research for Agent 1 — searches all 4 pillars
 */
export async function fullResearch(subject) {
    console.log(`[Search] Starting full research for: "${subject}"`)

    const pillars = ['ouro', 'vivas', 'popular', 'polemica']
    const results = {}

    for (const pillar of pillars) {
        console.log(`[Search] Researching pillar: ${pillar}`)
        results[pillar] = await searchByPillar(subject, pillar)
        console.log(`[Search] Found ${results[pillar].length} results for ${pillar}`)
    }

    return results
}

/**
 * Check if search is configured
 */
export function isSearchConfigured() {
    return !!config.search.apiKey
}
