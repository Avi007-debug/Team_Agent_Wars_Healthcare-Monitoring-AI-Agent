# Team Agent Wars - Healthcare Monitoring AI Agent

A practical healthcare assistant built with Hybrid RAG (FAISS + BM25), cross-encoder reranking, and lightweight medical tools (drug interaction, reminder, risk checks).

## Repository Links

- GitHub: https://github.com/Avi007-debug/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent
- Backup/older complete RAG zip (datasets + final vector assets source): [https://drive.google.com/file/d/1m-fUhmBdns8lD3BhdRqYpaclD7OXiSx/view?usp=sharing](https://drive.google.com/file/d/1m-fUhm-Bdns8lD3BhdRqYpaclD7OXiSx/view?usp=drive_link)

## Current Structure

```text
Team_Agent_Wars_Healthcare-Monitoring-AI-Agent/
|-- docs/
|   |-- references/
|   |   |-- Medical-Knowledge-RAG-System.pdf
|   |   `-- RAG-Implementation-Link.pdf
|   `-- screenshots/
|-- RAG/
|   |-- .gitignore
|   |-- agent/
|   |-- interface/
|   |-- retrieval/
|   |-- tools/
|   |-- Scripts/
|   |-- tests/
|   |-- requirements.txt
|   |-- test_agent.py
|   `-- test_retrieval.py
|-- SETUP.md
`-- README.md
```

## Features

- Hybrid Retrieval (FAISS + BM25)
- Cross-Encoder Reranking
- AI Agent with Tool Integration
- Safety mechanism when no relevant knowledge is found
- Gradio chat interface for quick demo

## Data And Ignore Policy

The following items are intentionally ignored and should stay ignored:

- RAG/Datasets/
- RAG/medical_rag_dataset.json
- RAG/medical_vector_db.faiss

These assets are needed at runtime but should not be committed.

## Where To Restore Missing Data Files

If teammates clone fresh and do not have the data assets:

1. Download the backup zip from the Drive link above.
2. Copy these into the local RAG folder:
   - Datasets/ folder
   - medical_rag_dataset.json
   - medical_vector_db.faiss
3. Do not add these files to git.

## Quick Start

Use the full teammate setup instructions in SETUP.md.

## Remaining Steps For Team Submission

### 1. Run test flow

From inside RAG/:

```powershell
python test_agent.py
```

Verify outputs for:
- disease query -> relevant symptoms/treatment
- drug query -> side effects/interactions
- nutrition query -> relevant nutrition answer
- nonsense query -> safety fallback message
- interaction query -> tool response

Also verify edge cases:
- asdasdasd
- unknown disease xyz

Expected behavior: "No relevant medical information found." (or equivalent safe fallback)

### 2. Capture screenshot for demo

1. Start UI from RAG/:

```powershell
python interface/app.py
```

2. Open local Gradio URL shown in terminal.
3. Ask 2-3 good sample queries.
4. Capture screenshot showing:
   - title
   - query input
   - output response
5. Save screenshot to docs/screenshots/demo.png

### 3. Update README demo section (optional enhancement)

After saving screenshot, add this markdown snippet:

```markdown
## Demo

![Medical AI Assistant Demo](docs/screenshots/demo.png)
```

## Disclaimer

This project is for educational and informational use only, not a replacement for professional medical advice.
