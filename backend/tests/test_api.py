import requests

BASE_URL = "http://127.0.0.1:8000"


def post(path, payload):
	url = f"{BASE_URL}{path}"
	res = requests.post(url, json=payload, timeout=15)
	print(path, res.status_code, res.json())


if __name__ == "__main__":
	post("/ask", {"query": "symptoms of gestational cholestasis"})
	post("/predict", {"age": 55, "bp": 165})
	post("/interaction", {"drug1": "aspirin", "drug2": "ibuprofen"})
