import re

from agent.rag_qa import answer_query
from tools.drug_interaction_tool import check_drug_interaction
from tools.reminder_tool import set_reminder
from tools.risk_predictor import predict_risk


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


def detect_intent(query):

	q = (query or "").lower()

	if "interaction" in q:
		return "drug_interaction"

	if "remind" in q:
		return "reminder"

	if "risk" in q or "bp" in q or "blood pressure" in q:
		return "risk"

	return "rag"


def extract_entities(query):

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


def medical_agent(query, conversation_memory=None):

	q = (query or "").lower().strip()

	if not q:
		return "Please enter a medical question or command. Example: symptoms of diabetes."

	intent = detect_intent(q)
	entities = extract_entities(q)

	if intent == "drug_interaction":
		drug1, drug2 = _extract_medicines(q, entities)
		if drug1 and drug2:
			return check_drug_interaction(drug1, drug2)
		return "Please specify two drugs. Example: drug interaction aspirin ibuprofen."

	medicine, time = _extract_reminder_request(q)
	if intent == "reminder" and (not medicine or not time):
		return "Use reminder format: remind me to take <medicine> at <time>."

	if intent == "reminder" and medicine and time:
		return set_reminder(medicine, time)

	age, blood_pressure = _extract_risk_request(q)
	if intent == "risk" and (age is None or blood_pressure is None):
		return "For risk check, include age and blood pressure. Example: age 52 blood pressure 150."

	if intent == "risk" and age is not None and blood_pressure is not None:
		return predict_risk(age, blood_pressure)

	return answer_query(query, conversation_memory=conversation_memory)