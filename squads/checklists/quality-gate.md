# Quality Gate Checklist — {{ ENTITY_NAME }}

## Checklist Universal (Todo artefato passa por aqui)

### 1. Existência

- [ ] Output existe em `outputs/`?
- [ ] Filename segue convenção: `{{ entity }}-{{ squad }}-{{ tipo }}-{{ data }}.{{ ext }}`?

### 2. Completude

- [ ] Todos os Critérios de Aceitação do PRD são atendidos?
- [ ] Nenhum placeholder `{{ }}` restante no artefato final?

### 3. Qualidade Técnica

- [ ] Código compila sem erros?
- [ ] Testes passam (se aplicável)?
- [ ] Sem credenciais ou segredos expostos?

### 4. Alinhamento SOUL

- [ ] É condizente com o Norte da SOUL.md?
- [ ] Gera resultado mensurável?
- [ ] Está no Átomo correto?

### 5. Handoff

- [ ] Webhook N8N está configurado para disparar?
- [ ] Próximo consumidor (squad/entidade) está identificado?
- [ ] Documentação atualizada em `docs/`?
