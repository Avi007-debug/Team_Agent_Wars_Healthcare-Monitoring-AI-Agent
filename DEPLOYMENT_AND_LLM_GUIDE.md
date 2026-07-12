# Guide: GCP Cloud Run Deployment

This guide provides step-by-step instructions for:
1. Containerizing and deploying the FastAPI backend to Google Cloud Platform (GCP) Cloud Run.

---

## ☁️ Part 1: GCP Cloud Run Backend Deployment

Google Cloud Run is the recommended platform for your serverless backend. It scales to zero when inactive (reducing cost to $0) and accommodates containerized python environments easily.

### Prerequisites:
* A Google Cloud Project with Billing Enabled (free tier credits cover this).
* [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) installed and authenticated.
* Docker installed locally.

### Step 1: Enable GCP Services & Authenticate
Open your terminal and run:
```bash
# 1. Login to your Google account
gcloud auth login

# 2. Select your active GCP project
gcloud config set project <YOUR_PROJECT_ID>

# 3. Enable Artifact Registry & Cloud Run APIs
gcloud services enable artifactregistry.googleapis.com run.googleapis.com
```

### Step 2: Set Up Artifact Registry
Create a repository to host your Docker container:
```bash
# Create repository in Artifact Registry
gcloud artifacts repositories create medassist-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="MedAssist backend docker registry"
```

Configure Docker to authenticate with GCP registry:
```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Step 3: Build & Cache Model Weights
To prevent cold-starts from timing out, your Dockerfile pre-downloads the Hugging Face model weights (`all-MiniLM-L6-v2` and `ms-marco-MiniLM-L-6-v2`) on build using `cache_models.py`.

Build the image locally:
```bash
# Build the container image
docker build -t us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/medassist-repo/medassist-backend:latest ./backend
```

### Step 4: Push to Google Artifact Registry
```bash
docker push us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/medassist-repo/medassist-backend:latest
```

### Step 5: Deploy to Cloud Run
Deploy the container with 2 CPU and 2Gi Memory (required to hold embedding weights in RAM):
```bash
gcloud run deploy medassist-backend \
  --image=us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/medassist-repo/medassist-backend:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --set-env-vars=SUPABASE_URL="https://your-project.supabase.co",SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```
Once deployed, Cloud Run will print your public HTTPS URL (e.g. `https://medassist-backend-xxxxxx-uc.a.run.app`). Update `VITE_API_URL` in your frontend `.env` to point to this new URL.


