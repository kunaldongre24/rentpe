# Google Cloud Deployment

ProjectX uses Google Cloud for application hosting and Supabase for PostgreSQL. Do not deploy PostgreSQL to Cloud SQL and do not upload `.env` to Cloud Build.

## Runtime Shape

- `projectx-api`: Cloud Run service built from `infra/docker/api.Dockerfile`.
- `projectx-web`: Cloud Run service built from `infra/docker/web.Dockerfile`.
- `projectx-voice-agent`: persistent LiveKit agent worker. Use a Cloud Run worker pool when available in the project, or an always-on Compute Engine/container host. A request-based Cloud Run service can scale the LiveKit worker to zero and is not a reliable worker runtime.
- Supabase: direct PostgreSQL connection through `DATABASE_URL` and `MIGRATION_DATABASE_URL`.

The API and web containers bind to Cloud Run's injected `PORT`. The API health endpoint is `/api/health`.

## One-Time Google Cloud Setup

Run these commands from the repository root after installing the Google Cloud CLI and authenticating:

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

gcloud artifacts repositories create projectx --repository-format=docker --location=REGION
```

Create a dedicated runtime service account and grant it access to only the secrets it needs. Store every value below in Secret Manager:

```bash
printf '%s' 'SUPABASE_POSTGRES_URL' | gcloud secrets create projectx-database-url --data-file=-
printf '%s' 'SUPABASE_MIGRATION_URL' | gcloud secrets create projectx-migration-database-url --data-file=-
printf '%s' 'RANDOM_LONG_INTERNAL_TOKEN' | gcloud secrets create projectx-internal-api-token --data-file=-
printf '%s' 'LIVEKIT_URL' | gcloud secrets create projectx-livekit-url --data-file=-
printf '%s' 'LIVEKIT_API_KEY' | gcloud secrets create projectx-livekit-api-key --data-file=-
printf '%s' 'LIVEKIT_API_SECRET' | gcloud secrets create projectx-livekit-api-secret --data-file=-
printf '%s' 'GUPSHUP_API_KEY' | gcloud secrets create projectx-gupshup-api-key --data-file=-
printf '%s' 'GUPSHUP_SOURCE' | gcloud secrets create projectx-gupshup-source --data-file=-
printf '%s' 'YOUR_SARVAM_API_KEY' | gcloud secrets create projectx-sarvam-api-key --data-file=-
printf '%s' 'YOUR_ELEVEN_API_KEY' | gcloud secrets create projectx-eleven-api-key --data-file=-
```

Use the direct Supabase database URL for migrations. Do not use a browser-visible Supabase key in the API or web service. Grant the Cloud Run runtime service account `roles/secretmanager.secretAccessor` on these secrets.

## Build Images

```bash
export REGION=asia-south1
export PROJECT_ID=$(gcloud config get-value project)
export REPO=$REGION-docker.pkg.dev/$PROJECT_ID/projectx

gcloud builds submit \
  --config=.cloudbuild-api.yaml \
  --substitutions=_IMAGE=$REPO/api:latest \
  .

gcloud builds submit \
  --config=.cloudbuild-web.yaml \
  --substitutions=_IMAGE=$REPO/web:latest \
  .

gcloud builds submit \
  --config=.cloudbuild-voice-agent.yaml \
  --substitutions=_IMAGE=$REPO/voice-agent:latest \
  .
```

Run migrations as a controlled step before routing traffic:

```bash
gcloud run jobs create projectx-migrate \
  --image=$REPO/api:latest \
  --region=$REGION \
  --command=corepack \
  --args=pnpm,db:migrate \
  --set-secrets=MIGRATION_DATABASE_URL=projectx-migration-database-url:latest \
  --set-env-vars=NODE_ENV=production

gcloud run jobs execute projectx-migrate --region=$REGION --wait
```

If the migration job already exists, deploy a new revision or update it rather than creating a duplicate job.

## Deploy API and Web

```bash
gcloud run deploy projectx-api \
  --image=$REPO/api:latest \
  --region=$REGION \
  --platform=managed \
  --port=3001 \
  --allow-unauthenticated \
  --set-env-vars=NODE_ENV=production,API_HOST=0.0.0.0 \
  --set-secrets=DATABASE_URL=projectx-database-url:latest,INTERNAL_API_TOKEN=projectx-internal-api-token:latest

API_URL=$(gcloud run services describe projectx-api --region=$REGION --format='value(status.url)')

gcloud run deploy projectx-web \
  --image=$REPO/web:latest \
  --region=$REGION \
  --platform=managed \
  --port=3000 \
  --allow-unauthenticated \
  --set-env-vars=NODE_ENV=production,NEXT_PUBLIC_API_URL=$API_URL
```

The API must remain reachable by the voice worker. The internal tool token must be identical in the API and voice worker configuration.

## Deploy the Voice Worker

Configure the LiveKit worker with these runtime values in Secret Manager:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `SARVAM_API_KEY` — speech-to-text (Sarvam AI)
- `ELEVEN_API_KEY` — text-to-speech (ElevenLabs)
- `INTERNAL_API_URL` set to the deployed API URL
- `INTERNAL_API_TOKEN`
- WhatsApp provider secrets required by the API, not the worker

Deploy the voice worker (persistent, cannot scale to zero):

```bash
gcloud run deploy projectx-voice-agent \
  --image=$REPO/voice-agent:latest \
  --region=$REGION \
  --service-account=projectx-runtime@$PROJECT_ID.iam.gserviceaccount.com \
  --update-secrets=SARVAM_API_KEY=projectx-sarvam-api-key:latest,ELEVEN_API_KEY=projectx-eleven-api-key:latest,LIVEKIT_URL=projectx-livekit_url:latest,LIVEKIT_API_KEY=projectx-livekit_api_key:latest,LIVEKIT_API_SECRET=projectx-livekit_api_secret:latest,INTERNAL_API_URL=projectx-internal-api-url:latest,INTERNAL_API_TOKEN=projectx-internal-api-token:latest \
  --min-instances=1 \
  --max-instances=1 \
  --port=8080 \
  --no-traffic
```

Route traffic after verifying the revision:

```bash
gcloud run services update-traffic projectx-voice-agent --region=$REGION --to-latest
```

A convenience script is available at `scripts/deploy-voice-agent.sh` (bash) and `scripts/deploy-voice-agent.ps1` (PowerShell).

The voice-agent image uses Debian-based `node:24-slim` because LiveKit's native RTC bindings require glibc; Alpine/musl images fail to load the Linux native module. Deploy the worker with the image's direct Node entrypoint (`/app/apps/voice-agent/dist/livekit-worker.js start`) rather than invoking pnpm at runtime.

## Verification

```bash
API_URL=$(gcloud run services describe projectx-api --region=$REGION --format='value(status.url)')
curl "$API_URL/api/health"
gcloud run services describe projectx-api --region=$REGION
gcloud run services describe projectx-web --region=$REGION
gcloud logging read 'resource.type="cloud_run_revision"' --limit=20
```

Then configure the LiveKit SIP inbound trunk and dispatch rule to target `projectx-voice-agent`, make one real test call, and verify the corresponding user, search, requirements, and WhatsApp notification rows in Supabase.

## Security Checklist

- `.env` is excluded from Docker build contexts.
- Secrets are stored in Secret Manager, not image layers or Cloud Build substitutions.
- API and worker use a random production `INTERNAL_API_TOKEN` of at least 32 characters.
- Cloud Run ingress and IAM are reviewed before making the API public.
- Database migrations run only through the migration job.
- Logs contain no connection strings, authorization headers, or provider credentials.
