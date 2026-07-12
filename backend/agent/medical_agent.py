from agent.rag_qa import answer_query
from agent.tool_agent import tool_agent


def medical_agent(query, conversation_memory=None, user_id=None, role="user"):

	q = (query or "").lower().strip()

	if not q:
		return "Please enter a medical question or command. Example: symptoms of diabetes."

	tool_result = tool_agent(query, user_id=user_id)
	if tool_result:
		return tool_result

	return answer_query(query, conversation_memory=conversation_memory, role=role)