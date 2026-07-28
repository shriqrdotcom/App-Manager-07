# Exzibo Manager

A React Native / Expo restaurant management app built with Expo Router, Better Auth, and React Query.

## Stack

- **Framework**: Expo SDK 54, Expo Router 6 (file-based routing)
- **Auth**: Better Auth + `@better-auth/expo`
- **Data fetching**: TanStack React Query
- **Animations**: React Native Reanimated + Gesture Handler
- **Language**: TypeScript

## Project structure

```
frontend/          # Expo app (all app code lives here)
  app/             # Expo Router pages
    (app)/         # Authenticated routes (orders, booking, analytics, settings, edit)
    (auth)/        # Auth routes (sign-in)
  assets/          # Images, fonts
  components/      # Shared UI components
  lib/             # Auth client, API helpers
```

## How to run

Dependencies are installed under `frontend/node_modules`. The workflow runs:

```
cd frontend && yarn expo start --web --port 5000
```

This serves the app as a web preview on port 5000. To preview on a physical device via Expo Go, switch the workflow command to use `--tunnel` (requires a working ngrok connection).

## User preferences

- Keep the existing Expo / React Native stack — do not migrate or restructure.
