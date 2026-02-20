/**
 * BRAINET Merge Engine
 * Combines outputs from multiple AIs in COUNCIL mode
 * Selects best sections and complementary content
 */

/**
 * Merge multiple AI responses using best-of-N selection
 * @param {object[]} responses - Array of { ai, name, emoji, text, length }
 * @param {string} mode - 'select_best' | 'combine' | 'structured'
 * @returns {object} { merged, analysis, sources }
 */
export function mergeResponses(responses, mode = 'combine') {
    if (responses.length === 0) return { merged: '', analysis: 'No responses', sources: [] }
    if (responses.length === 1) return { merged: responses[0].text, analysis: 'Single source', sources: [responses[0].ai] }

    switch (mode) {
        case 'select_best':
            return selectBest(responses)
        case 'combine':
            return combineAll(responses)
        case 'structured':
            return structuredMerge(responses)
        default:
            return combineAll(responses)
    }
}

/**
 * Select the best response by heuristic scoring
 */
function selectBest(responses) {
    const scored = responses.map(r => ({
        ...r,
        score: scoreResponse(r.text),
    }))

    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]

    return {
        merged: best.text,
        analysis: `Selected ${best.emoji} ${best.name} (score: ${best.score}). Others: ${scored.slice(1).map(s => `${s.emoji}${s.score}`).join(', ')}`,
        sources: [best.ai],
        scores: scored.map(s => ({ ai: s.ai, score: s.score })),
    }
}

/**
 * Combine all responses with clear attribution
 */
function combineAll(responses) {
    const scored = responses.map(r => ({
        ...r,
        score: scoreResponse(r.text),
    }))

    scored.sort((a, b) => b.score - a.score)

    // Build combined document
    let merged = `# 🧠 CONSELHO BRAINET — Output Combinado\n\n`
    merged += `**Modo:** COUNCIL (${responses.length} IAs)\n`
    merged += `**Data:** ${new Date().toISOString()}\n\n`
    merged += `## 📊 Ranking\n\n`

    scored.forEach((r, i) => {
        merged += `${i + 1}. ${r.emoji} **${r.name}** — Score: ${r.score} (${r.text.length} chars)\n`
    })

    merged += `\n---\n\n`

    // Add each response with section breaks
    scored.forEach((r, i) => {
        merged += `## ${r.emoji} Resposta ${i + 1}: ${r.name} (Score: ${r.score})\n\n`
        merged += r.text
        merged += `\n\n---\n\n`
    })

    // Add synthesis prompt for the next stage
    merged += `## 🔄 Pontos Únicos por IA\n\n`
    scored.forEach(r => {
        const uniqueTerms = findUniqueTerms(r.text, scored.filter(s => s.ai !== r.ai).map(s => s.text))
        if (uniqueTerms.length > 0) {
            merged += `**${r.emoji} ${r.name}** trouxe: ${uniqueTerms.slice(0, 10).join(', ')}\n`
        }
    })

    return {
        merged,
        analysis: `Combined ${responses.length} responses. Best: ${scored[0].emoji} ${scored[0].name}`,
        sources: scored.map(s => s.ai),
        scores: scored.map(s => ({ ai: s.ai, score: s.score })),
    }
}

/**
 * Structured merge: extract sections and combine best parts
 */
function structuredMerge(responses) {
    // For structured documents (like Q&As, roteiros), parse sections
    const scored = responses.map(r => ({
        ...r,
        score: scoreResponse(r.text),
        sections: extractSections(r.text),
    }))

    scored.sort((a, b) => b.score - a.score)

    // Use the best response as base
    let merged = scored[0].text

    // Add unique content from other responses
    merged += `\n\n---\n\n## 🔄 Conteúdo Complementar (de outras IAs)\n\n`

    for (const resp of scored.slice(1)) {
        const uniqueSections = resp.sections.filter(s =>
            !scored[0].sections.some(bs => similarity(s.title, bs.title) > 0.7)
        )
        if (uniqueSections.length > 0) {
            merged += `### ${resp.emoji} De ${resp.name}:\n\n`
            uniqueSections.forEach(s => {
                merged += `#### ${s.title}\n${s.content}\n\n`
            })
        }
    }

    return {
        merged,
        analysis: `Structured merge. Base: ${scored[0].emoji}. Added ${scored.slice(1).length} complementary sources.`,
        sources: scored.map(s => s.ai),
        scores: scored.map(s => ({ ai: s.ai, score: s.score })),
    }
}

/**
 * Score a response by quality heuristics
 */
function scoreResponse(text) {
    if (!text || text.length < 100) return 0

    let score = 0

    // Length (longer is generally better for research, up to a point)
    score += Math.min(text.length / 500, 20)

    // Structure (headers, lists, formatting)
    score += (text.match(/^#{1,3}\s/gm) || []).length * 2  // Headers
    score += (text.match(/^[-*]\s/gm) || []).length * 0.5   // List items
    score += (text.match(/\*\*[^*]+\*\*/g) || []).length * 0.3 // Bold terms
    score += (text.match(/```/g) || []).length * 1.5          // Code blocks
    score += (text.match(/\|.*\|/g) || []).length * 0.5       // Tables

    // Content richness
    score += (text.match(/\d+/g) || []).length * 0.1          // Numbers/data
    score += (text.match(/https?:\/\//g) || []).length * 1    // URLs/sources

    // Penalize very short responses
    if (text.length < 500) score *= 0.5
    if (text.length < 200) score *= 0.3

    return Math.round(score * 10) / 10
}

/**
 * Find unique terms in one text vs others
 */
function findUniqueTerms(text, otherTexts) {
    const allOther = otherTexts.join(' ').toLowerCase()
    const words = text.match(/\b[A-Za-zÀ-ÿ]{5,}\b/g) || []
    const wordFreq = {}

    words.forEach(w => {
        const lower = w.toLowerCase()
        if (!wordFreq[lower]) wordFreq[lower] = 0
        wordFreq[lower]++
    })

    return Object.entries(wordFreq)
        .filter(([word, count]) => count >= 2 && !allOther.includes(word))
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word)
}

/**
 * Extract sections from markdown text
 */
function extractSections(text) {
    const sections = []
    const lines = text.split('\n')
    let currentTitle = ''
    let currentContent = []

    for (const line of lines) {
        if (line.match(/^#{1,3}\s/)) {
            if (currentTitle) {
                sections.push({ title: currentTitle, content: currentContent.join('\n').trim() })
            }
            currentTitle = line.replace(/^#{1,3}\s/, '').trim()
            currentContent = []
        } else {
            currentContent.push(line)
        }
    }

    if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.join('\n').trim() })
    }

    return sections
}

/**
 * Simple text similarity (Jaccard on words)
 */
function similarity(a, b) {
    const wordsA = new Set(a.toLowerCase().split(/\s+/))
    const wordsB = new Set(b.toLowerCase().split(/\s+/))
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length
    const union = new Set([...wordsA, ...wordsB]).size
    return union === 0 ? 0 : intersection / union
}
