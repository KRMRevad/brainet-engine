/**
 * BRAINET Channel Spawner
 * When a niche is "loaded", generates the full channel DNA,
 * structure, and potential products/communities.
 */

const PLATAFORMAS = [
    { id: 'youtube', nome: 'YouTube', icone: '▶️', tipo: 'Vídeo' },
    { id: 'instagram', nome: 'Instagram', icone: '📱', tipo: 'Visual' },
    { id: 'tiktok', nome: 'TikTok', icone: '🎵', tipo: 'Shorts' },
    { id: 'x', nome: 'X / Twitter', icone: '🐦', tipo: 'Texto' },
    { id: 'newsletter', nome: 'Newsletter', icone: '📧', tipo: 'Texto' },
    { id: 'blog', nome: 'Blog/SEO', icone: '📝', tipo: 'Texto' },
    { id: 'podcast', nome: 'Podcast', icone: '🎙️', tipo: 'Áudio' },
    { id: 'reddit', nome: 'Reddit', icone: '🤖', tipo: 'Comunidade' }
]

const ESTRUTURA_PASTAS = [
    '0 Workflow e Agentes/',
    '0 Padrões Globais/',
    '0.1 Arquivos Específicos Canal/',
    '0.2 Workspace Canal/',
    '1 Pesquisa Profunda/',
    '2 Extração de Conhecimento/',
    '3 Síntese Superior/',
    '4 Captura de Insights/',
    '5 Estratégia Multicanal/',
    '6 Escolha de Temas e Roteiros/',
    '7 Direção Visual/',
    '8 Distribuição/',
    '9 Transmedia/',
    '10 Produtos/',
    '11 Métricas/',
    '12 Outros/'
]

/**
 * Generate a channel DNA from a nicho
 */
export function spawnChannel(nicho) {
    const nomeCanal = generateChannelName(nicho)

    return {
        // Identity
        nomeCanal,
        nicho: nicho.nome,
        emoji: nicho.emoji,
        cor: nicho.cor,
        corSecundaria: nicho.corSecundaria,

        // DNA
        dna: {
            arquetipo: nicho.arquetipo,
            missao: `Curar ${nicho.vicioCurado} e promover ${nicho.virtudePromovida} através de conteúdo digital`,
            tom: generateTom(nicho),
            persona: generatePersona(nicho),
            pilarVisual: {
                corPrimaria: nicho.cor,
                corSecundaria: nicho.corSecundaria,
                corFundo: '#0a0a1a',
                tipografia: 'Inter / Outfit',
                estilo: 'Neo-Futurista + Orgânico'
            }
        },

        // Structure
        estrutura: {
            pastas: ESTRUTURA_PASTAS,
            totalPastas: ESTRUTURA_PASTAS.length,
            baseTemplate: 'templates/estrutural/'
        },

        // Distribution
        plataformas: PLATAFORMAS,

        // Content plan
        calendarioSemanal: {
            segunda: { formato: 'Vídeo Longo', plataforma: 'YouTube' },
            terca: { formato: 'Carrossel + Thread', plataforma: 'Instagram + X' },
            quarta: { formato: 'Vídeo Longo', plataforma: 'YouTube' },
            quinta: { formato: 'Newsletter + Blog', plataforma: 'Email + SEO' },
            sexta: { formato: 'Vídeo Longo', plataforma: 'YouTube' },
            sabado: { formato: 'Compilação Shorts', plataforma: 'TikTok + Reels' },
            domingo: { formato: 'Comunidade + AMA', plataforma: 'Reddit + Live' }
        },

        // Monetization
        produtos: generateProductLadder(nicho),

        // Communities
        comunidade: {
            nome: `Comunidade ${nomeCanal}`,
            plataforma: 'Discord / WhatsApp / Circle',
            niveis: [
                { nivel: 'Público', descricao: 'Acesso ao conteúdo gratuito', preco: 'Grátis' },
                { nivel: 'Membro', descricao: 'Conteúdo exclusivo + Lives', preco: 'R$29/mês' },
                { nivel: 'Inner Circle', descricao: 'Mentoria + Networking', preco: 'R$197/mês' }
            ]
        },

        // Stats
        potencial: {
            totalSubtemas: nicho.subtemas.length,
            totalFormatos: nicho.subtemas.reduce((acc, s) => acc + s.formatos.length, 0),
            totalAngulos: nicho.subtemas.reduce((acc, s) => acc + s.formatos.reduce((a2, f) => a2 + f.angulos.length, 0), 0),
            conteudoInfinito: true
        },

        timestamp: new Date().toISOString()
    }
}

function generateChannelName(nicho) {
    const prefixes = ['321', 'EVAD', 'Neo', 'Flux']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const cleanName = nicho.nome.split(' ')[0]
    return `${prefix}.${cleanName}`
}

function generateTom(nicho) {
    const tons = {
        'espiritualidade': 'Sábio, Contemplativo, Inspirador',
        'saude-e-meio-ambiente': 'Investigativo, Urgente, Empoderador',
        'temperanca': 'Gentil, Firme, Motivacional',
        'paciencia': 'Calmo, Filosófico, Profundo',
        'tecnologia-consciente': 'Visionário, Técnico, Acessível',
        'filosofia-e-psicologia': 'Intelectual, Provocador, Revelador',
        'financas-conscientes': 'Direto, Prático, Libertador',
        'artes-e-criatividade': 'Livre, Experimental, Inspirador'
    }
    return tons[nicho.id] || 'Autêntico, Engajador, Educativo'
}

function generatePersona(nicho) {
    return {
        idade: '22-45 anos',
        dor: `Sofre com ${nicho.vicioCurado}`,
        desejo: `Quer alcançar ${nicho.virtudePromovida}`,
        nivel: 'Buscador ativo — já pesquisa sobre o tema mas não encontra conteúdo profundo',
        comportamento: 'Consome conteúdo no YouTube e Instagram, prefere formatos visuais e narrativos'
    }
}

function generateProductLadder(nicho) {
    return [
        {
            nivel: 0,
            tipo: 'Lead Magnet',
            nome: `Guia Grátis: Introdução a ${nicho.nome}`,
            preco: 'Grátis',
            formato: 'PDF / Pílula em vídeo'
        },
        {
            nivel: 1,
            tipo: 'eBook',
            nome: `eBook: ${nicho.nome} — O Guia Definitivo`,
            preco: 'R$27-47',
            formato: 'PDF Premium / ePub'
        },
        {
            nivel: 2,
            tipo: 'Mini-Curso',
            nome: `Curso: Dominando ${nicho.nome} em 7 Dias`,
            preco: 'R$97-297',
            formato: 'Vídeo-aulas + Exercícios'
        },
        {
            nivel: 3,
            tipo: 'Mentoria',
            nome: `Programa de Mentoria ${nicho.nome}`,
            preco: 'R$997-2997',
            formato: 'Grupo + Calls semanais'
        },
        {
            nivel: 4,
            tipo: 'High Ticket',
            nome: `${nicho.nome} Academy — Formação Completa`,
            preco: 'R$5000+',
            formato: 'Imersão + Comunidade Exclusiva'
        }
    ]
}
