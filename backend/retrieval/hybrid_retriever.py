import json
import time
from pathlib import Path
import faiss
import numpy as np
import re

# We will lazy-load sentence_transformers to speed up import and fast-boot
# from sentence_transformers import SentenceTransformer
# from sentence_transformers import CrossEncoder
from rank_bm25 import BM25Okapi

BASE_DIR = Path(__file__).resolve().parent.parent
INDEX_PATH = BASE_DIR / "medical_vector_db.faiss"
DATASET_PATH = BASE_DIR / "medical_rag_dataset.json"

_embedding_model = None
_reranker = None
_index = None
_data = None
_entity_index = None
_bm25 = None
_corpus = None

def get_embedding_model():
	global _embedding_model
	if _embedding_model is None:
		print("⚡ Loading embedding model...")
		from sentence_transformers import SentenceTransformer
		_embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
	return _embedding_model

def get_reranker():
	global _reranker
	if _reranker is None:
		print("⚡ Loading cross-encoder reranker...")
		from sentence_transformers import CrossEncoder
		_reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
	return _reranker

def get_data_and_indices():
	global _index, _data, _entity_index, _bm25, _corpus
	if _index is None:
		print("🚀 Loading core FAISS index & dataset...")
		_index = faiss.read_index(str(INDEX_PATH))

		with open(DATASET_PATH, "r", encoding="utf-8") as f:
			_data = json.load(f)

		print(f"✅ Loaded dataset: {len(_data)} docs")

		print("🚀 Building entity index...")
		_entity_index = {}
		for i, doc in enumerate(_data):
			name = doc.get("name", "").lower()
			if name:
				_entity_index.setdefault(name, []).append(i)

		print("🚀 Building BM25 index...")
		_corpus = []
		for doc in _data:
			text = doc["text"]
			name = doc.get("name", "")
			combined = name + " " + text
			_corpus.append(tokenize(combined))
		
		_bm25 = BM25Okapi(_corpus)
		print("✅ Core loading complete.")

	return _index, _data, _entity_index, _bm25

def warmup_models():
	print("🔥 Warming up models & indexes...")
	get_data_and_indices()
	get_embedding_model()
	get_reranker()
	print("🔥 Warmup complete")

def tokenize(text):
	return re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())


# ---------------------------------------------------
# Keyword extraction
# ---------------------------------------------------

def extract_keywords(query):
	return set(tokenize(query))


# ---------------------------------------------------
# Domain detection
# ---------------------------------------------------

def detect_domain(query):

	q = query.lower()

	if "symptom" in q or "disease" in q:
		return "disease"

	if "treatment" in q:
		return "disease"

	if "drug" in q or "side effect" in q or "warning" in q or "interaction" in q:
		return "drug"

	if "food" in q or "nutrition" in q or "diet" in q:
		return "nutrition"

	if "prevent" in q or "guideline" in q or "advice" in q:
		return "guideline"

	return None


# ---------------------------------------------------
# Section detection
# ---------------------------------------------------

def detect_section(query):

	q = query.lower()

	if "warning" in q:
		return "warnings"

	if "side effect" in q:
		return "side_effects"

	if "interaction" in q:
		return "drug_interactions"

	if "purpose" in q or "use" in q:
		return "purpose"

	if "symptom" in q:
		return "symptoms"

	if "treatment" in q:
		return "treatment"

	return None


# ---------------------------------------------------
# Entity detection
# ---------------------------------------------------

def detect_entity(query, entity_idx):

	q = query.lower()
	q_terms = set(re.findall(r"[a-z0-9]+", q))
	generic_terms = {
		"symptom", "symptoms", "disease", "treatment", "drug", "drugs",
		"interaction", "interactions", "warning", "warnings", "purpose",
		"nutrition", "food", "diet", "guideline", "guidelines", "prevention",
		"side", "effects", "effect", "risk", "for", "and", "the", "with", "about", "unknown"
	}
	query_entity_terms = {w for w in q_terms if w not in generic_terms}
	if not query_entity_terms:
		query_entity_terms = q_terms

	best_name = None
	best_overlap = 0

	for name in entity_idx.keys():

		if name in q:
			return name

		if len(q) >= 6 and q in name:
			return name

		name_terms = set(re.findall(r"[a-z0-9]+", name))
		overlap = len(query_entity_terms.intersection(name_terms))

		if overlap >= 1 and overlap > best_overlap:
			best_name = name
			best_overlap = overlap

	if best_name:
		return best_name

	return None


# ------------------- NEW FEATURE -------------------
# Query Normalization & No Knowledge Detection
# ---------------------------------------------------

