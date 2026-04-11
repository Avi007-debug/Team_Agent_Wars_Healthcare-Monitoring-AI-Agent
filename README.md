# 🏥 AI-Powered Healthcare Monitoring Agent

### Hybrid RAG + Multi-Tool Agentic AI System

---

## Repository Links

GitHub: https://github.com/Avi007-debug/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent
Updated RAG assets pack (latest datasets + vector files): https://drive.google.com/file/d/1Dz0GfoIwkxKhK2sKMLt44T-mq1O8JYYL/view?usp=sharing
Backup/older complete RAG zip (datasets + final vector assets source): https://drive.google.com/file/d/1m-fUhmBdns8lD3BhdRqYpaclD7OXiSx/view?usp=sharing

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
- Chat history endpoints (`/history` GET/DELETE)
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
- no-knowledge checks to suppress unrelated answers

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

## 📂 Project Structure (Current)

```text
Team_Agent_Wars_Healthcare-Monitoring-AI-Agent/
│
├── backend/
│   ├── api.py
│   ├── requirements.txt
│   ├── test_agent.py
│   ├── test_retrieval.py
│   ├── agent/
│   ├── retrieval/
│   ├── tools/
│   ├── tests/
│   ├── interface/
│   ├── Scripts/
│   ├── docs/
│   ├── Datasets/
│   ├── medical_rag_dataset.json
│   └── medical_vector_db.faiss
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── src/                  # main 3-page website frontend
│   ├── public/               # logo + favicon + manifest assets
│   └── medical-frontend/     # secondary/legacy UI
│
├── docs/
├── SETUP.md
├── TESTING.md
├── DEPLOYMENT.md
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
- `DELETE /history`

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
