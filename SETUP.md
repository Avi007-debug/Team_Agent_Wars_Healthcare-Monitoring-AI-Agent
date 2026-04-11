# Team Setup Guide

This guide helps teammates run the project after the Week-7 reorganization.

Project repository: https://github.com/Avi007-debug/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent

## 1. Project Layout

- `backend/` -> FastAPI API, RAG pipeline, tools, datasets, tests
- `frontend/` -> Main 3-page React website (Home, Chat, About)
- `frontend/medical-frontend/` -> Secondary/legacy React UI

Use each folder directly when running that part of the project.

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

## 7. Run Backend (FastAPI)

From repository root:

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn api:app --reload
```

Open Swagger UI:

- http://127.0.0.1:8000/docs

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
