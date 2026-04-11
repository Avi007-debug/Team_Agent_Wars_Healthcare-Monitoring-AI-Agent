import json
from pathlib import Path
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

print("Loading datasets...")

SCRIPT_DIR = Path(__file__).resolve().parent
RAG_DIR = SCRIPT_DIR.parent

files = [
    SCRIPT_DIR / "drug" / "drug_rag_final.json",
    SCRIPT_DIR / "disease" / "disease_rag.json",
    SCRIPT_DIR / "guideline_rag.json",
    SCRIPT_DIR / "nutrition_rag.json",
]

data = []

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        data.extend(json.load(f))

print("Total documents before cleaning:", len(data))


def normalize_document(doc):
    text = " ".join(str(doc.get("text", "")).split())
    if len(text) < 20:
        return None

    if doc.get("drug_name") and not doc.get("type"):
        doc_type = "drug"
    else:
        doc_type = str(doc.get("type", "unknown")).strip().lower() or "unknown"

    name = str(doc.get("name") or doc.get("drug_name") or "unknown").strip()
    section = str(doc.get("section", "overview")).strip().lower() or "overview"

    return {
        "type": doc_type,
        "name": name,
        "section": section,
        "text": text,
    }


unique_texts = set()
clean_data = []

for doc in data:
    normalized = normalize_document(doc)
    if normalized is None:
        continue

    if normalized["text"] not in unique_texts:
        unique_texts.add(normalized["text"])
        clean_data.append(normalized)

data = clean_data

print("Total documents after cleaning:", len(data))
print("New dataset size:", len(data))


# Save merged dataset
dataset_out = RAG_DIR / "medical_rag_dataset.json"
with open(dataset_out, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Merged dataset saved")


print("Loading embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

texts = [item["text"] for item in data]

print("Generating embeddings...")
embeddings = model.encode(texts, show_progress_bar=True)

embeddings = np.array(embeddings).astype("float32")


print("Building FAISS index...")
dimension = embeddings.shape[1]

index = faiss.IndexFlatL2(dimension)

index.add(embeddings)

index_out = RAG_DIR / "medical_vector_db.faiss"
faiss.write_index(index, str(index_out))

print("Vector DB created successfully")


print("Total vectors stored:", index.ntotal)