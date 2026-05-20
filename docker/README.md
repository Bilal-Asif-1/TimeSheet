# Docker layout

Docker Compose v2 picks up **`compose.yaml`** in the current directory (no `-f` needed when you `cd` to the right folder).

| File | Purpose |
|------|---------|
| `compose.yaml` (repo root) | Full stack: Postgres, backend API, frontend (nginx). |
| `backend/compose.yaml` | Postgres + API only — use when the UI runs locally (`npm run dev` in `frontend`). |
| `frontend/compose.yaml` | Build and run the static UI only — use when the API is already reachable. |

## Full stack (from repo root)

1. Create `backend/.env` with your secrets and any keys your server reads (see backend source / `dotenv` usage).
2. Optionally create a repo-root `.env` for compose substitution (e.g. `CLIENT_URL`, `VITE_*`, `POSTGRES_*`, `FRONTEND_HTTP_PORT`).
3. Run:

```bash
docker compose up --build
```

- API: `http://localhost:5001` (default)
- UI: `http://localhost` (default host port `80`, override with `FRONTEND_HTTP_PORT`)

## Backend + DB only (from `backend/`)

```bash
cd backend
docker compose -f compose.yaml up --build
```

## Frontend image only (from `frontend/`)

```bash
cd frontend
docker compose -f compose.yaml up --build
```

Ensure `VITE_API_BASE_URL` and `VITE_APP_ORIGIN` match how browsers will reach the API and the app.

Default container names for the root stack: `postgres`, `backend`, `frontend`.
