/**
 * BRAINET Pipeline Runner
 * Simulates the 13-agent production pipeline for text/research output.
 * MVP: generates structured text briefs for each agent step.
 */

const AGENTS = [
    {
        id: 1,
        nome: 'Pesquisa Profunda',
        emoji: '🔍',
        descricao: 'Coleta dados, tendências e fontes sobre o tema',
        action: (input) => ({
            titulo: `Pesquisa: ${input.angulo}`,
            pilares: [
                `📗 Pilar Ouro: Referências clássicas sobre "${input.subtema.nome}"`,
                `🌱 Pilar Vivas: Tendências atuais e dados recentes`,
                `🔥 Pilar Popular: O que o público está buscando sobre isso`,
                `⚡ Pilar Polêmicas: Debates e tensões no tema`
            ],
            fontes: `Pesquisar em: Google Scholar, YouTube, Reddit, PubMed`,
            status: 'research_brief'
        })
    },
    {
        id: 2,
        nome: 'Extração de Conhecimento',
        emoji: '⛏️',
        descricao: 'Extrai 125 Q&As puros da pesquisa',
        action: (input) => ({
            titulo: `Extração: ${input.subtema.nome}`,
            qaPreviews: [
                `P: O que é ${input.subtema.nome}? R: [Definição completa baseada na pesquisa]`,
                `P: Quais são os benefícios? R: [3-5 benefícios com evidências]`,
                `P: Quais os riscos de ignorar? R: [Consequências documentadas]`,
                `P: Como começar hoje? R: [Passos práticos]`,
                `P: Qual a maior mentira sobre isso? R: [Desmistificação]`
            ],
            totalQAs: 125,
            status: 'extraction_complete'
        })
    },
    {
        id: 3,
        nome: 'Matrix Mente Superior',
        emoji: '🧠',
        descricao: 'Gera síntese superior e estruturas narrativas',
        action: (input) => ({
            titulo: `Síntese: ${input.angulo}`,
            sintese: `Visão de alto nível sobre "${input.angulo}" conectando ${input.subtema.nome} com princípios universais`,
            estruturas: [
                'Tensão central: [identificar paradoxo ou conflito]',
                'Narrativa tipo: Jornada de Transformação',
                'Gancho emocional: [dor → solução → transcendência]',
                'Metáfora-chave: [analogia visual e memorável]'
            ],
            status: 'synthesis_ready'
        })
    },
    {
        id: 4,
        nome: 'Captura de Insights',
        emoji: '🎯',
        descricao: 'Analisa canais de referência e extrai DNA',
        action: (input) => ({
            titulo: `Insights para: ${input.formato.nome}`,
            dnaCanal: {
                tom: `[Tom adequado para ${input.nicho.nome}]`,
                hooks: [
                    `Hook tipo: Pergunta provocadora sobre ${input.subtema.nome}`,
                    `Hook tipo: Dado chocante / estatística`,
                    `Hook tipo: Promessa de transformação`
                ],
                referencias: '3 canais de referência analisados'
            },
            status: 'insights_captured'
        })
    },
    {
        id: 5,
        nome: 'Estratégia Multicanal',
        emoji: '📊',
        descricao: 'Define SOP, personas e calendário',
        action: (input) => ({
            titulo: `Estratégia: ${input.nicho.nome} → ${input.formato.nome}`,
            persona: {
                nome: `Persona ideal para ${input.nicho.nome}`,
                idade: '25-45',
                dor: `[Dor principal relacionada a ${input.nicho.vicioCurado}]`,
                desejo: `[Desejo de ${input.nicho.virtudePromovida}]`
            },
            plataformas: ['YouTube', 'Instagram', 'TikTok', 'X/Twitter'],
            frequencia: 'Diário: 1 Long + 3 Shorts',
            status: 'strategy_defined'
        })
    },
    {
        id: 6,
        nome: 'Roteirista Estratégico',
        emoji: '✍️',
        descricao: 'Cria ganchos e escreve roteiro completo',
        action: (input) => ({
            titulo: `Roteiro: ${input.angulo}`,
            formato: input.formato.nome,
            estrutura: {
                gancho: `[Abertura com hook magnético — 5s]`,
                promessa: `[O que o espectador vai ganhar — 10s]`,
                conteudo: `[Desenvolvimento em 3-5 blocos com open loops]`,
                cta: `[Call to action + próximo episódio]`
            },
            duracao: input.formato.id === 'longform-video' ? '12-15 min' : '< 60s',
            openLoops: 5,
            patternInterrupts: 3,
            status: 'script_ready'
        })
    },
    {
        id: 'QA',
        nome: 'Fire Scanner',
        emoji: '🔥',
        descricao: 'Valida qualidade do roteiro antes de produção',
        action: (input) => ({
            titulo: `QA: ${input.angulo}`,
            checks: [
                '✅ Hook nos primeiros 5 segundos',
                '✅ Promessa clara até 15 segundos',
                '✅ 5+ open loops identificados',
                '✅ Pattern interrupts posicionados',
                '✅ CTA forte no final',
                '✅ Formatação TTS V3.1 aplicada'
            ],
            score: '96/100',
            status: 'approved'
        })
    },
    {
        id: 7,
        nome: 'Diretor de Fotografia',
        emoji: '📷',
        descricao: 'Traduz roteiro para linguagem visual',
        action: (input) => ({
            titulo: `Visual: ${input.angulo}`,
            storyboard: [
                `SHOT 1: [Abertura cinematográfica — cor: ${input.nicho.cor}]`,
                `SHOT 2: [Close-up emocional — iluminação dramática]`,
                `SHOT 3: [B-roll contextual — ambiente do tema]`,
                `SHOT 4: [Clímax visual — efeito especial]`,
                `SHOT 5: [Encerramento — logo + CTA]`
            ],
            paletaCores: [input.nicho.cor, input.nicho.corSecundaria, '#1a1a2e', '#ffffff'],
            status: 'visual_ready'
        })
    },
    {
        id: 9,
        nome: 'Transmedia Architect',
        emoji: '🔄',
        descricao: 'Transforma em multi-formato',
        action: (input) => ({
            titulo: `Transmedia: ${input.angulo}`,
            outputs: [
                `📸 Carrossel Instagram: 10 slides extraídos do roteiro`,
                `🧵 Thread X: 7-10 tweets com insights-chave`,
                `📧 Newsletter: Artigo de 800 palavras`,
                `📝 Blog Post: SEO otimizado com 1500 palavras`
            ],
            status: 'multi_format_ready'
        })
    },
    {
        id: 10,
        nome: 'Product Ladder',
        emoji: '💎',
        descricao: 'Mapeia esteira de produtos e monetização',
        action: (input) => ({
            titulo: `Produtos: ${input.subtema.nome}`,
            escada: [
                `Nível 0 (Grátis): Pílula — "3 insights sobre ${input.subtema.nome}"`,
                `Nível 1 (R$27): eBook — "Guia Completo de ${input.subtema.nome}"`,
                `Nível 2 (R$197): Mini-curso — "Dominando ${input.subtema.nome} em 7 dias"`,
                `Nível 3 (R$997): Mentoria — "Programa ${input.nicho.nome}"`,
                `Nível 4 (R$5000+): Comunidade/SaaS — plataforma exclusiva`
            ],
            status: 'product_ladder_ready'
        })
    },
    {
        id: 8,
        nome: 'Distribuidor Multicanal',
        emoji: '🚀',
        descricao: 'Automação e distribuição para todas plataformas',
        action: (input) => ({
            titulo: `Distribuição: ${input.angulo}`,
            canais: [
                `▶️ YouTube: Upload + SEO tags + thumbnail`,
                `📱 Instagram: Reels + Carrossel + Stories`,
                `🎵 TikTok: Vídeo otimizado para FYP`,
                `🐦 X/Twitter: Thread + clip`,
                `📧 Newsletter: Disparo para base`
            ],
            automacao: 'n8n + Puppeteer/Playwright',
            status: 'distribution_queued'
        })
    },
    {
        id: 11,
        nome: 'Metrics Oracle',
        emoji: '📈',
        descricao: 'Coleta métricas e gera feedback loop',
        action: (input) => ({
            titulo: `Métricas: ${input.nicho.nome}`,
            metricas: [
                'Views: [aguardando publicação]',
                'CTR: [aguardando dados]',
                'Watch Time: [aguardando dados]',
                'Engagement Rate: [aguardando dados]'
            ],
            feedback: `Dados serão coletados 48h após publicação para ajustes nos Agentes 5 e 6`,
            status: 'metrics_pending'
        })
    }
]

