def generate_insights(docs):

	insights = []

	for doc in docs:

		text = doc.get("text", "").lower()

		if "risk" in text:
			insights.append("⚠️ Possible health risk identified")

		if "prevent" in text:
			insights.append("✅ Preventive care recommended")

	if not insights:
		return "No major insights found."

	return "\n".join(dict.fromkeys(insights))