from fastapi import FastAPI
from pydantic import BaseModel

from agent.medical_agent import medical_agent
from tools.drug_interaction_tool import check_drug_interaction
from tools.health_predictor import predict_health_risk

app = FastAPI(title="AI Medical Assistant API", version="1.0.0")


class QueryRequest(BaseModel):
	query: str


class PredictRequest(BaseModel):
	age: int
	bp: int


class InteractionRequest(BaseModel):
	drug1: str
	drug2: str


@app.get("/health")
def health_check():
	return {"status": "ok"}


@app.post("/ask")
def ask(req: QueryRequest):
	response = medical_agent(req.query)
	return {"response": response}


@app.post("/predict")
def predict(req: PredictRequest):
	result = predict_health_risk(req.age, req.bp)
	return {"prediction": result}


@app.post("/interaction")
def interaction(req: InteractionRequest):
	result = check_drug_interaction(req.drug1, req.drug2)
	return {"interaction": result}
