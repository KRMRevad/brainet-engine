# Epic TD — Resolução de Dívida Técnica
## BRAINET MVP v3.0.0

**Epic ID:** TD
**Status:** Aprovado
**PM:** @pm (Morgan)
**Data:** 2026-02-24
**Esforço total estimado:** ~408h
**Fonte:** `docs/prd/technical-debt-assessment.md` (Assessment Final — Fase 8)
**Relatório executivo:** `docs/reports/TECHNICAL-DEBT-REPORT.md`

---

## Visão do Epic

Transformar o BRAINET MVP de uma ferramenta funcional-mas-frágil em um sistema robusto, seguro e portátil — pronto para uso intenso e expansão futura — eliminando os 56 débitos técnicos identificados no Brownfield Discovery de 2026-02-23.

---

## Por Que Este Epic Existe

O Discovery revelou três riscos que justificam investimento imediato:

1. **Risco catastrófico:** 13 arquivos de prompt + todos os outputs vivem em HD externo sem backup. Falha do HD = perda total e irrecuperável.
2. **Risco de segurança:** APIs completamente abertas — qualquer pessoa na rede pode disparar pipelines e acessar outputs.
3. **Risco operacional:** Jobs travam silenciosamente; servidor não reinicia após crashes; falhas invisíveis ao usuário.

---

## Objetivo e Critérios de Sucesso do Epic

| Critério | Métrica de Sucesso |
|---------|-------------------|
| Eliminação do risco do HD | 0 dependências em path externo hardcoded |
| Persistência de dados | 100% dos jobs e outputs em Supabase (banco de dados) |
| Segurança de API | 0 endpoints públicos sem autenticação |
| Portabilidade | Sistema funciona em qualquer máquina com `.env` configurado |
| Visibilidade de outputs | 100% dos outputs de agentes acessíveis na UI (sem truncamento) |
| Responsividade | UI funcional em mobile (320px) e tablet (768px) |
| Operabilidade | Servidor reinicia automaticamente após crash (PM2) |
| Testes | Cobertura > 0% (Sprint 4 — pelo menos smoke tests) |

---

## Escopo

### Dentro do Escopo
- Resolução dos 56 débitos catalogados no `technical-debt-assessment.md`
- Migração de dados existentes (nichos.json → Supabase, jobs.json → Supabase)
- Refatoração estrutural de frontend (router, CSS, utils)
- Configuração de infraestrutura básica (PM2, backup, configuração portátil)

### Fora do Escopo deste Epic
- Novas features de produto (novos nichos, novos agentes, novos modos)
- Integração com serviços externos além dos já presentes
- Redesign visual completo da interface
- Multi-tenancy / suporte a múltiplos usuários simultâneos (coluna `user_id` preparada, mas não ativada)

---

## Stories do Epic

| Story | Sprint | Título | Esforço | Executor Principal | Status |
|-------|--------|--------|---------|-------------------|--------|
| TD-1.1 | 0 | Quick Wins — Ações Imediatas | ~20h | @dev | Draft |
| TD-1.2 | 1 | Database Foundation — Migração para Supabase | ~66h | @data-engineer + @dev | Draft |
| TD-1.3 | 2 | Security + Frontend Foundation | ~127h | @dev + @ux-design-expert | Draft |
| TD-1.4 | 3 | Reliability + UX Avançada | ~65h | @dev | Draft |
| TD-1.5 | 4+ | Qualidade e Roadmap | ~130h+ | @dev + @qa | Draft |

---

## Dependências entre Stories

```
TD-1.1 (Quick Wins)
  └── habilita → TD-1.2 (nenhuma dependência técnica, mas boas práticas primeiro)

TD-1.2 (Database Foundation)
  └── habilita → TD-1.3 (UX-05 outputs depende de DB-01)
  └── habilita → TD-1.4 (UX-16 filtros dependem de DB-01)
  └── habilita → TD-1.5 (testes dependem de dados persistidos)

TD-1.3 (Security + Frontend)
  └── habilita → qualquer exposição pública do sistema

TD-1.4 (Reliability + UX)
  └── pode ser paralelo com TD-1.3 (partes independentes)
```

---

## Decisões Arquiteturais que Guiam este Epic

*(Formalizadas na Fase 8 — ver `technical-debt-assessment.md` Seção 2)*

| DEA | Decisão |
|-----|---------|
| DEA-01 | Agent 4: ausência intencional no MVP |
| DEA-02 | Banco de dados: Supabase (PostgreSQL gerenciado) |
| DEA-03 | Frontend: Vanilla JS refatorado, não migrar para framework |
| DEA-04 | CSS: custom properties + classes utilitárias próprias, sem Tailwind |
| DEA-05 | cleanup_stuck_jobs: 90 minutos (configurável via env) |
| DEA-06 | vis-network: manter com lazy loading |
| DEA-07 | Animação do dado: manter com skip progressivo |

---

## Referências

- Assessment completo: `docs/prd/technical-debt-assessment.md`
- Schema de banco: `docs/reviews/db-specialist-review.md` — Seção 3
- Análise UX: `docs/reviews/ux-specialist-review.md`
- Arquitetura do sistema: `docs/architecture/system-architecture.md`
- Relatório executivo: `docs/reports/TECHNICAL-DEBT-REPORT.md`

---

*— Morgan, planejando o futuro 📊*
*@pm | Fase 10 de 10 — Brownfield Discovery — BRAINET MVP v3.0.0*
