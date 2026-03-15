import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

print("Loading datasets...")

files = [
    "drug_rag_final.json",
    "disease_rag.json",
    "guideline_rag.json",
    "nutrition_rag.json"
]

data = []

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        data.extend(json.load(f))

print("Total documents:", len(data))


# Save merged dataset
with open("medical_rag_dataset.json", "w", encoding="utf-8") as f:
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

faiss.write_index(index, "medical_vector_db.faiss")

print("Vector DB created successfully")


print("Total vectors stored:", index.ntotal)