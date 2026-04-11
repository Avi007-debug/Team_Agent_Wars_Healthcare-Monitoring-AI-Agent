import json
import time
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
	q_terms = set(re.findall(r"[a-z0-9]+", q))
	generic_terms = {
		"symptom", "symptoms", "disease", "treatment", "drug", "drugs",
		"interaction", "interactions", "warning", "warnings", "purpose",
		"nutrition", "food", "diet", "guideline", "guidelines", "prevention",
		"side", "effects", "effect", "risk", "for", "and", "the", "with", "about"
	}
	query_entity_terms = {w for w in q_terms if w not in generic_terms}
	if not query_entity_terms:
		query_entity_terms = q_terms

	best_name = None
	best_overlap = 0

	for name in entity_index.keys():

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
# No Knowledge Detection
# ---------------------------------------------------

def no_knowledge_check(query, docs):

	query_words = set(tokenize(query))
	generic_words = {
		"symptom", "symptoms", "disease", "treatment", "drug", "drugs",
		"interaction", "interactions", "warning", "warnings", "purpose",
		"nutrition", "food", "diet", "guideline", "guidelines", "prevention",
		"unknown"
	}
	informative_words = {w for w in query_words if w not in generic_words}
	if not informative_words:
		informative_words = query_words

	match_count = 0

	for doc in docs:

		text = doc["text"].lower()
		name = doc.get("name", "").lower()
		section = doc.get("section", "").lower().replace("_", " ")
		doc_tokens = set(tokenize(f"{name} {section} {text}"))
		overlap = informative_words.intersection(doc_tokens)

		if len(overlap) >= 1:
			match_count += 1

	return match_count == 0
# ---------------------------------------------------


# ---------------------------------------------------
# Retrieval
# ---------------------------------------------------

def retrieve(query, k=5):
	print("[LOG] Query:", query)
	start = time.time()

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

	entity = detect_entity(query)

	# ---------------------------------------------------
	# ENTITY FILTER (perfect retrieval)
	# ---------------------------------------------------

	if entity and entity in entity_index:

		indices = entity_index[entity]

		results = []

		for idx in indices:

			doc = data[idx]
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

	bm25_scores = bm25.get_scores(token_query)

	bm25_top = np.argsort(bm25_scores)[-100:]


	# ---------------------------------------------------
	# FAISS search
	# ---------------------------------------------------

	query_embedding = model.encode([query])
	query_embedding = np.array(query_embedding).astype("float32")

	D, I = index.search(query_embedding, 100)

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

		if domain and doc_type != domain:
			score = -10
			continue

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

	top_candidates = [doc for _, doc in candidates[:50]]

	pairs = [(query, doc["text"]) for doc in top_candidates]

	scores = reranker.predict(pairs)

	reranked = sorted(zip(scores, top_candidates), key=lambda x: x[0], reverse=True)

	results = [doc for _, doc in reranked[:k]]

	print("\n[DEBUG] Retrieved docs:")
	for doc in results:
		print(doc.get("name", "Unknown"), "-", doc.get("section", "overview"))

	end = time.time()
	print(f"[TIME] Retrieval took {end - start:.2f}s")

	# ---------------------------------------------------

	return results
