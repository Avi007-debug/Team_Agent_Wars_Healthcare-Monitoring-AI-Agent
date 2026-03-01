# AI-Powered Healthcare Monitoring Agent using RAG and Multi-Tool Agentic Workflow

A production-oriented agentic system combining retrieval-augmented generation (RAG), specialized health tools, and multi-step agent workflows to provide contextual, explainable, and actionable health guidance. Built to support monitoring, triage, and patient-facing assistance with engineering-grade architecture suitable for iterative development and deployment.

## Project Overview
- **Motivation:** Provide proactive, context-aware healthcare assistance that integrates clinical knowledge retrieval, tool execution, and predictive models.
- **Problem statement:** Traditional health-tracking apps collect metrics but rarely combine up-to-date clinical guidance, drug-interaction checks, and predictive risk scoring in a single agentic loop.
- **Differentiator:** The system uses agentic orchestration plus RAG to dynamically select tools, ground responses in evidence, and generate traceable outputs—minimizing hallucinations and improving clinical relevance versus single-step LLM replies.

## Key Features

### Track A (Core Agent Features)
- Conversational triage and intent detection
- Medication reminders (schedule/manage)
- Drug-interaction checking with citations
- Lightweight ML-based risk scoring
- Health report generation (PDF/HTML)
- Local persistence and session memory (SQLite)
- Fully open-source, zero-cost Track A stack

### Track B (Advanced Production Features)
- Production-grade PostgreSQL multi-tenant schema
- Real-time vitals ingestion and streaming alerts
- Audit trails and provenance for recommendations
- Role-based access control and compliance patterns
- Kubernetes/cloud deployment with observability
- React-based dashboard and mobile-ready UI

## System Architecture
- **Interface Layer:** Gradio (Track A) or React (Track B) frontends; session handling and lightweight auth.
- **Agent Layer:** Orchestrates intent classification, tool-selection policy, multi-step planning, and safety checks.
- **RAG Layer:** Document loaders, chunking, embeddings, and vector search for evidence retrieval.
- **Tool Layer:** Encapsulated utilities (Medication Reminder, Drug Interaction Checker, Risk Predictor, Report Generator) exposed to the agent.
- **Database Layer:** User profiles, memory, logs, and tool outputs. SQLite for Track A; PostgreSQL for Track B.

## Agent Workflow
1. **Intent detection:** Classify user request (reminder, interaction check, risk assessment, report, general question).
2. **Tool selection:** Policy decides which tool(s) to call using heuristics and few-shot guidance.
3. **RAG retrieval:** Retrieve relevant documents/snippets from the vector DB when grounding is required.
4. **Response generation:** LLM composes a grounded response using retrieved evidence and tool outputs; response includes provenance.
5. **Memory update:** Persist scheduling, confirmations, and relevant outputs to the memory DB for future context and audit.

## Tools Implemented
- **Medication Reminder Tool:** Create/modify/cancel schedules; local scheduler with integration hooks for email/SMS.
- **Drug Interaction Checker:** Query an offline, indexed reference; returns severity, actions, and citations.
- **Health Risk Predictor (ML-based):** scikit-learn prototype that returns risk probabilities and contributing factors.
- **Health Report Generator:** Consolidates signals, agent decisions, and RAG evidence into downloadable summaries.

## RAG Pipeline
- **Document loading:** Ingest clinical guidelines, drug monographs, user records, and SOPs in structured formats.
- **Chunking:** Overlap-aware splitting (e.g., 500–1,000 token chunks with ~20% overlap) to preserve context.
- **Embeddings:** Use Sentence-Transformers to encode chunks into dense vectors.
- **FAISS vector DB:** Local FAISS index for fast nearest-neighbor retrieval (Track A); prepared for managed vector DB in Track B.
- **Retrieval injection:** Inject top-k retrieved snippets (with source metadata and scores) into LLM prompts for grounded generation.

## Tech Stack
- **Development:** Google Colab (Phase 1), VS Code (Phase 2)
- **AI & Orchestration:** LangChain, HuggingFace LLM (configurable)
- **RAG:** FAISS, Sentence-Transformers
- **ML:** scikit-learn, pandas
- **Database:** SQLite (Track A), PostgreSQL (Track B)
- **Backend:** FastAPI
- **Frontend:** Gradio (Track A), React (Track B)

Note: The Track A stack is fully open-source and zero cost.

## Installation Instructions (Track A)
1. Clone the repository and change into the project directory:

```powershell
git clone https://github.com/<your-org>/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent.git
cd Team_Agent_Wars_Healthcare-Monitoring-AI-Agent
```

2. Create and activate a Python virtual environment (Windows PowerShell):

```powershell
python -m venv .venv
.venv\\Scripts\\Activate.ps1
```

3. Install dependencies:

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

4. Run the backend and UI (example):

```powershell
uvicorn app.main:app --reload
# In another terminal, start the Gradio UI
python app/ui/gradio_app.py
```

Notes:
- Configure runtime variables (model keys, paths, scheduling) via a `.env` file.
- Defaults are configured for local operation using SQLite and FAISS.

## Project Structure
```
├── backend/                     # FastAPI backend and agent runtime
│   ├── api/                     # HTTP endpoints and routers
│   ├── agents/                  # Agent orchestration, policies, tool wiring
│   ├── tools/                   # Tool implementations (reminder, checker, predictor, report)
│   ├── rag/                     # Document loaders, chunking, embeddings, FAISS index
│   ├── models/                  # ML training, model artifacts and serializers
│   ├── db/                      # Database schemas, migrations (SQLite/Postgres adapters)
│   └── scripts/                 # Backend utilities (ingest, indexing, maintenance)
├── frontend/                    # UI codebases
│   ├── gradio/                  # Track A quick demo apps and prototypes
│   └── react/                   # Track B production dashboard (React app)
├── data/                        # Sample datasets, clinical references, and fixtures
├── docs/                        # Architecture diagrams, API contracts, onboarding guides
├── tests/                       # Unit and integration tests for backend and frontend
├── requirements.txt             # Python dependencies for Track A
├── docker/                      # Dockerfiles and compose for local/dev environments
└── README.md
```

## Future Improvements
- Voice-based health queries (speech-to-text + TTS)
- Real-time monitoring and streaming alert pipelines
- Image-based pill detection and verification
- Cloud deployment with managed vector DB and model hosting
- Expanded evidence sources and clinical API integrations
- Explainability tooling (SHAP-style explanations for ML models)

## Disclaimer
This system is for informational purposes only and is not a substitute for professional medical advice.

Built as part of a 2-month Agentic AI Internship Program.
