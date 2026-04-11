from agent.health_insights import generate_insights


def _grounded_line(doc):
	text = " ".join(doc.get("text", "").split())
	name = doc.get("name", "Unknown")
	section = doc.get("section", "overview")
	return f"- {text} ({name} - {section})"


def structured_response(docs):

	symptoms = []
	treatment = []
	others = []

	for doc in docs:

		section = doc.get("section", "").lower()
		text = " ".join(doc.get("text", "").split())

		if not text:
			continue

		if "symptom" in section:
			symptoms.append(doc)

		elif "treatment" in section:
			treatment.append(doc)

		else:
			others.append(doc)

	response = "🩺 Medical Answer:\n\n"

	if symptoms:
		response += "Symptoms:\n"
		for doc in symptoms:
			response += _grounded_line(doc) + "\n"

	if treatment:
		response += "\nTreatment:\n"
		for doc in treatment:
			response += _grounded_line(doc) + "\n"

	if others:
		response += "\nAdditional Info:\n"
		for doc in others:
			response += _grounded_line(doc) + "\n"

	return response.strip()


def response_agent(docs):

	insights = generate_insights(docs)

	return structured_response(docs) + "\n\n🔍 Insights:\n" + insights