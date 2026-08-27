# deploy-voice-agent.ps1
# RentPe Voice Agent Deployment for Google Cloud
# Run this in your own terminal (not through opencode)

$ErrorActionPreference = "Stop"

$PROJECT = "rentpe-506413"
$REGION = "asia-south1"
$IMAGE = "$REGION-docker.pkg.dev/$PROJECT/projectx/voice-agent:latest"
$SA = "projectx-runtime@$PROJECT.iam.gserviceaccount.com"

Write-Host "=== RentPe Voice Agent Deployment ===" -ForegroundColor Cyan
Write-Host "Project:  $PROJECT"
Write-Host "Region:   $REGION"
Write-Host "Image:    $IMAGE"
Write-Host ""

# Step 1: Enable APIs
Write-Host "[1/6] Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com --project=$PROJECT

# Step 2: Artifact Registry repo
Write-Host "[2/6] Ensuring Artifact Registry repo exists..." -ForegroundColor Yellow
try { gcloud artifacts repositories create projectx --repository-format=docker --location=$REGION --project=$PROJECT 2>$null } catch { Write-Host "  (repo already exists)" }

# Step 3: Create secrets
Write-Host "[3/6] Creating secrets..." -ForegroundColor Yellow
foreach ($SECRET in @("projectx-sarvam-api-key", "projectx-eleven-api-key")) {
    $exists = gcloud secrets describe $SECRET --project=$PROJECT 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $SECRET already exists"
    } else {
        Write-Host "  Creating $SECRET..."
        "REPLACE_ME" | gcloud secrets create $SECRET --data-file=- --project=$PROJECT
    }
}

# Step 4: Service account
Write-Host "[4/6] Ensuring service account exists..." -ForegroundColor Yellow
try { gcloud iam service-accounts create projectx-runtime --display-name="RentPe Runtime" --project=$PROJECT 2>$null } catch { Write-Host "  (service account already exists)" }
Write-Host "  Granting secret accessor role..."
gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor" --condition=None 2>$null

# Step 5: Build image
Write-Host "[5/6] Building voice agent image via Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --config=.cloudbuild-voice-agent.yaml --project=$PROJECT --substitutions="_IMAGE=$IMAGE" .

# Step 6: Deploy
Write-Host "[6/6] Deploying voice agent to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy projectx-voice-agent --image=$IMAGE --region=$REGION --project=$PROJECT --service-account=$SA --update-secrets="SARVAM_API_KEY=projectx-sarvam-api-key:latest,ELEVEN_API_KEY=projectx-eleven-api-key:latest,LIVEKIT_URL=projectx-livekit_url:latest,LIVEKIT_API_KEY=projectx-livekit_api_key:latest,LIVEKIT_API_SECRET=projectx-livekit_api_secret:latest,INTERNAL_API_URL=projectx-internal-api-url:latest,INTERNAL_API_TOKEN=projectx-internal-api-token:latest" --min-instances=1 --max-instances=1 --port=8080 --no-traffic

Write-Host ""
Write-Host "=== Deployment complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update secrets with real API keys:"
Write-Host "     echo -n 'YOUR_SARVAM_KEY' | gcloud secrets versions add projectx-sarvam-api-key --data-file=-"
Write-Host "     echo -n 'YOUR_ELEVEN_KEY' | gcloud secrets versions add projectx-eleven-api-key --data-file=-"
Write-Host ""
Write-Host "  2. Route traffic (when ready):"
Write-Host "     gcloud run services update-traffic projectx-voice-agent --region=$REGION --to-latest"
Write-Host ""
Write-Host "  3. Verify:"
Write-Host "     gcloud run services describe projectx-voice-agent --region=$REGION --format='value(status.url)'"
