from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
	sys.path.insert(0, str(ROOT_DIR))

from retrieval.hybrid_retriever import retrieve


def evaluate():

	queries = [
		("symptoms of diabetes", "disease"),
		("side effects of aspirin", "drug"),
		("nutrition in rice", "nutrition"),
		("covid prevention", "guideline"),
	]

	total = len(queries)
	top1_correct = 0
	hitk_correct = 0

	for q, expected_type in queries:

		docs = retrieve(q)

		print("\nQuery:", q)
		print("Expected type:", expected_type)

		if docs and docs[0].get("type") == expected_type:
			top1_correct += 1

		if any(doc.get("type") == expected_type for doc in docs):
			hitk_correct += 1

		for doc in docs:
			print(
				doc.get("name", "Unknown"),
				"-",
				doc.get("section", "overview"),
				"[type=",
				doc.get("type", "unknown"),
				"]",
			)

	top1_accuracy = top1_correct / total if total else 0.0
	hitk_accuracy = hitk_correct / total if total else 0.0

	print("\nTop-1 Accuracy:", f"{top1_accuracy:.2f}")
	print("Hit@k:", f"{hitk_accuracy:.2f}")


def run_evaluation():
	evaluate()


if __name__ == "__main__":
	run_evaluation()