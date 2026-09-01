# Migrating off Lovable Cloud to your own PostgreSQL

Everything the app stores today lives in plain PostgreSQL. The pieces that are
Supabase-specific are: auth (JWT issuing), the auto-generated REST API
(PostgREST), realtime, and the `auth.uid()` function used inside RLS policies.

## 1. What you must reproduce

| Feature in app | Provided today by | Self-hosted replacement |
| --- | --- | --- |
| Tables, triggers, RLS | PostgreSQL | Same SQL, any Postgres 15+ |
| `auth.users`, sign in/up, Google OAuth | Supabase Auth (GoTrue) | GoTrue (open source) or Auth.js/Keycloak |
| `supabase.from(...)` queries | PostgREST | PostgREST (open source) or your own API |
| Realtime reaction timeline | Supabase Realtime | `supabase/realtime` container, or Postgres `LISTEN/NOTIFY` + WebSocket |
| Server functions | TanStack `createServerFn` | unchanged — they just need a DB URL |

The simplest 1:1 path is **self-hosted Supabase** (docker compose), because it
bundles GoTrue + PostgREST + Realtime and every line of app code keeps working.

## 2. Export the schema and data

From any machine with `psql`/`pg_dump` and your database URL:

```bash
# schema only (tables, enums, functions, triggers, policies, grants)
pg_dump --schema-only --no-owner --no-privileges "$SOURCE_URL" > schema.sql
# data only, public schema
pg_dump --data-only --schema=public --no-owner "$SOURCE_URL" > data.sql
# users live in the auth schema
pg_dump --data-only --schema=auth --no-owner "$SOURCE_URL" > auth.sql
```

On Lovable Cloud, use **Cloud → Advanced settings → Export data** to get the
dump; direct `pg_dump` access is not exposed.

## 3. Stand up the target

```bash
git clone https://github.com/supabase/supabase
cd supabase/docker && cp .env.example .env
# set POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, SITE_URL
docker compose up -d
```

Then load, in this order: `schema.sql` → `auth.sql` → `data.sql`.

If you skip GoTrue and use your own auth, you must also recreate
`auth.uid()`/`auth.jwt()` as SQL functions that read the request JWT claims —
every RLS policy in this app depends on `auth.uid()`.

## 4. Point the app at it

Only environment variables change; no application code changes:

```
VITE_SUPABASE_URL / SUPABASE_URL      -> https://your-host:8000
VITE_SUPABASE_PUBLISHABLE_KEY         -> your ANON_KEY
SUPABASE_SERVICE_ROLE_KEY             -> your SERVICE_ROLE_KEY
```

Also reconfigure the Google OAuth provider with your new callback URL
(`https://your-host/auth/v1/callback`) and add your app origin to the allowed
redirect URLs.

## 5. If you want to drop Supabase libraries entirely

Bigger job, roughly:

1. Replace `@/integrations/supabase/client` calls with API calls to your own
   endpoints (this app touches `profiles`, `stamps`, `loyalty_history`,
   `points`, `circles`, `circle_members`, `reactions`, `reaction_templates`,
   `solidarity`).
2. Move every query into `createServerFn` handlers using `postgres.js` or
   `drizzle`, connecting with a pooled `DATABASE_URL`.
3. Because queries then run as a privileged DB role, RLS no longer protects
   you — enforce ownership checks in each handler (`where user_id = $session`).
4. Replace realtime subscriptions (Matchday timeline, points cheer sound) with
   polling or a WebSocket server backed by `LISTEN/NOTIFY`.
5. Issue and verify your own session JWTs in the auth middleware.

## 6. Operational checklist

- Nightly `pg_dump` backups plus WAL archiving.
- Connection pooling (PgBouncer/Supavisor) — serverless handlers open many
  short connections.
- TLS on the database and the API gateway.
- Keep the `x-backfill-key` protected results-backfill endpoint pointing at the
  new host after cutover.
