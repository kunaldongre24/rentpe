# AI Property Receptionist and Property Discovery

ProjectX is a phone-first rental property discovery platform for India. The repository contains staged application foundations and verified phase implementations; external telephony and AI provider connections remain account/configuration dependent.

The admin/partner console uses Supabase Auth for identity and NestJS/Kysely for all application data. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ISSUER`, `SUPABASE_JWKS_URL`, and `SUPABASE_AUDIENCE=authenticated`. Dashboard accounts are provisioned in `dashboard_accounts`; the API never uses the Supabase data client for properties or operations data.

## Dashboard setup

Create dashboard users in Supabase Auth, then provision their application role through the admin-only API or a controlled SQL migration. The `auth_user_id` is the UUID from `auth.users`; do not put roles in editable user metadata.

Example controlled provisioning after migration:

```sql
insert into public.dashboard_accounts (auth_user_id, email, display_name, role, status)
values ('SUPABASE_AUTH_USER_UUID', 'admin@example.com', 'RentPe Admin', 'ADMIN', 'ACTIVE');
```

Broker/owner accounts require a matching `brokers.id`. Dashboard routes require a Supabase bearer access token:

- `GET /api/dashboard/me`
- `GET /api/dashboard/operations`
- `GET|POST /api/admin/accounts`
- `PATCH /api/admin/accounts/:id/status`
- `GET|POST /api/partner/properties`
- `PATCH /api/partner/properties/:id`
- `PATCH /api/partner/properties/:id/status`

Partner property reads and writes are restricted to the account's `broker_id`; admins can access all listings. Kysely remains the only application data access layer.

New foundational endpoints include:

- `GET|POST /api/searches`, `GET|PATCH|DELETE /api/searches/:id`
- `GET|POST /api/preferences`, `GET|PATCH|DELETE /api/preferences/:id`
- `GET|POST /api/conversations/sessions`, `GET|PATCH|DELETE /api/conversations/sessions/:id`
- `GET|POST /api/conversations/events`

Internal notification triggers require `Authorization: Bearer $INTERNAL_API_TOKEN`.

LiveKit CLI is supported for account operations. From an authenticated shell, inspect the configured project with `lk project list --project rentpe`, then use `lk sip`, `lk agent`, and `lk number` commands. Do not run purchase, deploy, or destructive commands until the target project, phone number, SIP provider, and production secrets have been confirmed.

ProjectX uses Vobiz as the telephony/SIP provider and LiveKit as the only voice-agent runtime. See [`docs/telephony-vobiz.md`](docs/telephony-vobiz.md) for the SIP flow, provider boundaries, configuration placeholders, session isolation, concurrency target, and onboarding checklist.

```text
Caller -> Vobiz Indian DID/SIP -> LiveKit SIP -> LiveKit Agent -> NestJS tools -> Supabase
```

Vobiz account-specific DID availability, KYC, SIP termination, webhook fields, pricing, region, and concurrency must be confirmed before production. No Vobiz credentials are committed or claimed as configured.

## Architecture

- `apps/api`: NestJS business backend foundation with `GET /api/health`.
- `apps/web`: Next.js App Router admin shell with Tailwind CSS.
- `apps/voice-agent`: LiveKit voice-runtime boundary with Vobiz telephony adapter contracts. It does not connect to external providers in local development.
- `packages/config`: Strict environment parsing, including optional Vobiz configuration status.
- `packages/types`: Shared transport types.
- `packages/ai`: Reserved AI package boundary; no provider integration.
- `packages/database`: Kysely, PostgreSQL pool, ordered migrations, schema types, catalog-level integration tests, and deterministic transactional seeds.
- `infra/docker`: Application Dockerfiles. Phase 1 does not run PostgreSQL or external providers.

The production WhatsApp provider is Gupshup. The API uses the `WhatsAppProvider` interface and the concrete `GupshupWhatsAppProvider`; local delivery is not a supported production fallback. Configure `WHATSAPP_PROVIDER=gupshup`, `GUPSHUP_API_KEY`, `GUPSHUP_SOURCE`, and `GUPSHUP_API_BASE_URL`.

## Prerequisites

- Node.js 22 or newer
- pnpm 10 through Corepack (`corepack prepare pnpm@10.15.0 --activate`)
- Docker Desktop, optional

## Setup

```bash
cp .env.example .env
corepack pnpm install
```

Set `INTERNAL_API_TOKEN` to a development value of at least 16 characters. Vobiz and LiveKit credentials are optional for local development and are never logged. The local voice process exposes boundaries only; it does not connect to Vobiz or LiveKit.

## Development

```bash
corepack pnpm dev
corepack pnpm dev:api
corepack pnpm dev:web
corepack pnpm dev:voice
```

The voice-agent command starts only its foundation health process. It does not connect to Vobiz, LiveKit SIP, or external AI providers.

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

`supabase/postgres:15.8.1.060` bootstraps through its required `supabase_admin` role, so the local Compose default and CI use that role. The application still connects through standard PostgreSQL URLs and Kysely, never Supabase database APIs.

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

- `VOBIZ_ACCOUNT_ID`, `VOBIZ_DID`, `VOBIZ_SIP_HOST`, `VOBIZ_SIP_PORT`, `VOBIZ_SIP_TRANSPORT`, `VOBIZ_SIP_USERNAME`, and `VOBIZ_SIP_PASSWORD` are account-specific telephony placeholders.
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_SIP_URI` are LiveKit placeholders.
- Do not add unapproved telephony provider credentials. Do not commit provider secrets.

## CI

GitHub Actions starts the pinned `supabase/postgres:15.8.1.060` image, runs migrations twice, runs the deterministic seed twice with explicit initial/idempotent statistic assertions, validates final counts and PostgreSQL 15/extensions, executes the live catalog integration suite, then runs lint, formatting, typechecking, remaining unit tests, and production builds. This workflow is the authoritative Phase 2 database verification. Phase 2 remains verification-pending until that workflow succeeds; local static checks alone do not complete the phase.

## CRUD API (Phase 3)

Phase 3 exposes foundational CRUD only through NestJS and Kysely. It does not implement search, matching, authentication, AI, telephony, LiveKit, WhatsApp, notifications, personalization, vector retrieval, or the admin dashboard.

Resources:

- `GET|POST /api/users`, `GET|PATCH|DELETE /api/users/:id`
- `GET|POST /api/locations`, `GET|PATCH|DELETE /api/locations/:id`
- `GET|POST /api/brokers`, `GET|PATCH|DELETE /api/brokers/:id`
- `GET|POST /api/properties`, `GET|PATCH|DELETE /api/properties/:id`

Collection endpoints accept `limit` (1–100, default 20) and `offset` (default 0). Request bodies are validated with the shared Zod contracts in `packages/types`. Phone values must be E.164 at the application boundary. Property deletion is a soft delete (`status=DELETED`) so historical references remain safe.

The CRUD integration suite runs only when `DATABASE_URL` is configured; CI runs it after migrations and seed setup against the pinned PostgreSQL service.

## Troubleshooting

- If `pnpm` is unavailable, activate it through Corepack using the prerequisite commands.
- If a port is occupied, change the matching environment variable (and update the relevant dev command or Docker port mapping where needed).
- If environment validation fails for the voice agent, provide an `INTERNAL_API_TOKEN` containing at least 16 characters.
