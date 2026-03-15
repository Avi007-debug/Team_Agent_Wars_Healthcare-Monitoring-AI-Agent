def check_drug_interaction(drug1, drug2):

	interactions = {
		frozenset(("aspirin", "ibuprofen")):
		"Taking aspirin and ibuprofen together may increase the risk of stomach bleeding.",
		frozenset(("aspirin", "warfarin")):
		"Aspirin with warfarin can significantly increase bleeding risk.",
		frozenset(("ibuprofen", "warfarin")):
		"Ibuprofen and warfarin together may increase bleeding complications.",
	}

	key = frozenset((drug1.lower(), drug2.lower()))

	if drug1.lower() == drug2.lower():
		return f"{drug1.title()} was provided twice. Please provide two different medicines to check interactions."

	return interactions.get(key, f"No known interaction found for {drug1.title()} and {drug2.title()} in the basic tool database.")