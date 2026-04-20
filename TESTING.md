# Testing Instructions — AI Medical Assistant

## 0. Start With Venv (Required)

From repo root:

```powershell
cd Team_Agent_Wars_Healthcare-Monitoring-AI-Agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Then install backend deps:

```powershell
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

## 1. Run Backend First

From repo root (recommended command):

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

Keep this terminal running.

## 2. Run Frontend

Open a second terminal from repo root:

```powershell
cd frontend
npm install
npm run dev
```

Set `frontend/.env` before testing auth/history:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Backend Endpoint Checks

Use PowerShell-native requests:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get | ConvertTo-Json -Compress
Invoke-RestMethod -Uri "http://127.0.0.1:8000/ask" -Method Post -ContentType "application/json" -Body (@{ query = "symptoms of diabetes"; role = "user" } | ConvertTo-Json -Compress) | ConvertTo-Json -Compress
Invoke-RestMethod -Uri "http://127.0.0.1:8000/predict" -Method Post -ContentType "application/json" -Body (@{ age = 55; bp = 160 } | ConvertTo-Json -Compress) | ConvertTo-Json -Compress
Invoke-RestMethod -Uri "http://127.0.0.1:8000/interaction" -Method Post -ContentType "application/json" -Body (@{ drug1 = "aspirin"; drug2 = "ibuprofen" } | ConvertTo-Json -Compress) | ConvertTo-Json -Compress
```

Expected:

- `GET /health`: `{ "status": "ok" }`
- `POST /ask`: JSON with `response`
- `POST /predict`: JSON with `prediction`
- `POST /interaction`: JSON with `interaction`

## 4. Supabase Persistence Prerequisite

In Supabase SQL editor, run:

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

## 5. End-to-End Flow Test

1. Open frontend (`http://localhost:5173`) and go to `/chat`.
2. Sign up (or log in) with email/password.
3. Ask a query and verify assistant response appears.
4. Refresh browser.
5. Confirm previous messages load from Supabase `chat_history`.
6. Click Clear Chat and verify old messages disappear.
7. Log out and confirm chat area returns to login panel.

## 6. Regression Checklist

- [ ] Login works
- [ ] Signup works
- [ ] Logout works
- [ ] Chat save works
- [ ] History load works after refresh
- [ ] Clear chat removes user records
- [ ] `/ask` works for medical/rag queries
- [ ] `/predict` returns risk output
- [ ] `/interaction` returns interaction output

## 7. Optional Automated Test Runs

From `backend/` (with venv active):

```powershell
python test_agent.py
python test_retrieval.py
python tests/test_api.py
```
