from agent.medical_agent import medical_agent
from pathlib import Path


def run_query_file(file_path):
	if not file_path.exists():
		print(f"Test file not found: {file_path}")
		return

	print(f"\nRunning tests from: {file_path}")
	memory = []

	queries = [line.strip() for line in file_path.read_text(encoding="utf-8").splitlines() if line.strip()]

	for index, query in enumerate(queries, start=1):
		response = medical_agent(query, conversation_memory=memory)
		memory.append({"user": query, "assistant": response})
		memory = memory[-12:]

		print(f"\n[{index}] Query: {query}")
		print("Response:")
		print(response)


def run_edge_cases():
	edge_queries = [
		"asdasdasd",
		"unknown disease xyz",
	]

	print("\nRunning edge-case checks:")
	for query in edge_queries:
		response = medical_agent(query)
		print(f"- Query: {query}")
		print(f"  Response: {response}")


if __name__ == "__main__":
	base_dir = Path(__file__).resolve().parent
	test_file = base_dir / "tests" / "test_queries_custom.txt"

	run_query_file(test_file)
	run_edge_cases()

	memory = []
	print("\nInteractive mode started. Type 'exit' to quit.")

	while True:

		query = input("\nAsk medical question (type exit): ")

		if query.lower() == "exit":
			break

		response = medical_agent(query, conversation_memory=memory)
		memory.append({"user": query, "assistant": response})
		memory = memory[-12:]

		print("\nResponse:\n")

		print(response)