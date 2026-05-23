# Team Setup Guide

This guide helps teammates run the project after the Week-7 reorganization.

Project repository: https://github.com/Avi007-debug/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent

## 1. Project Layout

- `backend/` -> FastAPI API, RAG pipeline, tools, datasets, tests
- `frontend/` -> Main 3-page React website (Home, Chat, About)
- `frontend/medical-frontend/` -> Secondary/legacy React UI

Verified top-level docs and infra files:

- `README.md`
- `SETUP.md`
- `TESTING.md`
- `DEPLOYMENT.md`
- `render.yaml`

Use each folder directly when running that part of the project.

## 1.1 Architecture (Current)

```text
Frontend (React UI)
  -> FastAPI Backend
  -> Multi-agent medical pipeline
  -> Hybrid RAG (FAISS + BM25 + reranker)
  -> Supabase (auth + persistence)
```

Why this matters:

- frontend no longer writes directly to database
- backend controls persistence and API validation
- improved stability versus direct frontend database writes

## 2. Prerequisites

- Python 3.10 or 3.11
- Node.js 18+
- npm
- Git

## 3. Clone Repository

```powershell
git clone https://github.com/Avi007-debug/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent.git
cd Team_Agent_Wars_Healthcare-Monitoring-AI-Agent
```

## 4. Create and Activate Virtual Environment

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### macOS/Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 5. Install Backend Dependencies

```powershell
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

## 6. Confirm Required Backend Data Files

The following files are intentionally gitignored and should stay local:

- `backend/medical_rag_dataset.json`
- `backend/medical_vector_db.faiss`
- `backend/Datasets/`

If missing on a fresh clone:

1. Download/extract data bundle from your team source.
2. Copy `Datasets/` to `backend/Datasets/`.
3. Copy `medical_rag_dataset.json` to `backend/medical_rag_dataset.json`.
4. Copy `medical_vector_db.faiss` to `backend/medical_vector_db.faiss`.

Official dataset/reference sources used in this project:

- OpenFDA Drug Label Dataset: https://open.fda.gov/data/drug/label/
- Kaggle Disease-Symptom Description Dataset: https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset
- USDA FoodData Central: https://fdc.nal.usda.gov/
- WHO Health Topics/Guidelines: https://www.who.int/health-topics
- CDC Health Guidance: https://www.cdc.gov/

Additional direct dataset links provided by the team:

- OpenFDA drug label download (CSV/JSON bundles): https://open.fda.gov/apis/drug/label/download/
- Kaggle — Disease Symptoms and Treatments dataset: https://www.kaggle.com/datasets/snmahsa/disease-symptoms-and-treatments-dataset?resource=download
- Kaggle — Foods & Nutrition dataset: https://www.kaggle.com/datasets/adarshzolekar/foods-nutrition-dataset
- WHO publications / synthetic guideline sources: https://www.who.int/publications

Note: the repository runs from preprocessed local assets (`medical_rag_dataset.json` + `medical_vector_db.faiss`) for speed and reproducibility.

## 7. Run Backend (FastAPI)

From repository root:

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn api:app --reload
 or python -m uvicorn api:app --reload
```

Open Swagger UI:

- http://127.0.0.1:8000/docs

Primary backend endpoints to verify in Swagger:

- `POST /ask`
- `POST /predict`
- `POST /interaction`
- `GET /history`
- `DELETE /clear`
- `GET /profile`
- `PUT /profile`

## 8. Run Backend Tests and Manual Checks

From `backend/`:

```powershell
python test_agent.py
python tests/test_api.py
```

## 9. Install and Run Main Frontend

From repository root:

```powershell
cd frontend
npm install
npm run dev
```

Create `frontend/.env` from `frontend/.env.example` and set:

```powershell
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Create Supabase table in SQL editor:

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

Main frontend (3-page app) routes:

- `/` Home
- `/chat` Chat
- `/about` About

## 10. Optional: Run Secondary Frontend

```powershell
cd frontend/medical-frontend
npm install
npm run dev
```

## 11. Common Troubleshooting

- Backend import issue: run backend commands from `backend/` only.
- Frontend build issue: run frontend commands from `frontend/` only.
- If `faiss` install fails on Windows:
  - `pip install faiss-cpu==1.13.2`
- First model load can be slow due to transformer downloads/caching.

## 12. Recommended Workflow

1. Pull latest code.
2. Activate `.venv`.
3. Start backend from `backend/`.
4. Start frontend from `frontend/`.
5. Run `backend/test_agent.py` before pushing backend changes.