/**
 * Run the full pipeline for a deepened niche result.
 * Returns an array of agent outputs.
 */
export function runPipeline(deepenedResult) {
    const outputs = []

    for (const agent of AGENTS) {
        const output = agent.action(deepenedResult)
        outputs.push({
            agentId: agent.id,
            agentNome: agent.nome,
            agentEmoji: agent.emoji,
            agentDescricao: agent.descricao,
            ...output
        })
    }

    return {
        nicho: deepenedResult.nicho,
        subtema: deepenedResult.subtema,
        formato: deepenedResult.formato,
        angulo: deepenedResult.angulo,
        pipeline: outputs,
        timestamp: new Date().toISOString(),
        totalAgents: outputs.length,
        status: 'pipeline_complete'
    }
}

/**
 * Run a single agent step
 */
export function runAgent(agentId, deepenedResult) {
    const agent = AGENTS.find(a => a.id === agentId)
    if (!agent) throw new Error(`Agent ${agentId} not found`)
    return {
        agentId: agent.id,
        agentNome: agent.nome,
        agentEmoji: agent.emoji,
        ...agent.action(deepenedResult)
    }
}

/**
 * Get all agents info
 */
export function getAgents() {
    return AGENTS.map(a => ({
        id: a.id,
        nome: a.nome,
        emoji: a.emoji,
        descricao: a.descricao
    }))
}
