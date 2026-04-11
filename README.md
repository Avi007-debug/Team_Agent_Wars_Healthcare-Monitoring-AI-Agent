# Team Agent Wars - Healthcare Monitoring AI Agent

Full-stack AI healthcare assistant with:
- FastAPI backend
- Hybrid RAG retrieval (FAISS + BM25 + reranker)
- Tool routing (interaction, risk, reminders, alerts)
- React frontend website

## Project Structure

```text
Team_Agent_Wars_Healthcare-Monitoring-AI-Agent/
|-- backend/
|   |-- api.py
|   |-- agent/
|   |-- retrieval/
|   |-- tools/
|   |-- tests/
|   |-- interface/
|   |-- Scripts/
|   |-- Datasets/
|   |-- medical_rag_dataset.json
|   |-- medical_vector_db.faiss
|   `-- requirements.txt
|-- frontend/
|   |-- index.html
|   |-- package.json
|   |-- src/                # Main 3-page app (Home/Chat/About)
|   |-- public/             # favicon + logo + manifest
|   `-- medical-frontend/   # Secondary/legacy frontend
|-- docs/
|-- SETUP.md
|-- TESTING.md
|-- DEPLOYMENT.md
`-- render.yaml
```

## Quick Start

### 1) Backend

```powershell
cd backend
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
..\.venv\Scripts\python.exe -m uvicorn api:app --reload
```

Swagger: http://127.0.0.1:8000/docs

### 2) Frontend

```powershell
cd frontend
npm install
npm run dev
```

Main app routes:
- `/` Home
- `/chat` Chat
- `/about` About

## Data Notes

These files are runtime-required and intentionally gitignored:
- `backend/Datasets/`
- `backend/medical_rag_dataset.json`
- `backend/medical_vector_db.faiss`

If missing, restore them to `backend/` paths exactly.

## Deployment

- Frontend (Vercel): root directory `frontend`
- Backend (Render/Railway): root directory `backend`
- Render config already updated in `render.yaml`

## Disclaimer

For educational and informational use only. Not a substitute for professional medical advice.
