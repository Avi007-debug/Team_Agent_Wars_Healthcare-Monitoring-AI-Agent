# Testing Instructions — AI Medical Assistant

## Prerequisites

1. **Backend running** at `http://127.0.0.1:8000`
2. **Frontend running** at `http://localhost:5173`

### Start Backend
```bash
cd backend
python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

### Start Frontend
```bash
cd frontend
npm run dev
```

---

## 1. Health Check

```bash
curl http://127.0.0.1:8000/health
```
✅ Expected: `{"status":"ok"}`

---

## 2. CORS Verification

```bash
curl -H "Origin: http://localhost:5173" -v http://127.0.0.1:8000/health 2>&1 | findstr "Access-Control"
```
✅ Expected: `Access-Control-Allow-Origin: *`

---

## 3. RAG Queries (via UI or curl)

| Query | Expected behavior |
|---|---|
| `symptoms of diabetes` | Returns symptoms from disease dataset |
| `side effects of aspirin` | Returns drug side effects |
| `nutrition in rice` | Returns nutrition data |
| `covid prevention` | Returns guideline info |
| `treatment for hypertension` | Returns treatment information |

```bash
curl -X POST http://127.0.0.1:8000/ask -H "Content-Type: application/json" -d "{\"query\":\"symptoms of diabetes\",\"role\":\"user\"}"
```
✅ Expected: `{"response": "🩺 Medical Answer:...", "role": "user"}`

---

## 4. Tool Queries

| Query | Tool triggered |
|---|---|
| `bp 160` | Health predictor + alerts |
| `drug interaction aspirin ibuprofen` | Drug interaction checker |
| `risk age 55 bp 160` | Risk predictor + alerts |
| `remind me to take aspirin at 8am` | Reminder tool |

```bash
curl -X POST http://127.0.0.1:8000/ask -H "Content-Type: application/json" -d "{\"query\":\"drug interaction aspirin ibuprofen\",\"role\":\"user\"}"
```

---

## 5. Role System

```bash
# As user
curl -X POST http://127.0.0.1:8000/ask -H "Content-Type: application/json" -d "{\"query\":\"symptoms of diabetes\",\"role\":\"user\"}"

# As doctor
curl -X POST http://127.0.0.1:8000/ask -H "Content-Type: application/json" -d "{\"query\":\"symptoms of diabetes\",\"role\":\"doctor\"}"
```
✅ Expected: Both return valid responses with `"role"` field in output

---

## 6. Chat History

```bash
# Get history
curl http://127.0.0.1:8000/history

# Clear history
curl -X DELETE http://127.0.0.1:8000/history
```
✅ Expected: Returns list of past messages / clears them

---

## 7. Edge Cases

| Input | Expected |
|---|---|
| _(empty)_ | "Please enter a medical question..." |
| `hi` | "No relevant medical information found." |
| `asdfghjkl` | "No relevant medical information found." |
| `what about treatment?` (follow-up) | Uses conversation context |

---

## 8. Frontend UI Checklist

- [ ] Page loads with dark theme and welcome screen
- [ ] Welcome chips are clickable and send queries
- [ ] Messages appear with slide-in animation
- [ ] Typing indicator shows during loading
- [ ] Auto-scrolls to latest message
- [ ] Role selector switches between User/Doctor
- [ ] Quick query presets work from sidebar
- [ ] Clear button clears chat
- [ ] Enter key sends message
- [ ] Empty input is disabled (send button grayed)
- [ ] Error message shown if backend is down
