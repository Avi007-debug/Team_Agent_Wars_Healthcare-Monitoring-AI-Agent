# 🏥 AI-Powered Healthcare Monitoring Agent

### Hybrid RAG + Multi-Tool Agentic AI System

---

## 🔗 Resources

**GitHub Repository**  
https://github.com/Avi007-debug/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent  

**Deployed Frontend**  
https://team-agent-wars-healthcare-monitori.vercel.app/  

**RAG Assets (Latest Dataset & Vectors)**  
https://drive.google.com/file/d/1Dz0GfoIwkxKhK2sKMLt44T-mq1O8JYYL/view?usp=sharing  

**Backup Assets (Complete Pack)**  
https://drive.google.com/drive/folders/1fo36Ut4nIizYQ1d-kPb-TOKVRX6KJ7oK?usp=sharing

**Reference:** Jump directly to the dataset links: [Additional Dataset Sources](#additional-dataset-sources)

---

## 🎥 Demo & Presentation

**Demo Video**  
https://youtu.be/3GJy49wlnkY  

**Project PPT**  
https://drive.google.com/file/d/1FV4gSIygPek2aHYVoCHdu3ld-7O3HFlv/view?usp=sharing  

---

## 📌 Project Overview

This project implements an AI-powered healthcare assistant using a Retrieval-Augmented Generation (RAG) architecture combined with an agent-based system.

The system is designed to provide accurate, evidence-based medical information by retrieving knowledge from curated healthcare datasets instead of relying purely on generative outputs.

It supports user queries related to:

- Drugs and medications
- Diseases and symptoms
- Nutrition and diet
- Medical guidelines and lifestyle advice

The assistant follows an agentic workflow where it can:

- retrieve grounded medical knowledge
- route to specialized tools
- generate structured and safer responses

---

## 🎯 Objectives

- Build a reliable medical knowledge retrieval system
- Minimize hallucinations using RAG-based grounding
- Implement tool-calling AI agents
- Provide context-aware responses with conversation memory
- Keep architecture modular and deployment-friendly

---

## 🚀 Key Features

### 🔹 Core

- Hybrid RAG system (FAISS + BM25)
- Cross-encoder reranking for relevance boost
- Entity detection and metadata-aware filtering
- Safety checks for unknown / irrelevant queries
- Tool-first routing for interaction, risk, reminder, and alerts
- Structured medical response generation

### 🔹 Advanced

- FastAPI backend with REST endpoints
- React frontend with 3-page website (Home, Chat, About)
- Role-aware requests (`user` / `doctor`)
- Chat/history endpoints (`/history` GET, `/clear` DELETE)
- Branding support (logo integration, favicon set, web manifest)

---

## 🧠 System Architecture

```text
User Query
    ↓
Frontend (React)
    ↓
FastAPI API Layer
    ↓
Medical Agent Controller
    ↓
Tool Routing (if tool-intent)
    ↓                    ↘
Hybrid Retrieval          Tool Execution
(FAISS + BM25)            (interaction / risk / alert / reminder)
    ↓
Cross-Encoder Reranking
    ↓
Grounded Response + Safety Check
    ↓
Final Answer
```

---

## 🔍 RAG Pipeline

The backend uses a hybrid retrieval stack with the following stages:

1. Document processing and normalization
- dataset cleanup and metadata alignment (`type`, `name`, `section`, `text`)

2. Embeddings
- model: `sentence-transformers/all-MiniLM-L6-v2`
- vector size: 384

3. Vector search
- FAISS for semantic nearest-neighbor retrieval

4. Lexical search
- BM25 for keyword relevance reinforcement

5. Candidate fusion
- merge semantic + lexical candidates with metadata boosts

6. Reranking
- model: `cross-encoder/ms-marco-MiniLM-L-6-v2`

7. Safety guard
- Knowledge checks to suppress unrelated answers

---

## 📚 Knowledge Sources

The system integrates multiple healthcare datasets:

| Dataset | Purpose |
| --- | --- |
| Drug Information | side effects, warnings, interactions |
| Disease Dataset | symptoms and treatment patterns |
| Nutrition Dataset | food and nutrient references |
| Guideline Dataset | prevention and lifestyle guidance |

Note: source acquisition includes publicly available medical/open datasets and curated processing scripts in `backend/Scripts/`.

### Official Dataset and Reference Links

- OpenFDA drug label download (CSV/JSON bundles): https://open.fda.gov/apis/drug/label/download/
- Kaggle — Disease Symptoms and Treatments dataset: https://www.kaggle.com/datasets/snmahsa/disease-symptoms-and-treatments-dataset?resource=download
- Kaggle — Foods & Nutrition dataset: https://www.kaggle.com/datasets/adarshzolekar/foods-nutrition-dataset
- WHO publications / synthetic guideline sources: https://www.who.int/publications

### Additional Dataset Sources

- OpenFDA Drug Label Dataset: https://open.fda.gov/data/drug/label/
- Kaggle Disease-Symptom Description Dataset: https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset
- USDA FoodData Central (official nutrition reference): https://fdc.nal.usda.gov/
- WHO Health Topics and Guidelines: https://www.who.int/health-topics
- CDC Health Topics and Guidance: https://www.cdc.gov/
---

## 📊 Dataset Statistics

- Current indexed chunks are in the 23k-25k range depending on the loaded asset bundle.
- Main categories:
  - Drugs
  - Diseases
  - Nutrition
  - Guidelines

Example RAG entry:

```json
{
  "type": "drug",
  "name": "Hydrocortisone",
  "section": "side_effects",
  "text": "Fluid retention, hypertension, muscle weakness may occur."
}
```

### Week-8 Snapshot

- Raw chunks processed: ~25,853
- Cleaned/usable chunks: ~23,455
- Indexed categories: drugs, diseases, nutrition, guidelines

---

## 🧪 Evaluation Snapshot

The current retrieval evaluation setup tracks:

- Top-1 Accuracy
- Hit@k Accuracy

Latest recorded benchmark summary:

- Top-1: 1.00
- Hit@k: 1.00

---

## ⚙️ Tech Stack

### AI / ML

- Sentence Transformers
- Cross-Encoder reranker
- Scikit-learn
- NumPy
- Pandas

### Retrieval

- FAISS
- BM25 (`rank-bm25`)

### Backend

- Python
- FastAPI
- Uvicorn

### Frontend

- React + Vite
- TypeScript (main frontend)
- Framer Motion / UI utilities

---

## 🧰 Tools Implemented

- Drug Interaction Checker
- Medication Reminder Tool
- Health Risk Predictor
- Real-time Alert System (BP / heart-rate based)
- Health insight utilities in response flow

---

## 📂 Project Structure (Verified)

```text
Team_Agent_Wars_Healthcare-Monitoring-AI-Agent/
│
├── .venv/
├── backend/
│   ├── agent/
│   ├── retrieval/
│   ├── tools/
│   ├── utils/
│   ├── tests/
│   ├── Scripts/
│   ├── docs/
│   ├── Datasets/
│   ├── api.py
│   ├── requirements.txt
│   ├── medical_rag_dataset.json
│   ├── medical_vector_db.faiss
│   ├── test_agent.py
│   └── test_retrieval.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── medical-frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── vercel.json
│   └── render.yaml
│
├── docs/
│   ├── references/
│   └── screenshots/
├── DEPLOYMENT.md
├── SETUP.md
├── TESTING.md
└── render.yaml
```

---

## ⚡ Installation

```bash
git clone https://github.com/Avi007-debug/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent.git
cd Team_Agent_Wars_Healthcare-Monitoring-AI-Agent
python -m venv .venv
```

Activate venv:

- Windows PowerShell: `./.venv/Scripts/Activate.ps1`
- macOS/Linux: `source .venv/bin/activate`

---

## ▶️ Running the Project

### Backend (FastAPI)

```bash
cd backend
../.venv/Scripts/python.exe -m pip install -r requirements.txt
../.venv/Scripts/python.exe -m uvicorn api:app --reload
```

Swagger docs:

- http://127.0.0.1:8000/docs

### Frontend (Main Website)

```bash
cd frontend
npm install
npm run dev
```

Frontend env setup (copy from `.env.example`):

```bash
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Main routes:

- `/` Home
- `/chat` Chat
- `/about` About

### Optional Secondary Frontend

```bash
cd frontend/medical-frontend
npm install
npm run dev
```

---

## 🧪 Example Queries

- What are side effects of hydrocortisone?
- Symptoms of diabetes
- Nutrition in pea curry
- How to reduce blood pressure?
- Drug interaction aspirin ibuprofen
- Risk for age 55 bp 160

---

## ✅ API Endpoints

- `GET /health`
- `POST /ask`
- `POST /predict`
- `POST /interaction`
- `GET /history`
- `DELETE /clear`
- `GET /profile`
- `PUT /profile`

Additional auth and persistence stack:

- Supabase Auth (email/password)
- Supabase table `chat_history` for chat persistence

Sample `/ask` payload:

```json
{
  "query": "symptoms of diabetes",
  "role": "user"
}
```

---

## 🛡️ Disclaimer

This system is for educational and informational purposes only.
It is not a substitute for professional medical advice, diagnosis, or treatment.

---

## 🗄️ Supabase Setup (Frontend Auth + Chat Persistence)

1. Create a Supabase project at https://supabase.com
2. Save project values:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
3. Run the SQL script from [supabase_chat_history.sql](file:///c:/Coding/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent/backend/docs/supabase_chat_history.sql) in your Supabase SQL editor. This unified script sets up:
   - `profiles` table: for user profile mapping (synced with triggers from auth.users).
   - `chat_history` table: with Row Level Security (RLS) to store user search interactions.
   - `reminders` table: with Row Level Security (RLS) to persist scheduled medication alarms.

4. Add frontend env vars in `frontend/.env` and restart Vite.

Current frontend enhancements:

- Login/Signup (email/password)
- Logout
- Save each `/ask` response to Supabase table
- Load previous history after login
- Clear chat button (also clears user history from Supabase)
- Loading indicators and inline error messages

---

## ✅ Backend Health Check

Run backend:

```bash
cd backend
uvicorn api:app --reload
```

Verify endpoints:

- `/ask`
- `/predict`
- `/interaction`

---

## 🌐 Deployment Notes

### Backend (Render / Railway)

Start command:

```bash
uvicorn api:app --host 0.0.0.0 --port 10000
```

### Frontend (Vercel)

Set env vars:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Current deployment state:

- ✅ Local deployment: stable and recommended for demos
- ⚠️ Render free-tier deployment: may fail for heavy workloads due to memory constraints

---

## 🧩 Final Implementation Highlights

- Production-style flow: Frontend -> FastAPI -> Agent System -> Hybrid RAG -> FAISS/Data -> Supabase
- Hybrid retrieval with FAISS + BM25 + cross-encoder reranking
- Multi-agent orchestration:
    - Retrieval Agent
    - Tool Agent
    - Response Agent
- Tooling includes interaction checks, risk prediction, alerts, and health insight generation
- Backend includes lazy loading, logging, and chat persistence APIs
- Frontend includes structured chat UX, auth flow, and persistent user history
- Supabase includes auth + RLS-backed persistence tables (`profiles`, `chat_history`)

---

## 🧪 End-to-End Test Flow

1. Sign up or log in
2. Ask a medical query
3. Confirm response appears
4. Reload page
5. Confirm previous chats load from Supabase
6. Click Clear Chat and confirm history is removed

Detailed test checklist is available in `TESTING.md`.

---

## 📦 Full Deployment Guide

Complete Render/Railway + Vercel deployment instructions are documented in `DEPLOYMENT.md`.

---

## 🔮 Future Improvements

- Voice-enabled interaction
- Better domain confidence and fallback calibration
- Enhanced role-adaptive response formatting
- Cloud vector store alternatives and async retrieval optimizations
- CI-integrated API regression tests

---

## 🏁 Final Outcome

This project delivers an end-to-end AI healthcare assistant combining:

- Hybrid RAG retrieval
- Agent-based tool routing
- Frontend + backend integration
- Deployment-ready modular architecture

---

## 📌 Built As Part Of

2-Month Agentic AI Internship Program
