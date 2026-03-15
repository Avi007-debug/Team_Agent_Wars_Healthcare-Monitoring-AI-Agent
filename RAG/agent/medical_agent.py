import re

from agent.rag_qa import answer_query
from tools.drug_interaction_tool import check_drug_interaction
from tools.reminder_tool import set_reminder
from tools.risk_predictor import predict_risk


def _extract_medicines(query):
	match = re.search(r"interaction(?: between)?\s+([a-zA-Z]+)\s+(?:and|with)\s+([a-zA-Z]+)", query)
	if match:
		return match.group(1), match.group(2)

	known_medicines = ["aspirin", "ibuprofen", "paracetamol", "acetaminophen"]
	found = [medicine for medicine in known_medicines if medicine in query]
	if len(found) >= 2:
		return found[0], found[1]

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
	bp_match = re.search(r"blood pressure\s*(?:is|=)?\s*(\d+)", query)

	if not age_match or not bp_match:
		return None, None

	return int(age_match.group(1)), int(bp_match.group(1))


def medical_agent(query, conversation_memory=None):

	q = (query or "").lower().strip()

	if not q:
		return "Please enter a medical question or command. Example: symptoms of diabetes."

	drug1, drug2 = _extract_medicines(q)
	if "interaction" in q and (not drug1 or not drug2):
		return "Please provide two medicines. Example: drug interaction aspirin and ibuprofen."

	if "interaction" in q and drug1 and drug2:
		return check_drug_interaction(drug1, drug2)

	medicine, time = _extract_reminder_request(q)
	if "remind me" in q and (not medicine or not time):
		return "Use reminder format: remind me to take <medicine> at <time>."

	if medicine and time:
		return set_reminder(medicine, time)

	age, blood_pressure = _extract_risk_request(q)
	if "blood pressure" in q and (age is None or blood_pressure is None):
		return "For risk check, include age and blood pressure. Example: age 52 blood pressure 150."

	if age is not None and blood_pressure is not None:
		return predict_risk(age, blood_pressure)

	return answer_query(query, conversation_memory=conversation_memory)