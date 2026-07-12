from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
import os
import threading
import asyncio
from supabase import create_client, Client
from utils.download import download_file
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
	supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAISS_PATH = os.path.join(BASE_DIR, "medical_vector_db.faiss")
DATA_PATH = os.path.join(BASE_DIR, "medical_rag_dataset.json")

FAISS_URL = "https://drive.google.com/uc?id=1B4TMBckUt_fgnaV9GrjmAlDrvUikB2Hg"
DATA_URL = "https://drive.google.com/uc?id=1JrCN_UG_4bJht6NbzQe3_a3ytqi3dXAG"

medical_agent = None
check_drug_interaction = None
predict_health_risk = None


def load_medical_agent():
	global medical_agent
	if medical_agent is None:
		from agent.medical_agent import medical_agent as ma
		medical_agent = ma
	return medical_agent


def load_drug_tool():
	global check_drug_interaction
	if check_drug_interaction is None:
		from tools.drug_interaction_tool import check_drug_interaction as cdi
		check_drug_interaction = cdi
	return check_drug_interaction


def load_predictor():
	global predict_health_risk
	if predict_health_risk is None:
		from tools.health_predictor import predict_health_risk as phr
		predict_health_risk = phr
	return predict_health_risk

app = FastAPI(title="AI Medical Assistant API", version="2.0.0")

@app.on_event("startup")
def startup_event():
	print("🚀 Application starting up...")
	
	# 1. Download resources if missing (works locally & on Render)
	download_file(FAISS_URL, FAISS_PATH)
	download_file(DATA_URL, DATA_PATH)
	
	# 2. Trigger background warmup of heavy models
	from retrieval.hybrid_retriever import warmup_models
	threading.Thread(target=warmup_models, daemon=True).start()

def _get_allowed_origins() -> list[str]:
	configured = os.getenv("CORS_ALLOW_ORIGINS", "")
	if configured.strip():
		return [o.strip() for o in configured.split(",") if o.strip()]

	return [
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"https://team-agent-wars-healthcare-monitori.vercel.app",
		"http://localhost:8080",
	]


# --------------- CORS ---------------
app.add_middleware(
	CORSMiddleware,
	allow_origins=_get_allowed_origins(),
	allow_origin_regex=r"https://.*\.vercel\.app",
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# --------------- Models ---------------
class QueryRequest(BaseModel):
	query: str
	role: str = "user"
	user_id: str | None = None
	session_id: str | None = None
	history: list[dict] | None = None


class PredictRequest(BaseModel):
	age: int
	bp: int


class ProfileUpdateRequest(BaseModel):
	user_id: str
	name: str | None = None
	phone: str | None = None


class InteractionRequest(BaseModel):
	drug1: str
	drug2: str


# --------------- Endpoints ---------------
@app.get("/health")
def health_check():
	return {"status": "ok"}


@app.post("/ask")
async def ask(req: QueryRequest):
	def run_pipeline():
		agent = load_medical_agent()
		
		# Resolve memory either from client-provided history or from Supabase fallback
		memory = []
		if req.history is not None:
			memory = [{"user": m.get("user", ""), "assistant": m.get("assistant", m.get("bot", ""))} for m in req.history[-12:]]
		elif supabase and req.user_id:
			try:
				res = supabase.table("chat_history") \
					.select("query, response") \
					.eq("user_id", req.user_id) \
					.order("created_at", desc=True) \
					.limit(12) \
					.execute()
				db_history = res.data[::-1]
				memory = [{"user": m["query"], "assistant": m["response"]} for m in db_history]
			except Exception as e:
				print("❌ Supabase history fetch failed:", e)

		# Extract main medical entity keyword
		detected_keyword = None
		try:
			from retrieval.hybrid_retriever import detect_entity, get_data_and_indices
			_, _, ent_idx, _ = get_data_and_indices()
			detected_keyword = detect_entity(req.query, ent_idx)
		except Exception as ex:
			print("⚠️ Could not detect keyword:", ex)

		if supabase and req.user_id:
			session_name = detected_keyword or req.query
			session_name = " ".join(w.capitalize() for w in (session_name or "").split())
			if len(session_name) > 30:
				session_name = session_name[:27] + "..."

			try:
				supabase.table("chat_history").insert({
					"user_id": req.user_id,
					"session_id": req.session_id or "00000000-0000-0000-0000-000000000000",
					"query": req.query,
					"response": response,
					"session_name": session_name
				}).execute()
				print("✅ Chat saved to Supabase (with session_name)")
			except Exception as e:
				try:
					supabase.table("chat_history").insert({
						"user_id": req.user_id,
						"session_id": req.session_id or "00000000-0000-0000-0000-000000000000",
						"query": req.query,
						"response": response
					}).execute()
					print("✅ Chat saved to Supabase (without session_name fallback)")
				except Exception as ex:
					print("❌ Supabase insert failed:", ex)

		return {"response": response, "keyword": detected_keyword}

	try:
		result = await asyncio.to_thread(run_pipeline)
		return {"response": result.get("response"), "keyword": result.get("keyword"), "role": req.role}
	except Exception as e:
		return {"error": str(e)}


@app.get("/history")
async def get_history(user_id: str):
	if not supabase:
		return {"data": []}
	try:
		res = supabase.table("chat_history") \
			.select("*") \
			.eq("user_id", user_id) \
			.order("created_at", desc=False) \
			.execute()
		return {"data": res.data}
	except Exception as e:
		return {"error": str(e)}


@app.delete("/clear")
async def clear_history(user_id: str):
	if not supabase:
		return {"status": "cleared"}
	try:
		supabase.table("chat_history") \
			.delete() \
			.eq("user_id", user_id) \
			.execute()
		return {"status": "cleared"}
	except Exception as e:
		return {"error": str(e)}


@app.get("/profile")
async def get_profile(user_id: str):
	if not supabase:
		return {}
	try:
		res = supabase.table("profiles") \
			.select("*") \
			.eq("id", user_id) \
			.single() \
			.execute()
		return res.data
	except Exception as e:
		return {"error": str(e)}


@app.put("/profile")
async def update_profile(req: ProfileUpdateRequest):
	if not supabase:
		return {}
	try:
		data_to_update = {}
		if req.name is not None:
			data_to_update["name"] = req.name
		if req.phone is not None:
			data_to_update["phone"] = req.phone
		
		if not data_to_update:
			return {"status": "no data to update"}

		res = supabase.table("profiles") \
			.update(data_to_update) \
			.eq("id", req.user_id) \
			.execute()
		return {"status": "updated", "data": res.data}
	except Exception as e:
		return {"error": str(e)}


@app.post("/predict")
def predict(req: PredictRequest):
	predictor = load_predictor()
	result = predictor(req.age, req.bp)
	return {"prediction": result}


@app.post("/interaction")
def interaction(req: InteractionRequest):
	tool = load_drug_tool()
	result = tool(req.drug1, req.drug2)
	return {"interaction": result}

@app.get("/")
def health():
    return {"status": "ok"}