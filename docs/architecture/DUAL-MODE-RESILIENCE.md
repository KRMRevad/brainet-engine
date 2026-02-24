# Dual-Mode Resilience Pattern

**Introduced in TD-1.2: Database Foundation**

## Overview

The Dual-Mode Resilience Pattern is an architectural approach that enables **zero-downtime database migration** by maintaining two operational modes simultaneously:

- **Primary Mode**: Supabase PostgreSQL (when configured)
- **Fallback Mode**: JSON file-based storage (when Supabase unavailable)

This pattern provides:
- ✅ **Progressive Migration** — Both modes can operate simultaneously during transition
- ✅ **Zero-Downtime Deployment** — Switch backends without service interruption
- ✅ **Graceful Degradation** — System continues working if Supabase fails
- ✅ **Developer-Friendly** — Works in dev environments without external DB setup

## Architecture

### Decision Point

All database operations check `isSupabaseConfigured()` at the entry point:

```
Request → isSupabaseConfigured() → Route to DB or JSON
                    ↓
            Promise-based abstraction
                    ↓
            Same interface, dual backend
```

### Implementation Pattern

```javascript
// Single decision point
const useDatabase = isSupabaseConfigured()

// Conditional execution
if (useDatabase && supabase) {
    // Primary: Supabase PostgreSQL
    const { data, error } = await supabase
        .from('jobs')
        .insert(jobData)
} else {
    // Fallback: JSON file
    await fs.writeFile(jobsPath, JSON.stringify(jobs))
}

// Single return value
return formattedJob // Same interface either way
```

## Where Implemented

### 1. Job Queue (`server/job-queue.js`)

**Primary Operations:**
- `initJobQueue()` — Load from DB or JSON
- `createJob()` — INSERT to DB or append to JSON
- `updateJob()` — UPDATE DB or modify JSON array
- `getAllJobs()` — SELECT from DB or read JSON
- `getJobFull()` — Format DB response to legacy structure

**Fallback Logic:**
```javascript
if (useDatabase) {
    // Supabase path
    const { data } = await supabase.from('jobs').select(...)
} else {
    // JSON path
    const data = await fs.readFile(jobsPath)
}
```

### 2. Exploration Tracking (`server/server.js`)

**Endpoints:**
- `POST /api/exploration` — Record dice roll
- `GET /api/exploration/stats` — Aggregate stats

**Dual-Mode Check:**
```javascript
if (isSupabaseConfigured()) {
    // Insert into exploration_history table
    await supabase.from('exploration_history').insert(...)
} else {
    // Log only (no persistence)
    console.log('[API] Exploration recorded (DB not configured)')
}
```

### 3. Supabase Client (`server/supabase.js`)

**Configuration:**
```javascript
const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {...})
    : null

export function isSupabaseConfigured() {
    return supabase !== null
}
```

## Benefits

### 1. Zero-Downtime Migration

**Traditional Approach** (breaking):
```
JSON → Stop service → Migrate to Supabase → Start service
```

**Dual-Mode Approach** (seamless):
```
JSON ↔ Both modes ↔ Supabase (can switch back anytime)
```

### 2. Development & Testing

**No external dependencies during development:**
```bash
# Dev environment: No Supabase needed
npm run dev
# Works with JSON fallback
```

**Production environment: Full Supabase benefits:**
```bash
# Prod environment: Supabase configured
SUPABASE_URL=... SUPABASE_ANON_KEY=... npm start
# Full database features: persistence, querying, analytics
```

### 3. Graceful Degradation

If Supabase becomes unavailable (maintenance, network issue):
```
1. Supabase query fails
2. Error caught, logged
3. System continues with JSON fallback
4. No user-facing interruption
```

### 4. Data Safety During Migration

**Bidirectional sync capability:**
```
Supabase primary
    ↓
Dual-write (new jobs → both)
    ↓
Verify both have same data
    ↓
Supabase only
```

## Implementation Considerations

### 1. Data Consistency

**During dual-mode operation:**
- Writes go to both Supabase AND JSON (for safety)
- Reads from primary (DB), fallback to JSON if unavailable
- Job IDs consistent (UUID in both modes)

### 2. Performance Impact

**Minimal overhead:**
- Decision point checked once at startup (`useDatabase`)
- No runtime overhead after initial check
- Fallback path optimized for local I/O

**Optimization:**
```javascript
const useDatabase = isSupabaseConfigured()  // Checked once

// Later, in loop:
if (useDatabase) { /* fast path */ }  // Simple boolean check
```

### 3. Testing Strategy

