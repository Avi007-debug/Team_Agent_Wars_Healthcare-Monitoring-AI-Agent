# Deployment Guide — AI Medical Assistant

## Architecture

```
User (Browser)
    ↓
Frontend (React on Vercel)
    ↓
API (FastAPI on Render)
    ↓
Medical Agent → Retriever + Tools → Dataset
```

---

## Frontend Deployment (Vercel)

### 1. Build Settings

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `RAG/medical-frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 2. Environment Variables

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com` |

### 3. Deploy Steps

```bash
# Option A: Vercel CLI
cd RAG/medical-frontend
npm i -g vercel
vercel --prod

# Option B: GitHub integration
# 1. Push code to GitHub
# 2. Import repo in vercel.com
# 3. Set root directory to RAG/medical-frontend
# 4. Set VITE_API_URL env variable
# 5. Deploy
```

---

## Backend Deployment (Render)

### 1. Create `render.yaml` (already included)

### 2. Create Files Needed

**`RAG/Procfile`** (if not using render.yaml):
```
web: uvicorn backend.api:app --host 0.0.0.0 --port $PORT
```

### 3. Build Settings on Render

| Setting | Value |
|---|---|
| Environment | Python 3 |
| Root Directory | `RAG` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn backend.api:app --host 0.0.0.0 --port $PORT` |

### 4. Environment Variables

| Variable | Value |
|---|---|
| `PYTHON_VERSION` | `3.11` |
| `PORT` | `8000` (auto-set by Render) |

### 5. Deploy Steps

```bash
# Option A: Render Dashboard
# 1. Create "New Web Service" on render.com
# 2. Connect your GitHub repo
# 3. Set root directory to RAG
# 4. Set build and start commands
# 5. Deploy

# Option B: render.yaml (auto-deploy)
# Push code with render.yaml to trigger deploy
```

---

## Important Notes

> ⚠️ **Large Model Files**: The FAISS index and ML models are large.
> Render's free tier has limited storage. Consider:
> - Using a smaller model variant
> - Loading models from a remote storage (S3/GCS)
> - Using Render's paid tier

> ⚠️ **Cold Starts**: Free tier services spin down after inactivity.
> First request may take 30-60 seconds as models load.

> ⚠️ **CORS**: Update `allow_origins` in `api.py` to your Vercel domain
> for production (instead of `"*"`).

---

## Post-Deployment Checklist

- [ ] Backend `/health` endpoint returns `{"status":"ok"}`
- [ ] Frontend loads and shows chat UI
- [ ] Frontend can send queries and receive responses
- [ ] Role selector works
- [ ] All tool queries work (BP, drug interaction, risk)
- [ ] Chat history persists within session
- [ ] CORS headers present in responses
