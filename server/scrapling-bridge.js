/**
 * Scrapling Bridge — MCP server bridge for Scrapling on Alienware
 *
 * Scrapling is a Python-based adaptive web scraper running on the Alienware
 * machine via Tailscale. It provides:
 * - Anti-detection scraping (Cloudflare bypass)
 * - Adaptive selectors (survive website structure changes)
 * - Stealth fetching
 *
 * Used by the Researcher agent for extracting data from complex websites
 * that regular browser automation can't handle reliably.
 */

const ALIENWARE_IP = process.env.ALIENWARE_IP || '100.66.114.87'
const SCRAPLING_PORT = process.env.SCRAPLING_PORT || '8765'
const SCRAPLING_URL = process.env.SCRAPLING_URL || `http://${ALIENWARE_IP}:${SCRAPLING_PORT}`

/**
 * Check if Scrapling MCP server is reachable on the Alienware
 */
export async function checkScraplingHealth() {
    try {
        const res = await fetch(`${SCRAPLING_URL}/health`, {
            signal: AbortSignal.timeout(5000),
        })

        if (!res.ok) return { available: false, error: `HTTP ${res.status}` }

        const data = await res.json()
        return {
            available: true,
            version: data.version || 'unknown',
            host: SCRAPLING_URL,
        }
    } catch (err) {
        return {
            available: false,
            error: err.message,
            host: SCRAPLING_URL,
        }
    }
}

/**
 * Scrape a URL using Scrapling's adaptive engine
 * Runs on the Alienware for CPU-heavy anti-detection operations
 *
 * @param {string} url - URL to scrape
 * @param {object} opts - { selector, waitFor, stealth, extractText }
 * @returns {object} { success, content, metadata }
 */
export async function scrapeUrl(url, opts = {}) {
    const timeout = opts.timeout || 60_000

    try {
        const res = await fetch(`${SCRAPLING_URL}/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                selector: opts.selector || 'body',
                wait_for: opts.waitFor || null,
                stealth: opts.stealth !== false, // default: on
                extract_text: opts.extractText !== false, // default: on
                adaptive: true, // Scrapling's signature feature
            }),
            signal: AbortSignal.timeout(timeout),
        })

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            throw new Error(`Scrapling error: ${res.status} ${body}`)
        }

        const data = await res.json()

        return {
            success: true,
            content: data.text || data.html || '',
            metadata: {
                url: data.url || url,
                statusCode: data.status_code,
                title: data.title || '',
                extractedAt: new Date().toISOString(),
            },
        }
    } catch (err) {
        return {
            success: false,
            content: '',
            error: err.message,
            metadata: { url },
        }
    }
}

/**
 * Batch scrape multiple URLs
 * Useful for the Researcher agent when processing `fontes[]` from input
 *
 * @param {string[]} urls - Array of URLs to scrape
 * @param {object} opts - Same as scrapeUrl opts
 * @returns {object[]} Array of scrape results
 */
export async function batchScrape(urls, opts = {}) {
    const maxConcurrent = opts.maxConcurrent || 3

    const results = []
    for (let i = 0; i < urls.length; i += maxConcurrent) {
        const batch = urls.slice(i, i + maxConcurrent)
        const batchResults = await Promise.allSettled(
            batch.map(url => scrapeUrl(url, opts))
        )
        results.push(
            ...batchResults.map((r, idx) => ({
                url: batch[idx],
                ...(r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message }),
            }))
        )
    }

    return results
}

/**
 * Get Scrapling config info
 */
export function getScraplingConfig() {
    return {
        url: SCRAPLING_URL,
        alienwareIp: ALIENWARE_IP,
        port: SCRAPLING_PORT,
    }
}

/**
 * Call Scrapling MCP to get an adaptive CSS selector based on hints.
 * This ensures UI changes don't break Puppeteer automation.
 * @param {string} url - URL context for the selector
 * @param {object} opts - { hints: string[], fallback: string }
 * @returns {string} The resilient CSS selector
 */
export async function getAdaptiveSelector(url, opts = {}) {
    const { hints = [], fallback = '' } = opts
    try {
        const res = await fetch(`${SCRAPLING_URL}/selector`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                hints,
                adaptive: true
            }),
            signal: AbortSignal.timeout(10000),
        })

        if (res.ok) {
            const data = await res.json()
            if (data.selector) return data.selector
        }
    } catch (err) {
        console.warn(`[ScraplingBridge] Failed to get adaptive selector for ${url}: ${err.message}`)
    }

    // Fall back to the first hint or the explicit fallback
    return fallback || (hints.length > 0 ? hints[0] : '')
}
