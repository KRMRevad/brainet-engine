/**
 * BRAINET Dice Engine — "I'm Feeling Lucky"
 * Selects niches randomly with weighted probability
 * and auto-deepens through the taxonomy.
 */

import nichosData from '../data/nichos.json'
import { API_BASE } from './config.js'

// --- STATE ---
let explorationHistory = JSON.parse(localStorage.getItem('brainet_history') || '[]')
let sessionId = localStorage.getItem('brainet_session_id')

// Initialize session ID if not present
if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem('brainet_session_id', sessionId)
}

/**
 * Roll the dice — select a random niche weighted by exploration frequency.
 * Less explored niches have higher probability.
 */
export function rollDice() {
    const nichos = nichosData.nichos

    // Calculate weights: unexplored niches have higher chance
    const weights = nichos.map(n => {
        const explorations = explorationHistory.filter(h => h.nichoId === n.id).length
        // Base weight + penalty for high exploration
        return Math.max(1, n.peso * 10 - explorations)
    })

    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let random = Math.random() * totalWeight
    let selected = nichos[0]

    for (let i = 0; i < nichos.length; i++) {
        random -= weights[i]
        if (random <= 0) {
            selected = nichos[i]
            break
        }
    }

    // Log exploration locally
    const entry = {
        nichoId: selected.id,
        timestamp: new Date().toISOString(),
    }
    explorationHistory.push(entry)
    localStorage.setItem('brainet_history', JSON.stringify(explorationHistory))

    // Send to server for database logging (T7)
    fetch(`${API_BASE}/api/exploration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nichoId: selected.id,
            sessionId,
            userAgent: navigator.userAgent,
        }),
    }).catch(err => console.warn('[DiceEngine] Failed to log exploration:', err.message))

    return selected
}

/**
 * Deepen a niche — randomly pick a subtema, formato, and ângulo.
 */
export function deepenNiche(nicho) {
    const subtema = pickRandom(nicho.subtemas)
    const formato = pickRandom(subtema.formatos)
    const angulo = pickRandom(formato.angulos)

    return {
        nicho,
        subtema,
        formato,
        angulo,
        depth: 'full',
        timestamp: new Date().toISOString()
    }
}

/**
 * Full dice roll: pick a niche AND deepen it automatically
 */
export function feelingLucky() {
    const nicho = rollDice()
    return deepenNiche(nicho)
}

/**
 * Get all nichos from database
 */
export function getAllNichos() {
    return nichosData.nichos
}

/**
 * Get a specific nicho by ID
 */
export function getNichoById(id) {
    return nichosData.nichos.find(n => n.id === id)
}

/**
 * Get exploration stats
 */
export function getExplorationStats() {
    const stats = {}
    nichosData.nichos.forEach(n => {
        stats[n.id] = {
            nome: n.nome,
            explorations: explorationHistory.filter(h => h.nichoId === n.id).length,
            lastExplored: explorationHistory
                .filter(h => h.nichoId === n.id)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.timestamp || null
        }
    })
    return stats
}

/**
 * Count total ângulos in a nicho
 */
export function countAngulos(nicho) {
    let count = 0
    nicho.subtemas.forEach(s => {
        s.formatos.forEach(f => {
            count += f.angulos.length
        })
    })
    return count
}

/**
 * Get total stats for the entire taxonomy
 */
/**
 * Get taxonomy statistics
 * - Counts: nichos, subtemas, formatos, angulos
 * - Explorations: from localStorage (fallback) or fetches from server (T7)
 */
export async function getTaxonomyStats() {
    const nichos = nichosData.nichos
    let totalSubtemas = 0
    let totalFormatos = 0
    let totalAngulos = 0
    let explorations = explorationHistory.length // Local fallback

    nichos.forEach(n => {
        totalSubtemas += n.subtemas.length
        n.subtemas.forEach(s => {
            totalFormatos += s.formatos.length
            s.formatos.forEach(f => {
                totalAngulos += f.angulos.length
            })
        })
    })

    // Try to fetch exploration stats from server (T7)
    try {
        const response = await fetch(`${API_BASE}/api/exploration/stats`)
        if (response.ok) {
            const data = await response.json()
            // Sum all stats from the server
            explorations = Object.values(data.stats).reduce((a, b) => a + b, 0)
        }
    } catch (e) {
        console.warn('[DiceEngine] Failed to fetch exploration stats from server:', e.message)
        // Fall back to localStorage count
    }

    return {
        nichos: nichos.length,
        subtemas: totalSubtemas,
        formatos: totalFormatos,
        angulos: totalAngulos,
        explorations
    }
}

// --- HELPERS ---
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}
