# Legacy Medical Frontend

This folder contains the secondary/legacy React UI for the AI healthcare assistant project.

Primary active frontend for current demos is located at:

- `frontend/` (main 3-page app)

Use this legacy frontend only for compatibility checks or older demo flows.

## Run Locally

From repository root:

```bash
cd frontend/medical-frontend
npm install
npm run dev
```

## Environment

Create `.env` in this folder (if required by your local build) and set backend URL:

```env
VITE_API_URL=http://127.0.0.1:8000
```

If the build includes authentication flows, also set:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Notes

- This UI is maintained as a fallback interface.
- API contract remains backend-driven (`/ask`, `/predict`, `/interaction`, `/history`, `/clear`, `/profile`).
- For latest architecture and deployment guidance, refer to root docs:
	- `README.md`
	- `SETUP.md`
	- `DEPLOYMENT.md`
	- `TESTING.md`
