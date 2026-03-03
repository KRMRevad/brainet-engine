/**
 * BRAINET Prompt Loader
 * Reads agent prompt files from the Obsidian workspace
 * and prepares them as LLM system prompts
 */

import fs from 'fs/promises'
import path from 'path'
import config from './config.js'

const promptCache = new Map()
const PROMPT_CACHE_TTL_MS = (parseInt(process.env.PROMPT_CACHE_TTL_SECONDS || '300') * 1000)

/**
 * Load an agent's prompt from the workspace or local prompts directory
 * AC-4: Cache with configurable TTL via PROMPT_CACHE_TTL_SECONDS
 *
 * @param {number|string} agentId - Agent number or key
 * @returns {string} Cleaned system prompt
 */
export async function loadAgentPrompt(agentId) {
    // Check cache with TTL
    if (promptCache.has(agentId)) {
        const cached = promptCache.get(agentId)
        const age = Date.now() - cached.cachedAt

        if (age < PROMPT_CACHE_TTL_MS) {
            // Cache is still fresh
            return cached.content
        }
        // Cache expired, remove it
        promptCache.delete(agentId)
    }

    const filename = config.agents.promptFiles[agentId]
    if (!filename) {
        throw new Error(`No prompt file configured for agent: ${agentId}`)
    }

    // Load from configured prompts directory (server/prompts by default)
    const promptsDir = path.isAbsolute(config.agents.promptDir)
        ? config.agents.promptDir
        : path.resolve(process.cwd(), config.agents.promptDir)
    const promptPath = path.join(promptsDir, filename)

    try {
        const raw = await fs.readFile(promptPath, 'utf-8')
        const cleaned = cleanPrompt(raw)
        // AC-4: Store with timestamp for TTL expiration
        promptCache.set(agentId, {
            content: cleaned,
            cachedAt: Date.now(),
        })
        console.log(`[PromptLoader] Loaded agent ${agentId} prompt (${cleaned.length} chars) [TTL: ${PROMPT_CACHE_TTL_MS / 1000}s]`)
        return cleaned
    } catch (e) {
        throw new Error(`Failed to load agent ${agentId} prompt from ${promptPath}: ${e.message}`, { cause: e })
    }
}

/**
 * Clean a raw .md prompt for use as system prompt
 * - Removes Obsidian frontmatter tags
 * - Removes wikilinks
 * - Keeps the core instruction content
 */
