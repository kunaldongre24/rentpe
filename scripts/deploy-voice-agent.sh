#!/usr/bin/env bash
set -euo pipefail

PROJECT="rentpe-506413"
REGION="asia-south1"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/projectx/voice-agent:latest"
SA="projectx-runtime@${PROJECT}.iam.gserviceaccount.com"

echo "=== RentPe Voice Agent Deployment ==="
echo "Project:  ${PROJECT}"
echo "Region:   ${REGION}"
echo "Image:    ${IMAGE}"
echo ""

# --- Step 1: Enable required APIs ---
echo "[1/6] Enabling required APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com --project="${PROJECT}"

# --- Step 2: Create Artifact Registry repo (if not exists) ---
echo "[2/6] Ensuring Artifact Registry repo exists..."
gcloud artifacts repositories create projectx \
  --repository-format=docker \
  --location="${REGION}" \
  --project="${PROJECT}" 2>/dev/null || echo "  (repo already exists)"

# --- Step 3: Create secrets ---
echo "[3/6] Creating secrets..."
for SECRET in projectx-sarvam-api-key projectx-eleven-api-key; do
  if gcloud secrets describe "${SECRET}" --project="${PROJECT}" >/dev/null 2>&1; then
    echo "  ${SECRET} already exists"
  else
    echo "  Creating ${SECRET}..."
    echo -n "REPLACE_ME" | gcloud secrets create "${SECRET}" \
      --data-file=- \
      --project="${PROJECT}"
  fi
done

# --- Step 4: Create service account (if not exists) ---
echo "[4/6] Ensuring service account exists..."
gcloud iam service-accounts create projectx-runtime \
  --display-name="RentPe Runtime" \
  --project="${PROJECT}" 2>/dev/null || echo "  (service account already exists)"

echo "  Granting secret accessor role..."
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None >/dev/null 2>&1 || true

# --- Step 5: Build and push image ---
echo "[5/6] Building voice agent image via Cloud Build..."
gcloud builds submit \
  --config=.cloudbuild-voice-agent.yaml \
  --project="${PROJECT}" \
  --substitutions="_IMAGE=${IMAGE}" \
  .

# --- Step 6: Deploy to Cloud Run ---
echo "[6/6] Deploying voice agent to Cloud Run..."
gcloud run deploy projectx-voice-agent \
  --image="${IMAGE}" \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --service-account="${SA}" \
  --update-secrets="SARVAM_API_KEY=projectx-sarvam-api-key:latest,ELEVEN_API_KEY=projectx-eleven-api-key:latest,LIVEKIT_URL=projectx-livekit_url:latest,LIVEKIT_API_KEY=projectx-livekit_api_key:latest,LIVEKIT_API_SECRET=projectx-livekit_api_secret:latest,INTERNAL_API_URL=projectx-internal-api-url:latest,INTERNAL_API_TOKEN=projectx-internal-api-token:latest" \
  --min-instances=1 \
  --max-instances=1 \
  --port=8080 \
  --no-traffic

echo ""
echo "=== Deployment complete ==="
echo ""
echo "Next steps:"
echo "  1. Update secrets with real API keys:"
echo "     echo -n 'YOUR_SARVAM_KEY' | gcloud secrets versions add projectx-sarvam-api-key --data-file=-"
echo "     echo -n 'YOUR_ELEVEN_KEY' | gcloud secrets versions add projectx-eleven-api-key --data-file=-"
echo ""
echo "  2. Route traffic (when ready):"
echo "     gcloud run services update-traffic projectx-voice-agent --region=${REGION} --to-latest"
echo ""
echo "  3. Verify:"
echo "     gcloud run services describe projectx-voice-agent --region=${REGION} --format='value(status.url)'"
