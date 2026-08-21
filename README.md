# AI Property Receptionist and Property Discovery

Phase 2 foundation for a phone and WhatsApp-first rental property discovery platform for India. It includes PostgreSQL schema infrastructure only; product workflows, AI, telephony, messaging, CRUD, and search remain excluded.

## Architecture

- `apps/api`: NestJS business backend foundation with `GET /api/health`.
- `apps/web`: Next.js App Router admin shell with Tailwind CSS.
- `apps/voice-agent`: LiveKit-oriented process boundary and interfaces only. It does not handle calls or audio yet.
- `packages/config`: Strict environment parsing.
- `packages/types`: Shared transport types.
- `packages/ai`: Reserved AI package boundary; no provider integration.
- `packages/database`: Kysely, PostgreSQL pool, ordered migrations, schema types, catalog-level integration tests, and deterministic transactional seeds.
- `infra/docker`: Application Dockerfiles. Phase 1 does not run PostgreSQL or external providers.

The intended architecture is a modular monolith: NestJS will own persistent business logic, while the future LiveKit Agent will own real-time media and call orchestration and communicate through authenticated backend tools.

## Prerequisites

- Node.js 22 or newer
- pnpm 10 through Corepack (`corepack prepare pnpm@10.15.0 --activate`)
- Docker Desktop, optional

## Setup

```bash
cp .env.example .env
corepack pnpm install
```

Set `INTERNAL_API_TOKEN` to a development value of at least 16 characters. Remaining blank provider variables are reserved for later phases and are not consumed.

## Development

```bash
corepack pnpm dev
corepack pnpm dev:api
corepack pnpm dev:web
corepack pnpm dev:voice
```

The voice-agent command starts only its foundation health process. It does not connect to LiveKit.

## Verification

```bash
corepack pnpm lint
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
node scripts/check-health.mjs
```

## Docker

```bash
docker compose up --build
```

The compose stack uses pinned `supabase/postgres:15.8.1.060`, selected because it provides PostgreSQL 15 with PostGIS, pgvector, citext, and pgcrypto. Production PostgreSQL is hosted by Supabase; the application uses standard PostgreSQL connectivity through Kysely, never Supabase database APIs.

```bash
docker compose up -d database
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm db:seed
corepack pnpm db:verify
corepack pnpm db:status
```

`db:seed` reports aggregate and per-entity `inserted`, `updated`, and `skipped` statistics. On an unchanged database, the second run must report zero inserts, zero updates, and all 270 deterministic development records skipped (10 locations, 20 fictional brokers, 120 fictional properties, and 120 placeholder image paths). It uses no real contacts, scraped listings, copyrighted photos, or embeddings.

`db:verify` requires seeded data and checks PostgreSQL 15, required extensions, deterministic counts, and duplicate identifiers. The database package integration suite inspects the live PostgreSQL catalog for tables, enums, foreign keys, checks, indexes, timestamp types, notification uniqueness, PostGIS geography SRID, and `vector(1536)`.

`db:reset` is destructive and requires `ALLOW_DATABASE_RESET=true`; it is forbidden when `NODE_ENV=production`. Migrations use `MIGRATION_DATABASE_URL` in production and do not run during application startup.

## Environment

The Google Cloud-hosted backend uses `DATABASE_URL` to connect directly to Supabase PostgreSQL. Deployment tooling uses the direct/session-mode `MIGRATION_DATABASE_URL`. Pool size and timeouts are configurable in `.env.example`. Never commit `.env` or credentials.

## CI

GitHub Actions starts the pinned `supabase/postgres:15.8.1.060` image, runs migrations twice, runs the deterministic seed twice with explicit initial/idempotent statistic assertions, validates final counts and PostgreSQL 15/extensions, executes the live catalog integration suite, then runs lint, formatting, typechecking, remaining unit tests, and production builds. This workflow is the authoritative Phase 2 database verification. Phase 2 remains verification-pending until that workflow succeeds; local static checks alone do not complete the phase.

## Future Phase Boundaries

Phase 3 may add CRUD only after explicit approval. Phase 2 exposes no property, broker, user, or search business APIs and implements no spatial search, vector search, matching, AI, voice, WhatsApp, or jobs.

## Troubleshooting

- If `pnpm` is unavailable, activate it through Corepack using the prerequisite commands.
- If a port is occupied, change the matching environment variable (and update the relevant dev command or Docker port mapping where needed).
- If environment validation fails for the voice agent, provide an `INTERNAL_API_TOKEN` containing at least 16 characters.
