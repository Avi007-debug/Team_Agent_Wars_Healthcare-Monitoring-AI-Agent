from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone

from agent.medical_agent import medical_agent
from tools.drug_interaction_tool import check_drug_interaction
from tools.health_predictor import predict_health_risk

app = FastAPI(title="AI Medical Assistant API", version="2.0.0")

# --------------- CORS ---------------
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# --------------- In-memory chat log ---------------
chat_history: list[dict] = []


# --------------- Models ---------------
class QueryRequest(BaseModel):
	query: str
	role: str = "user"


class PredictRequest(BaseModel):
	age: int
	bp: int


class InteractionRequest(BaseModel):
	drug1: str
	drug2: str


# --------------- Endpoints ---------------
@app.get("/health")
def health_check():
	return {"status": "ok"}


@app.post("/ask")
def ask(req: QueryRequest):
	memory = [{"user": m["user"], "assistant": m["bot"]} for m in chat_history[-12:]]
	response = medical_agent(req.query, conversation_memory=memory)

	chat_history.append({
		"user": req.query,
		"bot": response,
		"role": req.role,
		"created_at": datetime.now(timezone.utc).isoformat(),
	})

	return {"response": response, "role": req.role}


@app.get("/history")
def get_history():
	return {"history": chat_history}


@app.delete("/history")
def clear_history():
	chat_history.clear()
	return {"status": "cleared"}


@app.post("/predict")
def predict(req: PredictRequest):
	result = predict_health_risk(req.age, req.bp)
	return {"prediction": result}


@app.post("/interaction")
def interaction(req: InteractionRequest):
	result = check_drug_interaction(req.drug1, req.drug2)
	return {"interaction": result}
