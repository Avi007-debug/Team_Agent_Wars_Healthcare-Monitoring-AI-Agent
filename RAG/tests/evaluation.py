from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
	sys.path.insert(0, str(ROOT_DIR))

from retrieval.hybrid_retriever import retrieve


queries = [
	"symptoms of diabetes",
	"side effects of aspirin",
	"nutrition in rice",
	"covid prevention",
]


def run_evaluation():
	for q in queries:

		docs = retrieve(q)

		print("\nQuery:", q)

		for doc in docs:
			print(doc.get("name", "Unknown"), "-", doc.get("section", "overview"))


if __name__ == "__main__":
	run_evaluation()