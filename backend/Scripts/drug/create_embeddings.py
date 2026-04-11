import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

INPUT_FILE = "drug_rag_final.json"

print("Loading dataset...")

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

texts = [item["text"] for item in data]

print("Loading embedding model...")

model = SentenceTransformer("all-MiniLM-L6-v2")

print("Generating embeddings...")

embeddings = model.encode(texts, show_progress_bar=True)

embeddings = np.array(embeddings).astype("float32")

dimension = embeddings.shape[1]

print("Creating FAISS index...")

index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

faiss.write_index(index, "drug_vector.index")

with open("drug_metadata.json", "w", encoding="utf-8") as f:
    json.dump(data, f)

print("Vector database created successfully!")
print("Total vectors:", len(embeddings))