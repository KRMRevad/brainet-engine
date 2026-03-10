/**
 * BRAINET Server Config
 * Supports OpenAI, Anthropic, and Ollama
 * All API keys via environment variables
 */

import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
    // Server
    port: 3001,

    // LLM Configuration
    llm: {
        // 'openai' | 'anthropic' | 'ollama'
        provider: process.env.LLM_PROVIDER || 'openai',

        // Default model for most agents
        model: process.env.LLM_MODEL || 'gpt-4o-mini',

        // Heavy model for complex agents (1, 2, 6)
        heavyModel: process.env.LLM_HEAVY_MODEL || 'gpt-4o',

        // Ollama endpoint (for local LLM)
        ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',

        // API Keys (from environment)
        openaiKey: process.env.OPENAI_API_KEY || '',
        anthropicKey: process.env.ANTHROPIC_API_KEY || '',

        // Max tokens per generation
        maxTokens: 8192,
        heavyMaxTokens: 16384,

        // Temperature
        temperature: 0.7,
    },

    // Web Search
    search: {
        provider: 'brave',
        apiKey: process.env.BRAVE_API_KEY || '',
        maxResultsPerQuery: 10,
        maxQueriesPerPillar: 5,
    },

    // Workspace paths (must be set via environment variable)
    workspace: process.env.WORKSPACE_PATH,
    agents: {
        promptDir: process.env.PROMPTS_PATH || './server/prompts',
        promptFiles: {
            1: '1_PESQUISA_PROFUNDA_V2.md',
            2: '2_EXTRACAO_CONHECIMENTO_V2.md',
            3: '3_MATRIX_MENTE_SUPERIOR_V2.md',
            4: '4_CAPTURA_INSIGHTS_V2.md',
            5: '5_ESTRATEGIA_MULTICANAIS_V2.md',
            6: '6_ROTEIRO_ESTRATEGICO_V2.md',
            7: '7_DIRETOR_FOTOGRAFIA_V2.md',
            8: '8_DISTRIBUIDOR_MULTICANAL_V2.md',
            9: '9_TRANSMEDIA_ARCHITECT_V1.md',
            10: '10_PRODUCT_LADDER_ENGINEER_V1.md',
            11: '11_METRICS_ORACLE_V1.md',
            12: '12_DAILY_ORCHESTRATOR_V1.md',
            13: '13_SELF_CORRECTOR_V1.md',
            qa_fire: 'QA_FIRE_SCANNER_V1.md',
            qa_blind: 'QA_BLIND_SPOT_ANALYZER_V1.md',
        },
        // Agents that need the heavy model
        heavyAgents: [1, 2, 3, 6],
    },

    // Job queue (Supabase-only, no JSON fallback)
    jobs: {
        outputDir: 'execution/pipeline-outputs',
    },

    // AI Council
    council: {
        // Chrome remote debugging port
        chromePort: parseInt(process.env.CHROME_DEBUG_PORT || '9225'),

        // Default operation mode: 'solo' | 'council' | 'cascade'
        defaultMode: process.env.COUNCIL_MODE || 'solo',

        // Council members
        members: ['chatgpt', 'claude', 'gemini'],

        // Intelligent routing per agent
        agentRouting: {
            1: { mode: 'council', lead: 'gemini', mergeMode: 'combine' },
            2: { mode: 'cascade', order: ['chatgpt', 'claude', 'gemini'] },
            3: { mode: 'council', lead: 'claude', mergeMode: 'structured' },
            5: { mode: 'solo', lead: 'chatgpt' },
            6: { mode: 'cascade', order: ['claude', 'chatgpt', 'gemini'] },
            qa_fire: { mode: 'council', mergeMode: 'select_best' },
        },
    },

    // LLM Resolver — Smart tiered routing
    resolver: {
        // Tier 2: Local Ollama (Mac)
        local: {
            url: process.env.OLLAMA_URL || 'http://localhost:11434',
            model: process.env.LOCAL_MODEL || null, // auto-detect from available
        },

        // Tier 3: Remote Ollama (Alienware via Tailscale)
        remote: {
            enabled: !!process.env.REMOTE_OLLAMA_URL,
            url: process.env.REMOTE_OLLAMA_URL || null,
            model: process.env.REMOTE_MODEL || null,
        },

        // Tier 6: GLM5 via Modal
        glm5: {
            url: process.env.GLM5_URL || null,
        },

        // Agent → minimum tier mapping
        agentTiers: {
            1: { minTier: 'browser' },  // Research agents need strong reasoning
            2: { minTier: 'browser' },  // Knowledge extraction
            3: { minTier: 'browser' },  // Matrix building
            5: { minTier: 'local' },    // Strategy can use local LLM
            6: { minTier: 'browser' },  // Script generation needs quality
        },
    },
}
