# Exzibo Manager

A full-stack restaurant management app with a FastAPI backend and a React Native / Expo frontend (runs on web via Expo Router + Metro).

## Stack

- **Frontend**: React Native + Expo SDK 54, Expo Router, TypeScript — located in `frontend/`
- **Backend**: Python FastAPI + MongoDB (Motor) — located in `backend/`
- **Package manager**: Yarn 1.x (frontend), pip (backend)

## Running on Replit

### Frontend (Expo Web) — click **Run**

The "Start application" workflow runs:

```bash
cd frontend && yarn expo start --web --port 5000 --host lan
```

Metro bundles the Expo app for web and serves it on port 5000.  
The Replit preview opens automatically once Metro is ready.

### Backend (optional — not started by default)

The backend requires `MONGO_URL` and `DB_NAME` environment secrets.  
Start it separately if needed:

```bash
cd backend && pip install -r requirements.txt && uvicorn server:app --host 0.0.0.0 --port 8000
```

Set `EXPO_PUBLIC_BACKEND_URL` to the backend's Replit dev URL so the frontend can reach the API.

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `MONGO_URL` | Secret | MongoDB connection string |
| `DB_NAME` | Secret | MongoDB database name |
| `JWT_SECRET` | Secret | JWT signing secret |
| `EXPO_PUBLIC_BACKEND_URL` | Shared env | Backend API base URL (empty = relative) |

## Installing / Reinstalling

After a fresh GitHub import:

```bash
cd frontend && yarn install
```

## User Preferences

<!-- Add user preferences here -->
