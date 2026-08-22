# Production Operations

ProjectX is currently a modular monorepo with NestJS, Next.js, a voice-agent boundary, Kysely/PostgreSQL access, and shared contracts. The production hardening in this phase covers process behavior and configuration validation. External provider integrations remain separately gated until their credentials and adapters are implemented.

## Runtime Configuration

The API reads `DATABASE_URL` for runtime access. Migration and seed commands read `MIGRATION_DATABASE_URL`; production migration commands reject fallback to `DATABASE_URL`.

Required production controls:

- Set `NODE_ENV=production`.
- Supply a random `INTERNAL_API_TOKEN` of at least 32 characters to the voice agent and API tool boundary.
- Store database URLs, internal tokens, provider credentials, and signing secrets in Google Cloud Secret Manager.
- Do not put secrets in Docker images, frontend variables, logs, or source control.
- Keep `DATABASE_POOL_MAX`, `DATABASE_IDLE_TIMEOUT_MS`, and `DATABASE_CONNECT_TIMEOUT_MS` bounded for the Cloud Run instance size.

## Cloud Run Shape

The API container is built from `infra/docker/api.Dockerfile` and listens on `API_HOST`/`API_PORT`. Cloud Run should provide the port through `API_PORT` or map its injected `PORT` value in deployment configuration. Configure the service health probe against `/api/health`.

The voice-agent container is built from `infra/docker/voice-agent.Dockerfile` and exposes `/health` and `/ready`. It handles `SIGTERM` and closes its HTTP server before exit. It is currently a boundary process; SIP, LiveKit media, STT, TTS, and LLM provider connections are not claimed as production-ready.

## Database Operations

- Application startup does not run migrations.
- Application startup does not fail only because the database is temporarily unavailable.
- `GET /api/health` executes `SELECT 1` and returns HTTP 503 with a sanitized degraded response when PostgreSQL is unavailable.
- Use a migration-capable Supabase connection for `MIGRATION_DATABASE_URL`; do not use Cloud SQL or a database SDK.
- Run `corepack pnpm db:migrate` as a controlled deployment step before changing application traffic.

## Verification

Run locally before a release:

```bash
corepack pnpm lint
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

The authoritative PostgreSQL workflow uses the pinned `supabase/postgres:15.8.1.060` image and must pass before a phase is verified.

## Observability

Cloud Run should export stdout/stderr to Cloud Logging and configure latency/error alerts for the API, database health failures, voice tool calls, and provider failures. Add Sentry or an equivalent error tracker only after its DSN is stored in Secret Manager. Logs must contain request IDs and safe operational context, never credentials, connection strings, raw authorization headers, or provider payloads.