def normalize_medical_query(query):
	q = (query or "").lower().strip()
	
	# Normalize common typos
	q = re.sub(r"\bliptior\b", "lipitor", q)
	
	# Normalize side-effects / sideeffects / effects variations
	q = re.sub(r"\bsideeffects\b", "side effects", q)
	q = re.sub(r"\bside-effects\b", "side effects", q)
	
	# If they ask 'effects of X' or 'what are the effects of X', map to 'side effects of X'
	if "effects of" in q and "side effects" not in q:
		q = q.replace("effects of", "side effects of")
		
	# Normalize other medical term combinations
	q = re.sub(r"\bbloodpressure\b", "blood pressure", q)
	q = re.sub(r"\bheartrate\b", "heart rate", q)
	q = re.sub(r"\bdruginteraction\b", "drug interaction", q)
	q = re.sub(r"\bmatarkisabzi\b", "matar ki sabzi", q)
	
	return q


def no_knowledge_check(query, docs):
	normalized_query = normalize_medical_query(query)
	
	# Check if the query mentions any known entity in our database index
	idx, dat, ent_idx, b25 = get_data_and_indices()
	entity = detect_entity(normalized_query, ent_idx)
	
	if not entity:
		return True
		
	return False


# ---------------------------------------------------
# Retrieval
# ---------------------------------------------------

def retrieve(query, k=5):
	query = normalize_medical_query(query)
	print("[LOG] Query (Normalized):", query)
	start = time.time()

	# Lazy load
	idx, dat, ent_idx, b25 = get_data_and_indices()
	embed_model = get_embedding_model()
	rank_model = get_reranker()

	domain_priority = {
		"drug": 4,
		"disease": 3,
		"nutrition": 2,
		"guideline": 1
	}

	query_lower = query.lower()

	keywords = extract_keywords(query)

	domain = detect_domain(query)

	section_priority = detect_section(query)

	entity = detect_entity(query, ent_idx)

	# ---------------------------------------------------
	# ENTITY FILTER (perfect retrieval)
	# ---------------------------------------------------

	if entity and entity in ent_idx:

		indices = ent_idx[entity]

		results = []

		for p_idx in indices:

			doc = dat[p_idx]
			doc_type = doc.get("type", "").lower()

			if domain and doc_type != domain:
				continue

			section = doc.get("section", "").lower()

			score = 0

			if domain and doc_type != domain:
				score -= 10

			if domain == "disease" and doc_type == "disease":
				score += 8

			if section_priority and section_priority in section:
				score += 10

			score += len(keywords.intersection(doc["text"].lower().split()))

			results.append((score, doc))

		results.sort(key=lambda x: x[0], reverse=True)
		final_results = [doc for _, doc in results[:k]]
		end = time.time()
		print(f"[TIME] Retrieval took {end - start:.2f}s")
		return final_results


	# ---------------------------------------------------
	# BM25 search
	# ---------------------------------------------------

	token_query = tokenize(query)

	bm25_scores = b25.get_scores(token_query)

	bm25_top = np.argsort(bm25_scores)[-100:]


	# ---------------------------------------------------
	# FAISS search
	# ---------------------------------------------------

	query_embedding = embed_model.encode([query])
	query_embedding = np.array(query_embedding).astype("float32")

	D, I = idx.search(query_embedding, 100)

	faiss_indices = I[0]


	# ---------------------------------------------------
	# Combine candidates
	# ---------------------------------------------------

	candidate_indices = set(bm25_top).union(set(faiss_indices))

	candidates = []

	for c_idx in candidate_indices:

		doc = dat[c_idx]

		text = doc["text"].lower()

		name = doc.get("name", "").lower()

		section = doc.get("section", "").lower()

		doc_type = doc.get("type", "").lower()

		if domain and doc_type != domain:
			score = -10
			continue

		score = 0


		# BM25 score
		score += bm25_scores[c_idx] * 2


		# vector similarity
		if c_idx in faiss_indices:

			pos = list(faiss_indices).index(c_idx)

			distance = D[0][pos]

			vector_score = 1 / (1 + distance)

			score += vector_score * 8


		# keyword matches
		for word in keywords:
			if word in text:
				score += 2


		# section boost
		if section_priority and section_priority in section:
			score += 6

		# DOMAIN PRIORITY BOOST (fallback only)
		if not domain and doc_type in domain_priority:
			score += domain_priority[doc_type]


		# domain boost
		if domain and domain == doc_type:
			score += 15

		# EXTRA BOOST FOR MATCHING DISEASE DOMAIN
		if domain == "disease" and doc_type == "disease":
			score += 8


		# keyword in name boost
		for word in keywords:
			if word in name:
				score += 3


		candidates.append((score, doc))


	candidates.sort(key=lambda x: x[0], reverse=True)

	# ------------------- NEW FEATURE -------------------
	# Cross Encoder Reranking
	# ---------------------------------------------------

	top_candidates = [doc for _, doc in candidates[:30]]

	pairs = [(query, doc["text"]) for doc in top_candidates]

	scores = rank_model.predict(pairs)

	reranked = sorted(zip(scores, top_candidates), key=lambda x: x[0], reverse=True)

	results = [doc for _, doc in reranked[:k]]

	print("\n[DEBUG] Retrieved docs:")
	for doc in results:
		print(doc.get("name", "Unknown"), "-", doc.get("section", "overview"))

	end = time.time()
	print(f"[TIME] Retrieval took {end - start:.2f}s")

	# ---------------------------------------------------

	return results
