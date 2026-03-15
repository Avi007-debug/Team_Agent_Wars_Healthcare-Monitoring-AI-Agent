def predict_risk(age, blood_pressure):

	if blood_pressure > 160:
		return f"Age {age} with blood pressure {blood_pressure} suggests high cardiovascular risk. Consider medical evaluation."

	if blood_pressure > 140:
		return f"Age {age} with blood pressure {blood_pressure} suggests elevated risk of hypertension."

	return f"Age {age} with blood pressure {blood_pressure} suggests blood pressure is within a lower-risk range."