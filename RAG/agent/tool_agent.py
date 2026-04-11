import re

from tools.drug_interaction_tool import check_drug_interaction
from tools.alert_system import generate_alerts
from tools.health_predictor import predict_health_risk
from tools.reminder_tool import set_reminder


GENERIC_ENTITY_WORDS = {
	"drug",
	"drugs",
	"interaction",
	"interactions",
	"between",
	"with",
	"and",
	"check",
	"can",
	"take",
	"for",
	"the",
	"a",
	"an",
	"is",
	"there",
	"me",
	"about",
	"please",
}


def _extract_entities(query):

	return re.findall(r"\b[a-zA-Z]+\b", (query or "").lower())


def _extract_medicines(query, entities):
	match = re.search(r"interaction(?: between)?\s+([a-zA-Z]+)\s+(?:and|with)\s+([a-zA-Z]+)", query)
	if match:
		return match.group(1), match.group(2)

	drug_candidates = [word for word in entities if word not in GENERIC_ENTITY_WORDS]
	if len(drug_candidates) >= 2:
		return drug_candidates[0], drug_candidates[1]

	return None, None


def _extract_reminder_request(query):
	match = re.search(r"remind me to take\s+(.+?)\s+at\s+(.+)", query)
	if not match:
		return None, None

	medicine = match.group(1).strip(" .")
	time = match.group(2).strip(" .")
	return medicine, time


def _extract_risk_request(query):
	age_match = re.search(r"age\s*(?:is|=)?\s*(\d+)", query)
	bp_match = re.search(r"(?:blood pressure|bp)\s*(?:is|=)?\s*(\d+)", query)

	if not age_match or not bp_match:
		return None, None

	return int(age_match.group(1)), int(bp_match.group(1))


def extract_numbers(query):
	nums = re.findall(r"\d+", query or "")
	return [int(n) for n in nums]


def _extract_heart_rate(query):
	heart_rate_match = re.search(r"(?:heart rate|hr)\s*(?:is|=)?\s*(\d+)", query or "")
	if heart_rate_match:
		return int(heart_rate_match.group(1))
	return None


def tool_agent(query):

	q = (query or "").lower().strip()
	if not q:
		return "Please enter a medical question or command. Example: symptoms of diabetes."

	entities = _extract_entities(q)

	if "interaction" in q:
		drug1, drug2 = _extract_medicines(q, entities)
		if drug1 and drug2:
			return check_drug_interaction(drug1, drug2)
		return "Please specify two drugs. Example: drug interaction aspirin ibuprofen."

	if "remind" in q:
		medicine, time = _extract_reminder_request(q)
		if not medicine or not time:
			return "Use reminder format: remind me to take <medicine> at <time>."
		return set_reminder(medicine, time)

	if "risk" in q:
		numbers = extract_numbers(q)
		age, blood_pressure = _extract_risk_request(q)

		if age is None or blood_pressure is None:
			if len(numbers) >= 2:
				age, blood_pressure = numbers[0], numbers[1]
			elif len(numbers) == 1:
				age, blood_pressure = 30, numbers[0]
			else:
				return "For risk check, include age and blood pressure. Example: age 52 blood pressure 150."

		heart_rate = _extract_heart_rate(q)
		prediction = predict_health_risk(age, blood_pressure)
		alerts = generate_alerts(blood_pressure, heart_rate)

		return f"{prediction}\n\nAlerts:\n" + "\n".join(alerts)

	if "bp" in q or "blood pressure" in q:
		numbers = extract_numbers(q)
		if len(numbers) >= 2:
			age, blood_pressure = numbers[0], numbers[1]
		elif len(numbers) == 1:
			age, blood_pressure = 30, numbers[0]
		else:
			return "For blood pressure checks, include BP value. Example: bp 150 or age 45 bp 150."

		heart_rate = _extract_heart_rate(q)
		prediction = predict_health_risk(age, blood_pressure)
		alerts = generate_alerts(blood_pressure, heart_rate)

		return f"{prediction}\n\nAlerts:\n" + "\n".join(alerts)

	return None