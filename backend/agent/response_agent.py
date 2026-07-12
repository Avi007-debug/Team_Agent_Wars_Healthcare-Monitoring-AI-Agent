from agent.health_insights import generate_insights


def _grounded_line(doc):
	text = " ".join(doc.get("text", "").split())
	name = doc.get("name", "Unknown")
	section = doc.get("section", "overview")
	return f"- {text} ({name} - {section})"


def structured_response(docs):

	symptoms = []
	treatment = []
	side_effects = []
	warnings = []
	purpose = []
	nutrition = []
	prevention = []
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
		elif "side_effect" in section or "sideeffect" in section or "adverse" in section:
			side_effects.append(doc)
		elif "warning" in section or "precaution" in section:
			warnings.append(doc)
		elif "purpose" in section:
			purpose.append(doc)
		elif "nutrition" in section:
			nutrition.append(doc)
		elif "prevention" in section:
			prevention.append(doc)
		else:
			others.append(doc)

	response = "🩺 Medical Answer:\n\n"

	if purpose:
		response += "Purpose & Indication:\n"
		for doc in purpose:
			response += _grounded_line(doc) + "\n"
		response += "\n"

	if symptoms:
		response += "Symptoms:\n"
		for doc in symptoms:
			response += _grounded_line(doc) + "\n"
		response += "\n"

	if treatment:
		response += "Treatment & Management:\n"
		for doc in treatment:
			response += _grounded_line(doc) + "\n"
		response += "\n"

	if side_effects:
		response += "Side Effects & Adverse Reactions:\n"
		for doc in side_effects:
			response += _grounded_line(doc) + "\n"
		response += "\n"

	if warnings:
		response += "Warnings & Precautions:\n"
		for doc in warnings:
			response += _grounded_line(doc) + "\n"
		response += "\n"

	if nutrition:
		response += "Nutrition Information:\n"
		for doc in nutrition:
			response += _grounded_line(doc) + "\n"
		response += "\n"

	if prevention:
		response += "Prevention Guidelines:\n"
		for doc in prevention:
			response += _grounded_line(doc) + "\n"
		response += "\n"

	if others:
		response += "Additional Information:\n"
		for doc in others:
			response += _grounded_line(doc) + "\n"
		response += "\n"

	return response.strip()


def response_agent(docs):

	insights = generate_insights(docs)

	return structured_response(docs) + "\n\n🔍 Insights:\n" + insights