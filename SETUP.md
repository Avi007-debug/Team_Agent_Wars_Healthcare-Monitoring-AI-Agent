# Team Setup Guide

This guide helps teammates run the Medical RAG assistant locally.

Project repository: https://github.com/Avi007-debug/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent

Backup RAG assets (older zip with proper datasets and final vector files):
https://drive.google.com/file/d/1m-fUhmBdns8lD3BhdRqYpaclD7OXiSx/view?usp=sharing

## 1. Prerequisites

- Python 3.10 or 3.11
- pip
- Git

## 2. Clone Repository

```powershell
git clone https://github.com/Avi007-debug/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent.git
cd Team_Agent_Wars_Healthcare-Monitoring-AI-Agent
```

## 3. Create and Activate Virtual Environment

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

## 4. Install Dependencies

```powershell
cd RAG
pip install --upgrade pip
pip install -r requirements.txt
```

## 5. Confirm Required RAG Files

The following files are intentionally gitignored and should stay unchanged in local setups:

- `RAG/medical_rag_dataset.json`
- `RAG/medical_vector_db.faiss`
- `RAG/Datasets/`

If these are missing on a fresh clone:

1. Download and extract the backup zip from the Drive link above.
2. Copy the `Datasets/` folder to `RAG/Datasets/`.
3. Copy `medical_rag_dataset.json` to `RAG/medical_rag_dataset.json`.
4. Copy `medical_vector_db.faiss` to `RAG/medical_vector_db.faiss`.
5. Keep these files uncommitted (they are intentionally ignored).

## 6. Run Manual Test Suite

```powershell
python test_agent.py
```

This runs:
- default query checks from `RAG/tests/test_queries.txt`
- edge-case checks (`asdasdasd`, `unknown disease xyz`)
- interactive mode after automated checks

Manual validation checklist:

- disease query should return relevant symptoms/treatment
- drug side-effect query should return relevant drug section
- nutrition query should return relevant food/nutrition context
- interaction query should use the interaction tool output
- nonsense query should return safety fallback message

## 7. Launch Gradio UI

```powershell
python interface/app.py
```

Open the local URL shown in terminal.

## 8. Capture Demo Screenshot

1. Keep app running in browser.
2. Ask 2-3 queries (example: symptoms of diabetes, drug interaction aspirin ibuprofen).
3. Capture a screenshot showing both query and response.
4. Save it as `docs/screenshots/demo.png` in the repository root.
5. Add this snippet in `README.md` under Demo section:

```markdown
![Medical AI Assistant Demo](docs/screenshots/demo.png)
```

## 9. Troubleshooting

- If `faiss` install fails on Windows, re-run `pip install faiss-cpu==1.13.2` after upgrading pip.
- If model download is slow, wait for first run to cache `sentence-transformers` models.
- If import errors occur, ensure command is run from inside `RAG/`.

## 10. Suggested Team Workflow

1. Pull latest code.
2. Activate `.venv`.
3. Run `python test_agent.py` before pushing.
4. Keep gitignored datasets/vector DB unchanged unless a dedicated data update task is assigned.
