from sentence_transformers import SentenceTransformer, CrossEncoder

print("⚡ Pre-caching embedding model...")
SentenceTransformer("all-MiniLM-L6-v2")

print("⚡ Pre-caching cross-encoder reranker...")
CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

print("✅ Model pre-caching complete!")
