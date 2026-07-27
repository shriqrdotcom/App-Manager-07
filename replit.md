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
cd frontend && yarn expo start --web --lan --clear --port 5000
```

Metro serves the Expo web dashboard on port 5000 for the Replit preview.
For native Expo Go development, run `yarn expo start` locally from `frontend/`.

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | Secret | Production backend base URL (e.g. `https://dashboard.exzibo.online`) |
| `EXPO_PUBLIC_ENABLE_DEMO_LOGIN` | Shared env | `false` — disables the old demo login |
| `EXPO_PUBLIC_PREVIEW_DEMO` | Shared env | `true` — **preview only**: bypasses Google OAuth and shows the dashboard for UI testing |
| `EXPO_TOKEN` | Secret | Expo token (currently invalid, so workflow overrides it for local dev) |

## Authentication

- In normal mode, sign-in uses **Better Auth** with **Google OAuth**.
- The session is restored automatically on app launch via `authClient.useSession()`.
- The app fetches the user's restaurants from `GET /api/mobile/v1/bootstrap`.
- In preview demo mode (`EXPO_PUBLIC_PREVIEW_DEMO=true`), the login screen is skipped and a demo restaurant/user is injected so the dashboard pages can be navigated.

## Installing / Reinstalling

After a fresh GitHub import:

```bash
cd frontend && yarn install
```

## User Preferences

<!-- Add user preferences here -->
