from agent.health_insights import generate_insights


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
			symptoms.append(text)

		elif "treatment" in section:
			treatment.append(text)

		else:
			others.append(text)

	response = "🩺 Medical Answer:\n\n"

	if symptoms:
		response += "Symptoms:\n"
		for s in symptoms:
			response += f"- {s}\n"

	if treatment:
		response += "\nTreatment:\n"
		for t in treatment:
			response += f"- {t}\n"

	if others:
		response += "\nAdditional Info:\n"
		for o in others:
			response += f"- {o}\n"

	return response.strip()


def response_agent(docs):

	insights = generate_insights(docs)

	return structured_response(docs) + "\n\n🔍 Insights:\n" + insights