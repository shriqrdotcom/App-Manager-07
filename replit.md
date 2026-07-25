# Exzibo Manager

A React Native / Expo frontend restaurant management app (runs on web via Expo Router + Metro). It connects to the original Exzibo production backend using **Better Auth** + **Google OAuth**.

## Stack

- **Frontend**: React Native + Expo SDK 54, Expo Router, TypeScript, Better Auth, React Query — located in `frontend/`
- **Backend**: Original Exzibo production API (Better Auth, Neon/Postgres, Drizzle ORM) — not hosted in this repl; the frontend reaches it via `EXPO_PUBLIC_BACKEND_URL`
- **Package manager**: Yarn 1.x (frontend)

## Running on Replit

### Frontend (Expo Web) — click **Run**

The "Start application" workflow runs:

```bash
cd frontend && yarn expo start --web --port 5000 --host lan
```

Metro bundles the Expo app for web and serves it on port 5000.  
The Replit preview opens automatically once Metro is ready.

## Required Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | Shared env | Production backend base URL (e.g. `https://dashboard.exzibo.online`) |
| `EXPO_PUBLIC_ENABLE_DEMO_LOGIN` | Shared env | Set to `false` — demo login disabled |
| `EXPO_TOKEN` | Secret | Expo publish token |

## Authentication

- Sign-in uses **Better Auth** with **Google OAuth**.
- The session is restored automatically on app launch via `authClient.useSession()`.
- The app fetches the user's restaurants from `GET /api/mobile/v1/bootstrap`.

## Installing / Reinstalling

After a fresh GitHub import:

```bash
cd frontend && yarn install
```

## User Preferences

<!-- Add user preferences here -->
