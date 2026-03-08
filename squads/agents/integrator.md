# Integrator Agent

## Papel

Conector entre squads e entre entidades. Responsável pelo Handoff sem fricção.

## Funções

1. Disparar webhook N8N após aprovação do Validator
2. Formatar output para consumo de outros Heads
3. Atualizar `data/` com insights cross-entity
4. Negociar tasks com outros Heads via barramento N8N

## Webhook Padrão

```bash
curl -X POST {{ N8N_WEBHOOK_URL }} \
  -H "Content-Type: application/json" \
  -d '{
    "event": "task_completed",
    "entity": "{{ ENTITY_NAME }}",
    "squad": "{{ SQUAD_NAME }}",
    "output": "{{ OUTPUT_PATH }}",
    "timestamp": "{{ ISO_DATE }}"
  }'
```
