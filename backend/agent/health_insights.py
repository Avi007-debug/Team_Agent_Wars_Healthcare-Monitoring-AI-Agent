def generate_insights(docs):

	insights = set()

	for doc in docs:

		text = doc.get("text", "").lower()

		if "high blood pressure" in text or "hypertension" in text:
			insights.add("⚠️ Risk: Hypertension detected")

		if "prevent" in text:
			insights.add("✅ Prevention: Follow lifestyle changes")

		if "side effect" in text or "adverse" in text:
			insights.add("⚠️ Caution: Monitor adverse effects and seek medical guidance if severe")

	if not insights:
		return "No major insights"

	return "\n".join(sorted(insights))