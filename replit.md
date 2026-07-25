# Exzibo Manager

A React Native / Expo frontend restaurant management app (runs on web via Expo Router + Metro).

## Stack

- **Frontend**: React Native + Expo SDK 54, Expo Router, TypeScript — located in `frontend/`
- **Package manager**: Yarn 1.x (frontend)

## Running on Replit

### Frontend (Expo Web) — click **Run**

The "Start application" workflow runs:

```bash
cd frontend && yarn expo start --web --port 5000 --host lan
```

Metro bundles the Expo app for web and serves it on port 5000.  
The Replit preview opens automatically once Metro is ready.

## Authentication

Authentication backend is **not yet connected**. The sign-in screen is present as UI but login/register will return "Authentication backend not yet configured" until a real auth backend is wired up.

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | Shared env | Backend API base URL (empty = relative) |
| `EXPO_PUBLIC_ENABLE_DEMO_LOGIN` | Shared env | Set to `false` — demo login disabled |
| `EXPO_TOKEN` | Secret | Expo publish token |

## Installing / Reinstalling

After a fresh GitHub import:

```bash
cd frontend && yarn install
```

## User Preferences

<!-- Add user preferences here -->
