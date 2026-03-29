from retrieval.hybrid_retriever import no_knowledge_check, retrieve


FOLLOW_UP_HINTS = {
	"it",
	"its",
	"that",
	"those",
	"them",
	"this",
	"these",
	"what about",
	"and for",
	"also",
	"more",
}


def _normalize_history(conversation_memory):
	if not conversation_memory:
		return []

	normalized = []

	for turn in conversation_memory:
		if isinstance(turn, dict):
			user_text = (turn.get("user") or "").strip()
			assistant_text = (turn.get("assistant") or "").strip()
			if user_text or assistant_text:
				normalized.append({"user": user_text, "assistant": assistant_text})
		elif isinstance(turn, (tuple, list)) and len(turn) >= 2:
			user_text = (str(turn[0]) if turn[0] is not None else "").strip()
			assistant_text = (str(turn[1]) if turn[1] is not None else "").strip()
			if user_text or assistant_text:
				normalized.append({"user": user_text, "assistant": assistant_text})

	return normalized


def _looks_like_follow_up(query):
	q = (query or "").lower().strip()
	if not q:
		return False

	if len(q.split()) <= 5:
		return True

	return any(hint in q for hint in FOLLOW_UP_HINTS)


def _contextualize_query(query, conversation_memory):
	normalized = _normalize_history(conversation_memory)
	if not normalized or not _looks_like_follow_up(query):
		return query

	last_user_turns = [turn["user"] for turn in normalized if turn.get("user")]
	if not last_user_turns:
		return query

	recent_context = " ".join(last_user_turns[-2:]).strip()
	if not recent_context:
		return query

	return f"{recent_context}. {query}"


def format_response(docs):

	response = "🩺 Medical Information:\n\n"

	for i, doc in enumerate(docs, start=1):
		name = doc.get("name", "Unknown")
		section = doc.get("section", "overview")
		text = " ".join(doc.get("text", "").split())
		response += f"{i}. {name} ({section})\n"
		response += f"   - {text}\n\n"

	return response.strip()


def answer_query(query, conversation_memory=None):

	augmented_query = _contextualize_query(query, conversation_memory)

	docs = retrieve(augmented_query)

	if not docs or no_knowledge_check(augmented_query, docs):
		return "No relevant medical information found."

	return format_response(docs)