function cleanPrompt(raw) {
    let cleaned = raw

    // Remove Obsidian header tags line (first line with #EVAD #BRAINET etc.)
    cleaned = cleaned.replace(/^#EVAD\s+#BRAINET.*\n?/m, '')

    // Remove wikilinks: [[BRAINET ]]
    cleaned = cleaned.replace(/\[\[.*?\]\]/g, '')

    // Remove empty lines at start
    cleaned = cleaned.replace(/^\s*\n+/, '')

    return cleaned.trim()
}

/**
 * Prepare user prompt for a specific agent with context
 * @param {number} agentId
 * @param {object} context - { nicho, subtema, formato, angulo, previousOutputs }
 * @returns {string} User prompt
 */
export function buildUserPrompt(agentId, context) {
    const { nicho, subtema, formato, angulo, previousOutputs = {} } = context

    switch (agentId) {
        case 1: // Pesquisa Profunda
            return buildAgent1Prompt(context)
        case 2: // Extração de Conhecimento
            return buildAgent2Prompt(context)
        case 3: // Matrix Mente Superior
            return buildAgent3Prompt(context)
        case 4: // Captura de Insights
            return buildAgent4Prompt(context)
        case 5: // Estratégia Multicanal
            return buildAgent5Prompt(context)
        case 6: // Roteirista Estratégico
            return buildAgent6Prompt(context)
        default:
            return buildGenericPrompt(agentId, context)
    }
}

function buildAgent1Prompt(ctx) {
    const searchResults = ctx.searchResults || {}

    let prompt = `# GATILHO INICIAL

**Assunto/Núcleo:** ${ctx.angulo}

**Nicho:** ${ctx.nicho.nome} (${ctx.nicho.arquetipo})

**Subtema:** ${ctx.subtema?.nome || 'Geral'}

**Formato alvo:** ${ctx.formato?.nome || 'Todos'}

**Objetivo prático:** Construir Canon completo para produção de conteúdo no canal BRAINET

**Pergunta-mãe do Canon:** Qual é a verdade profunda por trás de "${ctx.angulo}"?

**Escopo:** intermediário a avançado

**Idiomas aceitos:** pt, en, es

**Janela temporal preferida:** clássicos + atual

**Formato final:** Obsidian Markdown

**Tamanho do Canon:** 21 itens sagrados

**Risco/criticidade:** médio

**Restrições:** Priorizar fontes primárias e verificáveis, evitar opinião sem embasamento`

    // Add search results if available
    if (Object.keys(searchResults).length > 0) {
        prompt += `\n\n---\n\n# RESULTADOS DE PESQUISA WEB (para complementar sua análise)\n`

        for (const [pillar, results] of Object.entries(searchResults)) {
            prompt += `\n## PILAR: ${pillar.toUpperCase()}\n`
            results.forEach((r, i) => {
                prompt += `${i + 1}. **${r.title}** — ${r.source}\n   URL: ${r.url}\n   ${r.snippet}\n\n`
            })
        }
    }

    prompt += `\n\n---\n\nExecute TODAS as etapas (Mapa de Fontes → Busca e Triagem → Extração → Canonização → Biblioteca de Ganchos) em uma resposta estruturada completa. Entregue o PACOTE FINAL V2.0 em Markdown.`

    return prompt
}

function buildAgent2Prompt(ctx) {
    const canonOutput = ctx.previousOutputs[1] || ''

    return `# MATERIAL PARA EXTRAÇÃO

O Canon completo abaixo foi gerado pelo Agente 1 (Pesquisa Profunda) para o assunto: "${ctx.angulo}"

Nicho: ${ctx.nicho.nome}
Subtema: ${ctx.subtema?.nome || 'Geral'}

---

${canonOutput}

---

# INSTRUÇÃO

Execute o processo completo de extração conforme suas instruções:

1. **PASSO 0:** Valide o input (identifique quais pilares estão presentes)
2. **PASSO 1:** Mapeamento Temático (6 grandes pilares temáticos)
3. **PASSO 2:** BATERIA 1 — 25 Q&As do Pilar Ouro
4. **PASSO 3:** BATERIA 2 — 25 Q&As do Pilar Vivas
5. **PASSO 4:** BATERIA 3 — 25 Q&As do Pilar Popular
6. **PASSO 4.5:** BATERIA 4 — 20 Q&As do Pilar Polêmica
7. **PASSO 5:** BATERIA 5 — 15 Q&As de Frameworks
8. **PASSO 6:** BATERIA 6 — 15 Q&As de Conexões Interdisciplinares

Gere TODOS os Q&As de uma vez (todas as 6 baterias) no formato V2.1. Meta: ~125 Q&As totais.`
}

function buildAgent3Prompt(ctx) {
    const qaOutput = ctx.previousOutputs[2] || ''

    return `# BASE DE CONHECIMENTO PARA ANÁLISE

O conjunto completo de Q&As abaixo foi gerado pelo Agente 2 para o assunto: "${ctx.angulo}"

---

${qaOutput}

---

# INSTRUÇÃO

Execute o Protocolo de Destilação Superior V2.0 completo:
1. Mapa de Perspectivas Emergentes (5-7 itens)
2. Analogias Estruturais (3-5)
3. Proposições Emergentes (3-5)
4. Tensões Produtivas (2-3) com POTENCIAL DE ROTEIRO
5. Arquétipos Estruturais (2-3)
6. MAPAS DE ROTEIRO (3-5 templates) — NOVO V2.0
7. GANCHOS CONTEXTUALIZADOS — NOVO V2.0

Gere também o ESTRUTURAS_NARRATIVAS.json.`
}

function buildAgent4Prompt(ctx) {
    const synthOutput = ctx.previousOutputs[3] || ''
    const qaOutput = ctx.previousOutputs[2] || ''

    return `# CONTEXTO PARA CAPTURA DE INSIGHTS

Nicho: ${ctx.nicho.nome} (${ctx.nicho.arquetipo})
Subtema: ${ctx.subtema?.nome || 'Geral'}
Ângulo: ${ctx.angulo}

## Síntese do Agente 3:
${synthOutput.substring(0, 4000)}

## Q&As do Agente 2 (resumo):
${qaOutput.substring(0, 4000)}

---

Execute a captura de insights: DNA do canal, hooks diferenciadores, posicionamento único.`
}

function buildAgent5Prompt(ctx) {
    const prevOutputs = ctx.previousOutputs

    return `# ESTRATÉGIA MULTICANAL

Nicho: ${ctx.nicho.nome}
Subtema: ${ctx.subtema?.nome || 'Geral'}
Ângulo: ${ctx.angulo}
Canal existente: ${ctx.nicho.canalExistente || 'Não existe ainda'}

## Contexto dos agentes anteriores:
${Object.entries(prevOutputs).map(([k, v]) => `### Agente ${k}:\n${v.substring(0, 2000)}`).join('\n\n')}

---

Gere a estratégia completa: SOP, Personas, Calendário Editorial, Plataformas de Distribuição.`
}

function buildAgent6Prompt(ctx) {
    const qaOutput = ctx.previousOutputs[2] || ''
    const stratOutput = ctx.previousOutputs[5] || ''

    return `# EXECUTAR DIA: ${ctx.angulo}

Nicho: ${ctx.nicho.nome}
Formato: ${ctx.formato?.nome || 'Vídeo Longo (12+ min)'}
Ângulo/Tema: ${ctx.angulo}

## BASE DE CONHECIMENTO (Agente 2):
${qaOutput.substring(0, 8000)}

## ESTRATÉGIA (Agente 5):
${stratOutput.substring(0, 4000)}

---

Gere o PACOTE DIÁRIO COMPLETO:
1. 1 Roteiro Long-Form DENSO (8-15min) com Q&A_SOURCE — inclua TÍTULO, CTA, DESCRIÇÃO
2. 3 Roteiros Short-Form DENSOS (30-60s cada) — inclua TÍTULOs, CTAs, LEGENDAS COMPLETAS
3. Guia de Áudio/SFX

Siga a estrutura de 14 blocos (7x2) para Long-Form e 6 blocos (3x2) para Shorts.
Tom: Deus humilde em carne viva. Storytelling divino. Copy inimaginável.`
}

function buildGenericPrompt(agentId, ctx) {
    return `Nicho: ${ctx.nicho.nome}
Subtema: ${ctx.subtema?.nome || 'Geral'}
Ângulo: ${ctx.angulo}

Execute suas funções conforme suas instruções para o ângulo acima.`
}
