-- BRAINET Nichos Seed Data
-- Generated from data/nichos.json
-- Created: 2026-02-24

-- ============================================
-- NICHOS (Primary niche categories)
-- ============================================

INSERT INTO nichos (id, nome, emoji, cor, cor_secundaria, arquetipo, vicio_curado, virtude_promovida, canal_existente, peso, exploracoes)
VALUES ('espiritualidade', 'Espiritualidade', '🕊️', '#8B5CF6', '#6D28D9', 'O Anjo', 'Orgulho / Medo', 'Fé / Humildade', '321.Arcanjos', 1, 42)
ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO nichos (id, nome, emoji, cor, cor_secundaria, arquetipo, vicio_curado, virtude_promovida, canal_existente, peso, exploracoes)
VALUES ('saude-e-meio-ambiente', 'Saúde e Meio Ambiente', '💧', '#06B6D4', '#0891B2', 'O Alquimista', 'Avareza / Materialismo', 'Prosperidade / Fluxo', '321.ÁguaLimpa', 1, 18)
ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO nichos (id, nome, emoji, cor, cor_secundaria, arquetipo, vicio_curado, virtude_promovida, canal_existente, peso, exploracoes)
VALUES ('temperanca', 'Temperança e Nutrição', '🍃', '#10B981', '#059669', 'O Nutricionista', 'Gula', 'Temperança', '', 2, 0)
ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO nichos (id, nome, emoji, cor, cor_secundaria, arquetipo, vicio_curado, virtude_promovida, canal_existente, peso, exploracoes)
VALUES ('paciencia', 'Paciência e Paz Interior', '☯️', '#F59E0B', '#D97706', 'O Zen', 'Ira', 'Paciência', '', 2, 0)
ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO nichos (id, nome, emoji, cor, cor_secundaria, arquetipo, vicio_curado, virtude_promovida, canal_existente, peso, exploracoes)
VALUES ('tecnologia-consciente', 'Tecnologia Consciente', '🤖', '#3B82F6', '#2563EB', 'O Hacker Ético', 'Dependência Digital', 'Soberania Tecnológica', '', 3, 0)
ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO nichos (id, nome, emoji, cor, cor_secundaria, arquetipo, vicio_curado, virtude_promovida, canal_existente, peso, exploracoes)
VALUES ('filosofia-e-psicologia', 'Filosofia e Psicologia', '🧠', '#EC4899', '#DB2777', 'O Filósofo', 'Ignorância', 'Sabedoria', '', 3, 0)
ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO nichos (id, nome, emoji, cor, cor_secundaria, arquetipo, vicio_curado, virtude_promovida, canal_existente, peso, exploracoes)
VALUES ('financas-conscientes', 'Finanças Conscientes', '💰', '#EF4444', '#DC2626', 'O Construtor', 'Consumismo', 'Abundância Consciente', '', 3, 0)
ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO nichos (id, nome, emoji, cor, cor_secundaria, arquetipo, vicio_curado, virtude_promovida, canal_existente, peso, exploracoes)
VALUES ('artes-e-criatividade', 'Artes e Criatividade', '🎨', '#F97316', '#EA580C', 'O Artista', 'Apatia / Preguiça', 'Expressão Criativa', '', 3, 0)
ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;


