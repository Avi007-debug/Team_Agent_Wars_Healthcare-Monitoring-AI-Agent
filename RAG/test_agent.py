from agent.medical_agent import medical_agent


memory = []


while True:

	query = input("\nAsk medical question (type exit): ")

	if query.lower() == "exit":
		break

	response = medical_agent(query, conversation_memory=memory)
	memory.append({"user": query, "assistant": response})
	memory = memory[-12:]

	print("\nResponse:\n")

	print(response)