**Both modes must be tested:**
```
Test Matrix:
├── Supabase Mode
│   ├── Job CRUD operations
│   ├── Exploration tracking
│   └── Stats aggregation
└── JSON Fallback Mode
    ├── Job CRUD operations
    ├── Exploration logging
    └── Stats from localStorage
```

## Constraints & Limitations

### 1. Feature Parity

Some Supabase features unavailable in JSON fallback:
- ❌ Complex queries (SQL WHERE clauses)
- ❌ RLS policies
- ❌ Real-time subscriptions
- ✅ Basic CRUD works in both

### 2. Data Volume

**JSON fallback suitable for:**
- MVP with <1000 total jobs
- Development/testing
- Low-frequency data writes

**Should migrate to Supabase when:**
- Production environment
- >10,000 jobs expected
- Real-time features needed
- RLS security needed

### 3. Concurrency

**JSON fallback limitations:**
- No database-level locking
- Race conditions possible with concurrent writes
- Not suitable for multi-instance deployments

**Supabase provides:**
- ACID transactions
- Safe concurrent access
- Multi-instance ready

## Migration Path

### Phase 1: Dual-Mode (Current)
```
Dev: JSON only (Supabase unconfigured)
Prod: Supabase primary + JSON fallback for safety
```

### Phase 2: Supabase Primary (Sprint 2)
```
All environments: Supabase configured
JSON fallback still available for emergencies
Auth layer added (RLS policies ready)
```

### Phase 3: Supabase Only (Sprint 3)
```
Production: Supabase only, fully optimized
JSON fallback code removed (after validation period)
Features: Clustering, RLS, real-time, analytics
```

## Code Examples

### Creating a Job (Both Modes)

```javascript
// User calls: createJob({ nichoId, angulo, ... })
// Framework handles routing automatically

// Result: Same job object either way
{
    id: 'uuid-string',      // UUID in both modes
    nichoId: 'filosofia',
    angulo: 'question topic',
    status: 'pending',
    createdAt: 'ISO-8601',
    updatedAt: 'ISO-8601'
}
```

### Recording Exploration (Both Modes)

```javascript
// Browser: rollDice()
// → Sends: POST /api/exploration { nichoId, sessionId, ... }

// Supabase mode:
// Inserts into exploration_history table + logs

// JSON fallback mode:
// Logs only (no DB to persist to)

// Frontend: Always works, stats update via localStorage
```

### Fetching Stats (Both Modes)

```javascript
// Frontend: await getTaxonomyStats()

// Supabase mode:
// Fetches from exploration_history table (accurate count)

// JSON fallback mode:
// Fetches from localStorage (client-side count)

// Result: Same interface, possibly different accuracy
```

## Monitoring & Observability

### Logging Pattern

```javascript
// Clear identification of which mode is active
if (useDatabase) {
    console.log('[JobQueue] Using Supabase database')
} else {
    console.log('[JobQueue] Using JSON fallback')
}

// Error messages indicate mode:
// [JobQueue] Supabase error: ...
// [JobQueue] JSON error: ...
```

### Health Checks

```javascript
// /api/health endpoint shows mode status
{
    database: 'supabase',        // or 'json-fallback'
    connected: true,              // Supabase test query
    fallbackAvailable: true,       // JSON file exists
}
```

## Best Practices

1. **Always test both modes** — Create test suite covering both paths
2. **Consistent logging** — Use mode-specific prefixes ([DB], [JSON])
3. **Monitor fallback usage** — Alert if falling back in production
4. **Plan migration timeline** — When to remove JSON fallback
5. **Document data flow** — Show decision points in architecture docs

## Future Enhancements

### Potential Improvements

1. **Automatic dual-write** — Write to both modes in production for safety
2. **Reconciliation tool** — Verify both modes have same data
3. **Migration script** — Automated JSON → Supabase migration
4. **Fallback metrics** — Track when/why fallback is used
5. **Circuit breaker** — Auto-fallback if Supabase error rate high

### Related Patterns

- **Strangler Pattern** — Gradually migrate from old to new system
- **Anti-Corruption Layer** — Translate between JSON and DB formats
- **Bulkhead Pattern** — Isolate failure (Supabase failure doesn't affect JSON)

## References

- **Implemented in:** TD-1.2 Database Foundation
- **Used by:** Job Queue, Exploration Tracking, Agent Outputs
- **Fallback location:** `server/data/jobs.json`, localStorage
- **Configuration:** `.env` variables (SUPABASE_URL, SUPABASE_ANON_KEY)

---

**Pattern Status:** ✅ Production-Ready (TD-1.2)
**Tested Modes:** Supabase ✅ | JSON ✅
**Zero-Downtime:** Yes ✅
**Recommended For:** Database migrations, infrastructure upgrades, MVP to scaling transition
