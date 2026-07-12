# Guide: GCP Cloud Run Deployment & Local LLM (Ollama) Integration

This guide provides step-by-step instructions for:
1. Containerizing and deploying the FastAPI backend to Google Cloud Platform (GCP) Cloud Run.
2. Installing, running, and coding a local Ollama LLM intent classifier to route user queries.

---

## ☁️ Part 1: GCP Cloud Run Backend Deployment

Google Cloud Run is the recommended platform for your serverless backend. It scales to zero when inactive (reducing cost to $0) and accommodates containerized python environments easily.

### Prerequisites:
* A Google Cloud Project with Billing Enabled (free tier credits cover this).
* [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) installed and authenticated.
* Docker installed locally.

### Step 1: Enable GCP Services & Authenticate
Open your terminal and run:
```bash
# 1. Login to your Google account
gcloud auth login

# 2. Select your active GCP project
gcloud config set project <YOUR_PROJECT_ID>

# 3. Enable Artifact Registry & Cloud Run APIs
gcloud services enable artifactregistry.googleapis.com run.googleapis.com
```

### Step 2: Set Up Artifact Registry
Create a repository to host your Docker container:
```bash
# Create repository in Artifact Registry
gcloud artifacts repositories create medassist-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="MedAssist backend docker registry"
```

Configure Docker to authenticate with GCP registry:
```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Step 3: Build & Cache Model Weights
To prevent cold-starts from timing out, your Dockerfile pre-downloads the Hugging Face model weights (`all-MiniLM-L6-v2` and `ms-marco-MiniLM-L-6-v2`) on build using `cache_models.py`.

Build the image locally:
```bash
# Build the container image
docker build -t us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/medassist-repo/medassist-backend:latest ./backend
```

### Step 4: Push to Google Artifact Registry
```bash
docker push us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/medassist-repo/medassist-backend:latest
```

### Step 5: Deploy to Cloud Run
Deploy the container with 2 CPU and 2Gi Memory (required to hold embedding weights in RAM):
```bash
gcloud run deploy medassist-backend \
  --image=us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/medassist-repo/medassist-backend:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --set-env-vars=SUPABASE_URL="https://your-project.supabase.co",SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```
Once deployed, Cloud Run will print your public HTTPS URL (e.g. `https://medassist-backend-xxxxxx-uc.a.run.app`). Update `VITE_API_URL` in your frontend `.env` to point to this new URL.

---

## 🦙 Part 2: Local LLM (Ollama) Intent Routing

Instead of hardcoded regex patterns, you can use a local LLM running via Ollama to determine the intent of the user's query (`set_reminder`, `medical_query`, `drug_interaction`, `health_risk`, `chitchat`) and route it to the correct retrieval index or alarm tool.

### Step 1: Install and Run Ollama
1. Download Ollama from [ollama.com](https://ollama.com).
2. Start the Ollama desktop application (running locally on port `11434`).
3. Open a shell and download a lightweight, instruction-tuned LLM (e.g. Gemma 2B or Llama 3B):
   ```bash
   ollama pull gemma2:2b
   ```

### Step 2: Implement the Intent Router in Python
Create/update an intent classifier file, e.g. `backend/agent/intent_router.py`:

```python
import requests
import re

OLLAMA_URL = "http://localhost:11434/api/generate"

def classify_intent_with_ollama(query: str) -> str:
    """
    Invokes the local Ollama LLM to classify user queries into medical intents.
    """
    prompt = f"""
    You are a classification assistant. Classify the user query into exactly one of these intents:
    
    Intents:
    - set_reminder (user wants to schedule/set a medication alarm/reminder, e.g., "remind me to take Lipitor at 8am")
    - list_reminders (user wants to view/show/list active alarms, e.g., "show alarms", "list reminders")
    - drug_interaction (user asks for conflicts/interactions between two drugs, e.g., "aspirin and ibuprofen")
    - health_risk (user asks for blood pressure checks or health risk warnings, e.g., "bp 160", "risk check age 55")
    - medical_query (user is asking about symptoms, treatments, prevention, nutrition, e.g., "symptoms of Gestational Cholestasis")
    - chitchat (simple greetings, hello, hi, how are you, or conversational pleasantries)

    Do not output any explanation. Only output the exact name of the intent.

    Query: "{query}"
    Intent:"""

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": "gemma2:2b",
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.0  # Force deterministic output
            }
        }, timeout=4.0)
        
        intent = response.json().get("response", "").strip().lower()
        
        # Validate output matches one of our presets
        for possible in ["set_reminder", "list_reminders", "drug_interaction", "health_risk", "medical_query", "chitchat"]:
            if possible in intent:
                return possible
                
        return "medical_query"  # Fallback if LLM output is ambiguous
        
    except Exception as e:
        print(f"⚠️ Ollama offline. Falling back to regex router. Error: {e}")
        return fallback_regex_routing(query)

def fallback_regex_routing(query: str) -> str:
    """
    Fallback regex patterns if local Ollama server is offline.
    """
    q = query.lower()
    if "interaction" in q:
        return "drug_interaction"
    if any(k in q for k in ["show alarms", "list reminders", "my reminders", "view reminders"]):
        return "list_reminders"
    if "remind" in q:
        return "set_reminder"
    if any(k in q for k in ["bp", "blood pressure", "risk"]):
        return "health_risk"
    if q.strip() in ["hi", "hello", "hey", "howdy"]:
        return "chitchat"
    return "medical_query"
```

### Step 3: Wire it into `medical_agent.py`
Open `backend/agent/medical_agent.py` and modify the routing path:

```python
from agent.rag_qa import answer_query
from agent.tool_agent import tool_agent
from agent.intent_router import classify_intent_with_ollama

def medical_agent(query, conversation_memory=None, user_id=None, role="user"):
    q = (query or "").lower().strip()
    if not q:
        return "Please enter a medical question or command. Example: symptoms of diabetes."

    # 1. Use Local LLM to classify intent
    intent = classify_intent_with_ollama(query)
    
    # 2. Route based on classification
    if intent == "chitchat":
        return "Hello! I am your clinical assistant. How can I help you today?"
        
    if intent in ["set_reminder", "list_reminders", "drug_interaction", "health_risk"]:
        # Execute tool-specific pipeline
        tool_result = tool_agent(query, user_id=user_id)
        if tool_result:
            return tool_result

    # 3. Fallback to clinical RAG retrieval for medical inquiries
    return answer_query(query, conversation_memory=conversation_memory, role=role)
```
