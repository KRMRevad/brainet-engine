# Relatório Executivo — Dívida Técnica
## BRAINET MVP v3.0.0

**Para:** Proprietário do Produto
**De:** Time de Discovery (7 especialistas)
**Data:** 2026-02-23
**Classificação:** Estratégico — Decisão de Produto

---

## Em Uma Frase

> O BRAINET funciona, mas está construído sobre fundações que tornam qualquer crescimento de uso um risco real de perda permanente de dados e falha operacional silenciosa.

---

## 1. O Que o Discovery Revelou

Um time de 7 especialistas analisou o BRAINET MVP ao longo de 8 fases durante um dia completo de avaliação técnica. O resultado é um mapa completo do estado atual do sistema.

**Os números:**

| | |
|---|---|
| Débitos técnicos catalogados | **56 itens** |
| Classificados como Críticos | **11** |
| Classificados como Altos | **15** |
| Arquivos de código analisados | **18 arquivos** |
| Especialistas envolvidos | **5 (Arquitetura, UX, Banco de Dados, QA, Análise)** |
| Investimento estimado para resolver | **~370 horas** |

**O que funciona bem:**
- A ideia central do produto é sólida e o pipeline de IA executa
- O design visual tem identidade clara e tokens bem definidos
- A arquitetura de modos (SOLO / COUNCIL / CASCADE) é elegante
- O sistema já gerou outputs reais de valor (evidenciado nos jobs em produção)

**O que preocupa:**
- O sistema inteiro depende de um HD externo que pode falhar a qualquer momento
- As APIs estão completamente abertas para qualquer pessoa na rede
- 4 dos 5 jobs salvos estão presos em estado "em execução" há mais de 3 dias sem que o sistema perceba

---

## 2. Os 3 Riscos que Mais Importam

### Risco 1 — Perda Catastrófica e Irrecuperável de Dados
**Probabilidade:** Alta · **Impacto:** Total

Três elementos críticos do sistema vivem em um HD externo chamado "Seagate 500":
- Os **13 arquivos de prompt** que definem o comportamento de cada agente de IA
- Todos os **outputs gerados** (roteiros, pesquisas, Q&As produzidos pelo pipeline)
- A lógica de configuração central do sistema

**Se o HD falhar antes da migração:** não há backup, não há recuperação, não há versão anterior. O sistema para de funcionar completamente e todo o trabalho acumulado é perdido.

**Analogia:** é o equivalente a manter o código-fonte de uma empresa inteiro em um pendrive sem cópia.

---

### Risco 2 — Sistema Exposto à Rede Sem Qualquer Proteção
**Probabilidade:** Média (aumenta com exposição) · **Impacto:** Alto

O servidor backend do BRAINET aceita comandos de **qualquer origem** sem verificar quem está enviando. Isso significa:
- Qualquer pessoa na mesma rede Wi-Fi pode disparar um pipeline de IA (gerando custos de API)
- Qualquer pessoa pode acessar todos os jobs e outputs salvos
- O servidor anuncia publicamente o caminho completo do HD externo (nome do volume, estrutura de pastas)

Enquanto o sistema for usado exclusivamente em rede local privada, o risco é gerenciável. Qualquer plano de compartilhar ou expor o sistema muda esse cenário imediatamente.

---

### Risco 3 — Operação Invisível: Falhas Sem Aviso
**Probabilidade:** Alta (já ocorrendo) · **Impacto:** Médio-Alto

O sistema atualmente não sabe quando está "quebrado":
- 4 jobs registrados como "em execução" há mais de 72 horas — na prática, falharam silenciosamente no passado
- Se o servidor travar (o que pode ocorrer durante pipelines longos com Chrome), ele não reinicia sozinho
- Não há backup do arquivo que armazena todos os jobs e outputs

O usuário só descobre que algo deu errado quando percebe que a UI está se comportando de forma estranha.

---

## 3. O Que Acontece Sem Ação

### Cenário A — Uso Continua Como Está
**Horizonte: 1 a 3 meses**

| Evento | Probabilidade |
|--------|--------------|
| HD externo apresenta falha ou problema | Média-Alta |
| Output importante perdido por crash do servidor | Alta |
| Dificuldade crescente de encontrar jobs antigos | Certa |
| Sistema para de funcionar após update do Chrome/ChatGPT/Claude/Gemini | Certa (só questão de tempo) |

O BRAINET continuará funcionando para uso ocasional, mas cada semana que passa sem resolver o risco do HD é uma semana a mais de exposição à perda total.

### Cenário B — Tentativa de Compartilhar ou Escalar
**Se mais de 1 pessoa tentar usar, ou se exposto na internet:**

O sistema quebraria imediatamente. O caminho hardcoded `/Volumes/Seagate 500/` não existe em outro computador. As APIs abertas se tornam um risco de segurança real. Não há login, não há controle de acesso, não há histórico por usuário.

### Cenário C — Ação Estruturada (Plano Recomendado)
**Com ~370 horas de investimento distribuídas em 4 sprints:**

O BRAINET se torna uma ferramenta robusta, portátil, segura e preparada para crescimento. Os outputs ficam acessíveis na interface. O pipeline se torna resiliente a quedas de conexão. O sistema funciona em qualquer computador, sem dependência de HD específico.

---

