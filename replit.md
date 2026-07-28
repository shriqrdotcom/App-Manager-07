# Exzibo Manager

A React Native / Expo app for managing restaurant bookings, orders, coupons, analytics, and notification settings. Built with Expo SDK 54, expo-router (file-based routing), Better Auth for authentication, and TanStack Query for data fetching.

## Stack

- **Framework**: Expo 54 (React Native 0.81) + expo-router 6
- **Auth**: Better Auth (`@better-auth/expo`)
- **Data fetching**: TanStack Query v5
- **Animations**: Reanimated 4 + Gesture Handler
- **Styling**: React Native StyleSheet

## Project structure

```
frontend/          # Expo app root
  app/
    (app)/         # Authenticated screens (tabs, booking, orders, analytics, etc.)
    (auth)/        # Unauthenticated screens (sign-in)
    auth/          # Better Auth callback route
  src/
    api/           # Backend client + bootstrap
    auth/          # Better Auth client config
    components/    # Shared UI components
    config/        # App config (reads EXPO_PUBLIC_BACKEND_URL)
    hooks/         # Custom hooks
    providers/     # React context providers
    storage/       # Secure storage helpers
    utils/         # Utilities
  assets/          # Images, fonts
```

## Running on Replit

The **Start application** workflow runs:

```bash
cd frontend && yarn expo start --go --tunnel --clear --port 5000
```

This starts a Metro bundler with an ngrok tunnel and opens via Expo Go.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | Replit Secrets | Base URL for the backend API (e.g. `https://dashboard.exzibo.online`) |
| `EXPO_TOKEN` | Replit Secrets | Expo account token (for EAS builds / publish) |

## User preferences

- Backend URL: `https://dashboard.exzibo.online`
