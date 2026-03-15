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


def _build_context(docs):
	lines = []

	for index, doc in enumerate(docs, start=1):
		header = f"{index}. {doc.get('name', 'Unknown')} [{doc.get('type', 'general')} - {doc.get('section', 'overview')}]"
		text = doc.get("text", "").strip()
		lines.append(f"{header}\n{text}")

	return "\n\n".join(lines)


def _extract_first_sentence(text):
	cleaned = " ".join((text or "").split())
	if not cleaned:
		return "No summary sentence available."

	for separator in [". ", "! ", "? "]:
		if separator in cleaned:
			return cleaned.split(separator, 1)[0].strip() + "."

	return cleaned[:180] + ("..." if len(cleaned) > 180 else "")


def _build_summary(docs):
	summary_lines = []

	for doc in docs[:3]:
		name = doc.get("name", "Unknown")
		section = doc.get("section", "overview")
		sentence = _extract_first_sentence(doc.get("text", ""))
		summary_lines.append(f"- {name} ({section}): {sentence}")

	return "\n".join(summary_lines)


def _build_source_snippets(docs):
	snippets = []

	for index, doc in enumerate(docs, start=1):
		header = f"{index}. [{doc.get('type', 'general')} - {doc.get('name', 'Unknown')} - {doc.get('section', 'overview')}]"
		text = " ".join(doc.get("text", "").split())
		snippet = text[:260] + ("..." if len(text) > 260 else "")
		snippets.append(f"{header}\n   Snippet: {snippet}")

	return "\n\n".join(snippets)


def answer_query(query, conversation_memory=None):

	augmented_query = _contextualize_query(query, conversation_memory)

	docs = retrieve(augmented_query)

	if not docs or no_knowledge_check(augmented_query, docs):
		return "No relevant information found in the dataset."

	summary = _build_summary(docs)
	context = _build_context(docs)
	source_snippets = _build_source_snippets(docs)

	answer = f"""Medical Information Found

Summary:
{summary}

Detailed Context:
{context}

Sources:
{source_snippets}
"""

	return answer