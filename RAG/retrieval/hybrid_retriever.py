import json
from pathlib import Path
import faiss
import numpy as np
import re
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi

# ------------------- NEW FEATURE -------------------
# Cross Encoder Reranker
from sentence_transformers import CrossEncoder
# ---------------------------------------------------

print("Loading embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

# ------------------- NEW FEATURE -------------------
print("Loading cross-encoder reranker...")
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
# ---------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
INDEX_PATH = BASE_DIR / "medical_vector_db.faiss"
DATASET_PATH = BASE_DIR / "medical_rag_dataset.json"

print("Loading FAISS index...")
index = faiss.read_index(str(INDEX_PATH))

print("Loading dataset...")
with open(DATASET_PATH, "r", encoding="utf-8") as f:
	data = json.load(f)

print("Total documents:", len(data))


# ---------------------------------------------------
# Build ENTITY INDEX
# ---------------------------------------------------

print("Building entity index...")

entity_index = {}

for i, doc in enumerate(data):

	name = doc.get("name", "").lower()

	if name:
		entity_index.setdefault(name, []).append(i)


# ---------------------------------------------------
# Build BM25 corpus
# ---------------------------------------------------

print("Building BM25 index...")

def tokenize(text):
	return re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())

corpus = []

for doc in data:
	text = doc["text"]
	name = doc.get("name", "")
	combined = name + " " + text
	corpus.append(tokenize(combined))

bm25 = BM25Okapi(corpus)


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

def detect_entity(query):

	q = query.lower()

	for name in entity_index.keys():

		if name in q:
			return name

	return None


# ------------------- NEW FEATURE -------------------
# No Knowledge Detection
# ---------------------------------------------------

def no_knowledge_check(query, docs):

	query_words = set(tokenize(query))

	match_count = 0

	for doc in docs:

		text = doc["text"].lower()

		for word in query_words:
			if word in text:
				match_count += 1
				break

	if match_count == 0:
		return True

	return False
# ---------------------------------------------------


# ---------------------------------------------------
# Retrieval
# ---------------------------------------------------

def retrieve(query, k=5):

	query_lower = query.lower()

	keywords = extract_keywords(query)

	domain = detect_domain(query)

	section_priority = detect_section(query)

	entity = detect_entity(query)

	# ---------------------------------------------------
	# ENTITY FILTER (perfect retrieval)
	# ---------------------------------------------------

	if entity and entity in entity_index:

		indices = entity_index[entity]

		results = []

		for idx in indices:

			doc = data[idx]

			section = doc.get("section", "").lower()

			score = 0

			if section_priority and section_priority in section:
				score += 10

			score += len(keywords.intersection(doc["text"].lower().split()))

			results.append((score, doc))

		results.sort(key=lambda x: x[0], reverse=True)

		return [doc for _, doc in results[:k]]


	# ---------------------------------------------------
	# BM25 search
	# ---------------------------------------------------

	token_query = tokenize(query)

	bm25_scores = bm25.get_scores(token_query)

	bm25_top = np.argsort(bm25_scores)[-80:]


	# ---------------------------------------------------
	# FAISS search
	# ---------------------------------------------------

	query_embedding = model.encode([query])
	query_embedding = np.array(query_embedding).astype("float32")

	D, I = index.search(query_embedding, 80)

	faiss_indices = I[0]


	# ---------------------------------------------------
	# Combine candidates
	# ---------------------------------------------------

	candidate_indices = set(bm25_top).union(set(faiss_indices))

	candidates = []

	for idx in candidate_indices:

		doc = data[idx]

		text = doc["text"].lower()

		name = doc.get("name", "").lower()

		section = doc.get("section", "").lower()

		doc_type = doc.get("type", "").lower()

		score = 0


		# BM25 score
		score += bm25_scores[idx] * 2


		# vector similarity
		if idx in faiss_indices:

			pos = list(faiss_indices).index(idx)

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


		# domain boost
		if domain and domain == doc_type:
			score += 5


		# keyword in name boost
		for word in keywords:
			if word in name:
				score += 3


		candidates.append((score, doc))


	candidates.sort(key=lambda x: x[0], reverse=True)

	# ------------------- NEW FEATURE -------------------
	# Cross Encoder Reranking
	# ---------------------------------------------------

	top_candidates = [doc for _, doc in candidates[:40]]

	pairs = [(query, doc["text"]) for doc in top_candidates]

	scores = reranker.predict(pairs)

	reranked = sorted(zip(scores, top_candidates), key=lambda x: x[0], reverse=True)

	results = [doc for _, doc in reranked[:k]]

	# ---------------------------------------------------

	return results
