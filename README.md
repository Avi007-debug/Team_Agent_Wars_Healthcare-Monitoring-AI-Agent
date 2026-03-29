# Team Agent Wars - Healthcare Monitoring AI Agent

A practical healthcare assistant built with Hybrid RAG (FAISS + BM25), cross-encoder reranking, and lightweight medical tools (drug interaction, reminder, risk checks).

## Repository Links

- GitHub: https://github.com/Avi007-debug/Team_Agent_Wars_Healthcare-Monitoring-AI-Agent
- Backup/older complete RAG zip (datasets + final vector assets source): https://drive.google.com/file/d/1m-fUhmBdns8lD3BhdRqYpaclD7OXiSx/view?usp=sharing

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

## Demo Day Runbook

Run from inside RAG/ after activating .venv.

```powershell
python test_agent.py
python tests/evaluation.py
python interface/app.py
```

Suggested demo query set:

1. symptoms of diabetes
2. side effects of aspirin
3. nutrition in rice
4. drug interaction aspirin ibuprofen
5. blood pressure 160 diet score 3

## Multi-Agent Flow (Week-5)

Current request handling pipeline:

1. medical_agent in RAG/agent/medical_agent.py receives user query.
2. tool_agent in RAG/agent/tool_agent.py checks tool-intent first:
   - drug interaction tool
   - reminder tool
   - risk predictor
   - health analytics (bp/diet)
3. If no tool path matches, rag_qa answer flow runs:
   - retrieval_agent retrieves top docs
   - response_agent builds structured answer
   - health_insights appends insight signals

This gives modular behavior suitable for demos and future scaling.

## Testing Next Steps

Use this checklist before demo, submission, or merge:

1. Run python test_agent.py and confirm:
   - structured sections: Symptoms, Treatment, Additional Info
   - insights section appears at end
   - unknown queries return safe fallback
2. Run python tests/evaluation.py and verify retrieval logs:
   - [LOG] Query lines are printed
   - returned name/section pairs are medically relevant
3. Validate tool paths manually:
   - interaction query triggers drug tool
   - reminder query triggers reminder tool
   - risk query with age + bp triggers risk predictor
   - bp/diet query triggers health analytics tool
4. UI smoke test:
   - launch python interface/app.py
   - test at least 5 consecutive chat turns
   - confirm clear button resets chat state
5. Optional data-quality refresh:
   - run Scripts/build_medical_vector_db.py when datasets change
   - confirm duplicate cleanup and short-text filtering in build output

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
