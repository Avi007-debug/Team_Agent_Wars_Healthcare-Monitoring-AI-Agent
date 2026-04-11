def analyze_health(bp, diet_score):

	if bp > 150:
		return "⚠️ High BP detected — risk of hypertension"

	if diet_score < 5:
		return "⚠️ Poor diet — improve nutrition intake"

	return "✅ Health condition looks stable"