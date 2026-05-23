# Deployment Guide — AI Medical Assistant

## Architecture

```text
Browser User
    -> Vercel Frontend (React + Vite)
    -> Render/Railway Backend (FastAPI)
    -> Medical Agent (RAG + Tools)
    -> Local dataset/index assets

Auth + chat persistence:
Frontend -> Supabase Auth + chat_history table
```

## Architecture Evolution (Important)

Initial pattern (early phase):

```text
Frontend -> Supabase directly
```

Current production-style pattern:

```text
Frontend -> FastAPI Backend -> Supabase
```

Why current pattern is used:

- fewer client-side insert/session race issues
- centralized validation and persistence logic
- cleaner scaling path for API governance and monitoring

## 1. Pre-Deployment Checklist

1. Backend runs locally from venv.
2. Frontend runs locally with Vite.
3. Supabase project is created and keys are available.
4. Supabase table `chat_history` exists.
5. Backend can access RAG assets (`medical_rag_dataset.json`, `medical_vector_db.faiss`).

Official source references for rebuilt datasets:

- OpenFDA: https://open.fda.gov/data/drug/label/
- Disease dataset (Kaggle): https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset
- USDA FoodData Central: https://fdc.nal.usda.gov/
- WHO: https://www.who.int/health-topics
- CDC: https://www.cdc.gov/

Direct dataset links provided by the team (use for building/preprocessing):

- OpenFDA drug label download (CSV/JSON bundles): https://open.fda.gov/apis/drug/label/download/
- Kaggle — Disease Symptoms and Treatments dataset: https://www.kaggle.com/datasets/snmahsa/disease-symptoms-and-treatments-dataset?resource=download
- Kaggle — Foods & Nutrition dataset: https://www.kaggle.com/datasets/adarshzolekar/foods-nutrition-dataset
- WHO publications / synthetic guideline sources: https://www.who.int/publications

Supabase SQL:

```sql
create extension if not exists "uuid-ossp";

create table if not exists chat_history (
    id uuid default uuid_generate_v4() primary key,
    user_id text,
    query text,
    response text,
    created_at timestamp default now()
);
```

## 2. Backend Deployment (Render)

### A. Render Dashboard Setup

| Setting | Value |
|---|---|
| Service Type | Web Service |
| Runtime | Python |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn api:app --host 0.0.0.0 --port 10000` |

### B. Recommended Environment Variables

| Variable | Value |
|---|---|
| `PYTHON_VERSION` | `3.11.9` |
| `PORT` | `10000` (Render will provide if omitted) |

### C. Render Notes

- Large RAG assets can exceed free-tier limits.
- First request after idle can be slow due to model warm-up.
- Ensure `backend/medical_rag_dataset.json` and `backend/medical_vector_db.faiss` are available to the deployed instance.
- Known practical limitation: memory-constrained instances (for example ~512MB class) may crash on heavy retrieval/reranking loads.

## 3. Backend Deployment (Railway Alternative)

### A. Service Configuration

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn api:app --host 0.0.0.0 --port $PORT` |

### B. Railway Environment

- Set Python runtime to 3.11.
- Ensure required data files are mounted or bundled.

## 4. Frontend Deployment (Vercel)

### A. Project Settings

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### B. Required Environment Variables

| Variable | Example |
|---|---|
| `VITE_API_URL` | `https://your-backend-service.onrender.com` |
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your-supabase-anon-key` |

Important: Vite requires env names prefixed with `VITE_`.

## 5. Supabase Project Setup

1. Create project at `https://supabase.com`.
2. Copy project URL and anon key.
3. Run SQL shown above in SQL Editor.
4. In Auth settings, enable Email/Password provider.
5. Add your Vercel domain under allowed redirect/site URLs if needed by your auth policy.

## 6. Production CORS and Security

In production, avoid wildcard CORS. Update allow list in backend to include only trusted frontend domains.

Current backend CORS is permissive for development; tighten it before production.

## 7. End-to-End Production Validation

Run these checks after both deployments:

1. Backend health endpoint responds.
2. Frontend loads and can reach backend.
3. Login and signup succeed through Supabase.
4. Query to `/ask` returns response.
5. Chat row is inserted into `chat_history`.
6. Browser refresh reloads chat history.
7. Clear Chat removes user history rows.
8. `/predict` and `/interaction` return expected outputs.

Recommended add-on checks:

9. `/profile` GET and PUT work for authenticated users.
10. No-knowledge/safety fallback is returned for out-of-domain prompts.

## 8. Useful Commands

Backend local production-like start:

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn api:app --host 0.0.0.0 --port 10000
```

Frontend local build verification:

```powershell
cd frontend
npm run build
```

## 9. Deployment Status Summary

- Local setup: stable and recommended for demos/evaluation.
- Cloud free-tier setup: usable for light traffic, but can fail under heavy model usage due to memory ceilings.
- If moving to full production, prefer higher-memory instances and optionally external vector infrastructure.
