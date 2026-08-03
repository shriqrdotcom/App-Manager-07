# exzibo-manager

A restaurant management mobile app built with Expo (React Native SDK 54). Manages orders, bookings, analytics, team access, and settings for a restaurant.

## Stack

- **Frontend**: Expo SDK 54, Expo Router (file-based routing), React Native
- **Auth**: Better Auth (`@better-auth/expo`)
- **State**: TanStack React Query
- **Navigation**: Custom SwipePager (5-tab side-by-side pager) + Expo Router
- **Animations**: React Native Reanimated + Gesture Handler

## Running on Replit

On a fresh clone, install dependencies first:

```bash
cd frontend && yarn install
```

The app runs as **Expo Web** on port 5000 via the "Start application" workflow:

```bash
cd frontend && yarn expo start --web --port 5000
```

For **Expo Go** (mobile via QR code), use the "Expo Go (tunnel)" workflow:

```bash
cd frontend && yarn expo start --go --tunnel --clear
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | Yes | Backend API base URL (e.g. `https://api.example.com`) |
| `EXPO_TOKEN` | For EAS builds | Expo account token for EAS Build / Submit |

## Project Structure

```
frontend/
  app/              # Expo Router pages (file-based routing)
    (app)/          # Authenticated app routes
    (auth)/         # Auth routes (sign-in)
  src/
    api/            # API client + bootstrap
    auth/           # Better Auth client
    components/     # Shared UI (SwipePager, BottomNavigation, etc.)
    config/         # App config (reads env vars)
    hooks/          # Custom React hooks
  assets/           # Images, fonts
  app.json          # Expo config
  eas.json          # EAS Build config
```

## User Preferences

- Keep existing project structure and stack — no migrations or restructuring without explicit request.
