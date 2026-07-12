from agent.health_insights import generate_insights


def _grounded_line(doc, role="user"):
	text = " ".join(doc.get("text", "").split())
	name = doc.get("name", "Unknown")
	section = doc.get("section", "overview")
	ref = f" ({name} - {section})"
	if role == "doctor":
		doc_type = doc.get("type", "unknown").upper()
		ref += f" [Scope: {doc_type}]"
	return f"- {text}{ref}"


def structured_response(docs, role="user"):

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

	if role == "doctor":
		response = "🔬 Professional Clinical Digest:\n[CONFIDENTIAL CLINICAL MONOGRAPH AUDIT ACTIVE]\n---\n\n"
	else:
		response = "🩺 Medical Answer:\n\n"

	if purpose:
		response += "Purpose & Indication:\n"
		for doc in purpose:
			response += _grounded_line(doc, role=role) + "\n"
		response += "\n"

	if symptoms:
		response += "Symptoms:\n"
		for doc in symptoms:
			response += _grounded_line(doc, role=role) + "\n"
		response += "\n"

	if treatment:
		response += "Treatment & Management:\n"
		for doc in treatment:
			response += _grounded_line(doc, role=role) + "\n"
		response += "\n"

	if side_effects:
		response += "Side Effects & Adverse Reactions:\n"
		for doc in side_effects:
			response += _grounded_line(doc, role=role) + "\n"
		response += "\n"

	if warnings:
		response += "Warnings & Precautions:\n"
		for doc in warnings:
			response += _grounded_line(doc, role=role) + "\n"
		response += "\n"

	if nutrition:
		response += "Nutrition Information:\n"
		for doc in nutrition:
			response += _grounded_line(doc, role=role) + "\n"
		response += "\n"

	if prevention:
		response += "Prevention Guidelines:\n"
		for doc in prevention:
			response += _grounded_line(doc, role=role) + "\n"
		response += "\n"

	if others:
		response += "Additional Information:\n"
		for doc in others:
			response += _grounded_line(doc, role=role) + "\n"
		response += "\n"

	if role == "doctor":
		response += "📋 Clinical Safety Notice:\n- Cross-reference metrics with institutional guidelines before formulating diagnostics.\n- Report any adverse event patterns directly to FDA MedWatch.\n"

	return response.strip()


def response_agent(docs, role="user"):

	insights = generate_insights(docs)

	return structured_response(docs, role=role) + "\n\n🔍 Insights:\n" + insights