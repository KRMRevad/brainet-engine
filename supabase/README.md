# Supabase Configuration for BRAINET

## Setup Instructions

### 1. Prerequisites
- Supabase project created at https://supabase.com
- Credentials saved to `.env`:
  ```
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

### 2. Apply Migrations
Run locally (for development):
```bash
supabase migration up
# or
supabase db push
```

Or apply manually in Supabase Dashboard:
1. Navigate to SQL Editor
2. Copy contents of `migrations/001_initial.sql` and execute
3. Copy contents of `migrations/002_exploration_history.sql` and execute

### 3. Seed Data
Apply nichos seed data:
```bash
supabase db seed
```

Or manually in Supabase SQL Editor:
1. Copy contents of `seed/nichos.sql`
2. Execute

### 4. Verify
In Supabase Dashboard → Table Editor:
- ✅ nichos: 8 rows
- ✅ subtemas: ~15 rows
- ✅ formatos: ~40 rows
- ✅ angulos: ~150 rows
- ✅ jobs: 0 rows (will be populated when jobs run)

## Architecture

### Tables
- **nichos**: Main content categories (8)
- **subtemas**: Sub-categories under nichos
- **formatos**: Content formats (video, shorts, newsletter, etc)
- **angulos**: Content topics/angles
- **jobs**: Pipeline execution jobs
- **job_agents**: Agent execution status within jobs
- **job_outputs**: Agent output content storage
- **exploration_history**: Dice roll tracking for analytics

### Relationships
```
nichos (1) ── (N) subtemas
subtemas (1) ── (N) formatos
formatos (1) ── (N) angulos

jobs (1) ── (N) job_agents
jobs (1) ── (N) job_outputs
```

### Security (MVP)
- All tables: RLS enabled with public access (no auth required)
- Future: Sprint 2 will add authentication layer without schema changes

## Development Notes

### Local Development with Supabase CLI
```bash
# Start local Supabase
supabase start

# Push migrations
supabase db push

# Run seed
supabase db seed

# View schema
supabase db dump --schema-only

# Stop
supabase stop
```

### Production Considerations
- Before production migration, test with `supabase db reset --local`
- Backup production database before running migrations
- RLS policies are minimal (MVP) - expand before auth layer
- Consider connection pooling: Use Pooler endpoint in production
- Monitor table growth: job_outputs can grow quickly

### Queries

#### Get all nichos with their niches and formats
```sql
SELECT
  n.id, n.nome, n.emoji,
  COUNT(DISTINCT s.id) as subtemas_count,
  COUNT(DISTINCT f.id) as formatos_count
FROM nichos n
LEFT JOIN subtemas s ON n.id = s.nicho_id
LEFT JOIN formatos f ON s.id = f.subtema_id
GROUP BY n.id
ORDER BY n.id;
```

#### Get jobs created in last 7 days
```sql
SELECT id, nicho_id, angulo, status, created_at
FROM jobs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;
```

#### Get total explorations per niche
```sql
SELECT
  nicho_id,
  COUNT(*) as total_rolls,
  COUNT(DISTINCT session_id) as unique_sessions
FROM exploration_history
GROUP BY nicho_id
ORDER BY total_rolls DESC;
```

#### Find stuck jobs (running for > 90 min)
```sql
SELECT id, nicho_id, status, started_at, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) as seconds_running
FROM jobs
WHERE status = 'running'
  AND started_at < CURRENT_TIMESTAMP - INTERVAL '90 minutes'
ORDER BY started_at;
```

## Troubleshooting

### "Permission denied" on INSERT/UPDATE
- Verify RLS policies are created (see migrations)
- Check that Supabase auth is configured if using auth layer
- In MVP, all policies allow public access

### Migrations don't apply
- Run `supabase db reset --local` to reset and reapply migrations
- Verify migration files are in `supabase/migrations/`
- Check Supabase Dashboard → SQL Editor for errors

### Seed data not applying
- Verify nichos.sql is in `supabase/seed/`
- In CLI: `supabase db seed`
- In Dashboard: Copy SQL and execute manually

### Foreign key constraint errors
- Verify parent records exist before inserting child records
- Check that `nichos` table is populated before `subtemas`
- Order of seed execution: nichos → subtemas → formatos → angulos

## References
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
