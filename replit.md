# Exzibo Manager

A React Native / Expo app for restaurant management (orders, bookings, analytics, settings).

## Stack
- **Frontend**: Expo SDK 54, React Native 0.81, Expo Router, React Query, Better Auth, Reanimated
- **Backend**: External — `https://dashboard.exzibo.online` (pre-configured)
- **Package manager**: Yarn 1.22 (run commands from `frontend/`)

## How to run
The "Start application" workflow runs:
```
cd frontend && yarn expo start --web --port 5000
```
App is served on port 5000 as an Expo Web build.

## Environment variables (already set)
- `EXPO_PUBLIC_BACKEND_URL` — points to the production backend
- `EXPO_PUBLIC_ENABLE_DEMO_LOGIN` — set to `"false"` (flip to `"true"` to bypass auth)
- `EXPO_PUBLIC_PREVIEW_DEMO` — set to `"true"` for demo data in preview

## Setup status
- Dependencies installed: `cd frontend && yarn install`
- App verified running on Expo Web (port 5000) with demo data

## Notes
- `newArchEnabled` is `false` in `app.json` (required for Expo Go stability — see memory)
- Dependencies must be installed from `frontend/` directory