-- ============================================
-- SUBTEMAS (Sub-categories)
-- ============================================

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('anjos-e-arcanjos', 'espiritualidade', 'Anjos e Arcanjos', 'Os mensageiros divinos e suas hierarquias')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('meditacao-e-prece', 'espiritualidade', 'Meditação e Prece', 'Práticas contemplativas para conexão interior')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('numerologia-sagrada', 'espiritualidade', 'Numerologia Sagrada', 'O significado oculto dos números na vida espiritual')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('despertar-consciencial', 'espiritualidade', 'Despertar Consciencial', 'O caminho da expansão de consciência')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('agua-e-purificacao', 'saude-e-meio-ambiente', 'Água e Purificação', 'A ciência e espiritualidade da água limpa')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('alimentacao-consciente', 'saude-e-meio-ambiente', 'Alimentação Consciente', 'Nutrição como medicina e ato de resistência')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('sustentabilidade-urbana', 'saude-e-meio-ambiente', 'Sustentabilidade Urbana', 'Viver de forma sustentável na cidade moderna')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('equilibrio-alimentar', 'temperanca', 'Equilíbrio Alimentar', 'A arte de comer com consciência e propósito')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('jejum-e-disciplina', 'temperanca', 'Jejum e Disciplina Corporal', 'O poder da abstinência consciente')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('controle-da-ira', 'paciencia', 'Controle da Ira', 'Transformar raiva em sabedoria')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('filosofia-zen', 'paciencia', 'Filosofia Zen', 'Sabedoria oriental para o caos ocidental')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('ia-e-consciencia', 'tecnologia-consciente', 'IA e Consciência', 'O impacto da inteligência artificial na humanidade')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('privacidade-digital', 'tecnologia-consciente', 'Privacidade e Soberania Digital', 'Proteção de dados e liberdade na era digital')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('estoicismo', 'filosofia-e-psicologia', 'Estoicismo Moderno', 'Filosofia antiga para problemas modernos')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('psicologia-profunda', 'filosofia-e-psicologia', 'Psicologia Profunda', 'Jung, sombra, individuação e o inconsciente coletivo')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('liberdade-financeira', 'financas-conscientes', 'Liberdade Financeira', 'O caminho real para independência financeira')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('empreendedorismo-digital', 'financas-conscientes', 'Empreendedorismo Digital', 'Criar negócios éticos na era digital')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('storytelling', 'artes-e-criatividade', 'Storytelling e Narrativa', 'A arte milenar de contar histórias com propósito')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO subtemas (id, nicho_id, nome, descricao)
VALUES ('arte-generativa', 'artes-e-criatividade', 'Arte Generativa e IA', 'Criando arte com inteligência artificial')
ON CONFLICT(id, nicho_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;


-- ============================================
-- FORMATOS (Content formats)
-- ============================================

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'anjos-e-arcanjos', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'anjos-e-arcanjos', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('carrossel', 'anjos-e-arcanjos', 'Carrossel Instagram', '📸')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('thread', 'anjos-e-arcanjos', 'Thread X/Twitter', '🧵')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('newsletter', 'anjos-e-arcanjos', 'Newsletter / Blog', '📧')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'meditacao-e-prece', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'meditacao-e-prece', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('carrossel', 'meditacao-e-prece', 'Carrossel Instagram', '📸')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'numerologia-sagrada', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'numerologia-sagrada', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'despertar-consciencial', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'despertar-consciencial', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('newsletter', 'despertar-consciencial', 'Newsletter / Blog', '📧')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'agua-e-purificacao', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'agua-e-purificacao', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('carrossel', 'agua-e-purificacao', 'Carrossel Instagram', '📸')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'alimentacao-consciente', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'alimentacao-consciente', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('thread', 'alimentacao-consciente', 'Thread X/Twitter', '🧵')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'sustentabilidade-urbana', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'sustentabilidade-urbana', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'equilibrio-alimentar', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'equilibrio-alimentar', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'jejum-e-disciplina', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'controle-da-ira', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'controle-da-ira', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'filosofia-zen', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('carrossel', 'filosofia-zen', 'Carrossel Instagram', '📸')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'ia-e-consciencia', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'ia-e-consciencia', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'privacidade-digital', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'estoicismo', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'estoicismo', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'psicologia-profunda', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('newsletter', 'psicologia-profunda', 'Newsletter / Blog', '📧')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'liberdade-financeira', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'liberdade-financeira', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'empreendedorismo-digital', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'storytelling', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('shorts', 'storytelling', 'Shorts (< 60s)', '⚡')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('longform-video', 'arte-generativa', 'Vídeo Longo (12+ min)', '🎬')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO formatos (id, subtema_id, nome, icone)
VALUES ('carrossel', 'arte-generativa', 'Carrossel Instagram', '📸')
ON CONFLICT(id, subtema_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;


-- ============================================
-- ANGULOS (Content topics)
-- ============================================

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Os 7 Arcanjos e suas funções cósmicas — guia definitivo')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Oração guiada com o Arcanjo Miguel para proteção espiritual')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Como cada arcanjo governa um dia da semana')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A hierarquia angelical: de Serafins a Anjos da Guarda')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Sinais de que um arcanjo está te guiando agora')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', '1 frase do Arcanjo Rafael para curar hoje')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Você sabia que Uriel governa as sextas-feiras?')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Oração de 30 segundos com São Miguel')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', '7 slides: Cada Arcanjo + sua cor + sua oração')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', '5 sinais de que seu anjo da guarda está presente')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', 'Os cristais de cada arcanjo — guia visual')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('thread', 'Thread: A verdadeira origem dos 7 Arcanjos nas escrituras')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('thread', 'Thread: 7 dias, 7 arcanjos, 7 orações')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('newsletter', 'Artigo: O papel dos anjos nas 3 grandes religiões')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('newsletter', 'Guia: Como criar seu altar angelical em casa')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Meditação guiada: Encontro com seu anjo da guarda')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A ciência por trás da oração — o que muda no cérebro')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Terço meditativo dos arcanjos — prática completa')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Respire com o Arcanjo Chamuel — 30 segundos de paz')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Mantra rápido de proteção espiritual')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', '5 posturas de meditação angelical')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', 'O passo a passo da oração contemplativa')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Números mestres: 11:11, 22:22 e o que significam de verdade')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A matemática de Deus: Fibonacci na natureza e na alma')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Seu número de nascimento e a missão da sua vida')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Viu 11:11? O universo está falando com você')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'O que o número 7 significa na Bíblia')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Os 5 estágios do despertar espiritual — em qual você está?')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Sinais de que sua consciência está expandindo')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A noite escura da alma: como atravessar e renascer')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Se você sente que não pertence a este mundo...')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', '3 sinais de despertar espiritual')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('newsletter', 'Ensaio: O despertar não é bonito — é necessário')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('newsletter', 'Guia: 30 dias de práticas para expandir consciência')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A verdade sobre fluoretação da água — ciência vs. mito')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Como filtrar água em casa de forma acessível — guia completo')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Emoto e a memória da água: ciência real ou pseudociência?')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Crise hídrica global: o que ninguém te conta')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Teste: sua água de torneira é realmente limpa?')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', '3 formas baratas de purificar água em casa')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', 'Comparativo visual: 5 filtros de água — qual funciona?')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', 'O caminho da sua água: da nascente à torneira')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Agrotóxicos no Brasil: o que você come todos os dias')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Jejum intermitente — a ciência definitiva')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Alimentos que curam: a farmácia na sua cozinha')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'O veneno no seu prato — 1 dado chocante')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Erva que substitui remédio: descubra qual')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('thread', 'Thread: 10 alimentos que a indústria não quer que você conheça')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Como criar uma horta em apartamento — do zero ao colheita')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Compostagem urbana: transforme lixo em ouro')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Economia circular: o futuro já começou na sua cidade')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Composta em 60 segundos — tutorial rápido')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', '5 plantas que purificam o ar do seu quarto')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A psicologia da gula: por que comemos mais do que precisamos')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Dieta do ancestral: como nossos avós comiam e viviam mais')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Açúcar: o vício mais aceito do mundo')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Teste: quanto açúcar escondido você come por dia?')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', '1 hábito japonês para parar de comer demais')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Jejum nas religiões: prática universal de transcendência')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Autofagia: como o corpo se cura quando você para de comer')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Disciplina do corpo como portal para a mente')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A neurociência da raiva — o que acontece no seu cérebro')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Estoicismo prático: Marcus Aurelius contra a ira moderna')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Técnicas de desescalada: 5 formas de acalmar em 2 minutos')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Quando sentir raiva, faça ISTO — 10 segundos')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Frase de Marco Aurélio que muda tudo')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Wabi-sabi: a beleza da imperfeição')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'O monge que vendeu sua Ferrari — lições reais')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Zen e produtividade: menos é exponencialmente mais')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', '10 provérbios Zen para o dia a dia')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', 'Antes e depois: vida com e sem mindfulness')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'IA vai substituir você? A verdade que ninguém conta')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Como usar IA para criar, não para destruir')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'O dilema ético da IA: quem decide o que é certo?')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Esta imagem foi feita por IA — você consegue dizer?')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'O emprego que IA NÃO vai substituir')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Seu celular te espiona — e você deixou isso acontecer')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'De-Google: como sair da Matrix tecnológica')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'VPN, Tor, Linux: o kit de sobrevivência digital')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Memento Mori: por que pensar na morte te faz viver melhor')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Epicteto era escravo — e a pessoa mais livre do mundo')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A manhã de um estoico: rotina de 2000 anos que funciona')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Sêneca em 30 segundos: a frase mais poderosa')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'O paradoxo estoico da felicidade')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A Sombra de Jung: o monstro que você ignora')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Individuação: a jornada mais importante da vida')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Arquétipos no cinema: por que certas histórias nos hipnotizam')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('newsletter', 'Ensaio: O que seus sonhos realmente significam')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('newsletter', 'Guia: Como iniciar um diário de sombras')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'FIRE no Brasil: aposentar com 35 anos é possível?')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A regra dos 4%: a matemática da liberdade')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Renda passiva real vs. golpes na internet')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Se você ganha R$3000, invista ISTO por mês')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'A diferença entre rico e livre')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Como criar um canal lucrativo do zero — sem aparecer')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A economia de criadores: como funciona de verdade')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Do conteúdo ao produto: a escada de monetização')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'A Jornada do Herói: por que toda boa história segue o mesmo padrão')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Como roteiristas da Netflix prendem sua atenção')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Storytelling para marcas: a arma secreta do marketing')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'A técnica de roteiro em 1 slide')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('shorts', 'Por que você NÃO CONSEGUE parar de assistir')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'Criando arte cinematográfica com IA — tutorial completo')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'IA é arte? O debate que divide o mundo')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('longform-video', 'De prompt a obra-prima: o workflow do artista digital')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', 'Antes/depois: prompt vs. imagem final — 10 exemplos')
ON CONFLICT(formato_id, titulo) DO NOTHING;

INSERT INTO angulos (formato_id, titulo)
VALUES ('carrossel', '5 estilos de arte IA que explodiram em 2026')
ON CONFLICT(formato_id, titulo) DO NOTHING;


-- ============================================
-- VERIFICATION
-- ============================================
-- Total nichos: 8
-- Seed data from data/nichos.json
-- AC-4 (TD-1.2): Nichos data migrated to Supabase
-- JSON remains as fallback during transition