## 4. Plano de Ação em 4 Etapas

### Etapa 0 — Ações Imediatas (esta semana, ~20 horas)
*Sem dependências. Executável agora.*

**O que fazer:**
- Criar arquivo de configuração centralizado (eliminar API hardcoded no frontend)
- Corrigir o modal de resultado para usuários com leitores de tela
- Remover exposição do caminho interno do HD na API de saúde
- Marcar os 4 jobs travados como falhos (limpeza manual de 10 minutos)
- Adicionar checagem de código (ESLint) para evitar inconsistências futuras

**Por que agora:** são ações cirúrgicas de 1-2 horas cada, sem risco de regressão, que resolvem os problemas mais visíveis imediatamente.

---

### Etapa 1 — Fundação de Dados (semana 1–2, ~66 horas)
*Elimina o risco catastrófico do HD.*

**O que fazer:**
- Migrar todos os prompts dos agentes para dentro do repositório (versionados, com backup automático)
- Substituir o arquivo JSON de jobs por um banco de dados real (Supabase — já planejado no projeto)
- Configurar reinício automático do servidor em caso de crash (PM2)
- Estabelecer backup diário do arquivo de jobs enquanto a migração não está completa

**Por que é prioridade máxima:** enquanto este passo não for feito, todos os demais investimentos estão em risco. O HD pode falhar hoje.

---

### Etapa 2 — Segurança e Interface (semana 2–4, ~127 horas)
*Torna o sistema seguro e utilizável em qualquer ambiente.*

**O que fazer:**
- Adicionar autenticação nas APIs (proteger o sistema de acessos não autorizados)
- Implementar responsividade (o sistema funciona apenas em telas largas hoje)
- Construir visualizador de outputs completo na interface (atualmente o usuário é redirecionado para um "workspace" que não existe na UI)
- Corrigir o roteamento do app para suportar links diretos e o botão "voltar" do navegador
- Refatorar o CSS para manutenção sustentável

**Nota:** este sprint pode ser executado por 2 pessoas em paralelo, reduzindo o tempo pela metade.

---

### Etapa 3 — Resiliência e UX Avançada (semana 4–6, ~65 horas)
*Torna o sistema confiável para uso intenso.*

**O que fazer:**
- Adicionar cancelamento de pipeline em andamento
- Implementar reconexão automática se a conexão com o servidor cair durante um pipeline
- Criar interface de CRUD para gerenciar a taxonomia de nichos sem editar arquivos manualmente
- Paginação e filtros na lista de jobs
- Lazy loading da visualização de grafo (~500KB que carrega sempre, mesmo sem uso)

---

### Etapa 4+ — Qualidade e Roadmap (meses 2–3, ~130 horas+)
*Prepara o sistema para time e escala.*

- Testes automatizados (cobertura zero atualmente)
- Migração para TypeScript
- Estabilização do Browser CDP (os seletores quebram a cada update das UIs de ChatGPT/Claude/Gemini)

---

## 5. Resumo de Investimento

| Etapa | Foco | Horas | Valor Estratégico |
|-------|------|-------|-------------------|
| 0 | Ações imediatas | ~20h | Risco zero, ganho imediato |
| 1 | Fundação de dados | ~66h | Elimina risco catastrófico |
| 2 | Segurança + Interface | ~127h | Torna o sistema utilizável e seguro |
| 3 | Resiliência + UX | ~65h | Uso intenso sem fricção |
| 4+ | Qualidade | ~130h+ | Escalabilidade e time |
| **Total** | | **~408h** | |

**Para referência de escala:**
- 1 desenvolvedor dedicado em tempo integral: ~10 semanas
- 2 desenvolvedores com sprints paralelos: ~5–6 semanas
- Desenvolvedor part-time (20h/semana): ~5 meses

---

## 6. A Decisão Mais Importante

Antes de qualquer outra coisa, a pergunta estratégica central é:

> **O BRAINET continuará sendo uma ferramenta solo, ou existe plano de escalar para mais usuários ou expor externamente?**

Se a resposta for **"continua solo":** as Etapas 0 e 1 são suficientes para operar com segurança por muitos meses. O restante pode ser endereçado gradualmente.

Se a resposta for **"escalar ou compartilhar":** as Etapas 0, 1 e 2 são pré-requisitos inegociáveis antes de qualquer exposição. O sistema na forma atual não suporta mais de um usuário ou uso fora de rede local.

---

## 7. Arquivos de Referência

Para quem quiser aprofundar em qualquer área:

| Documento | Conteúdo |
|-----------|---------|
| `docs/prd/technical-debt-assessment.md` | Inventário completo dos 56 débitos com esforços |
| `docs/reviews/db-specialist-review.md` | Schema de banco de dados proposto (DDL completo) |
| `docs/reviews/ux-specialist-review.md` | Análise detalhada de UX com estimativas |
| `docs/reviews/qa-review.md` | Gate de qualidade e inconsistências encontradas |
| `docs/architecture/system-architecture.md` | Mapa técnico completo do sistema atual |
| `docs/frontend/frontend-spec.md` | Especificação do frontend com fluxos de usuário |

---

*— Atlas, investigando a verdade 🔎*
*@analyst | Fase 9 de 10 — Brownfield Discovery — BRAINET MVP v3.0.0*
