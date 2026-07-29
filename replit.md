# Exzibo Manager

A React Native / Expo SDK 54 mobile app for restaurant management (orders, bookings, analytics, settings). Built with Expo Router, Better Auth, and React Query.

## Stack
- **Framework**: Expo SDK 54 + Expo Router 6
- **Auth**: Better Auth (`@better-auth/expo`)
- **State**: React Query (`@tanstack/react-query`)
- **Animations**: React Native Reanimated + Gesture Handler
- **Language**: TypeScript

## Project layout
```
frontend/          # All app code lives here
  app/             # Expo Router screens ((app), (auth), etc.)
  src/
    components/    # Shared UI components
    api/           # API client / fetch helpers
    auth/          # Better Auth config
    hooks/         # Custom React hooks
    providers/     # Context providers
    storage/       # Secure/async storage helpers
    utils/         # Utility functions
    constants/     # App-wide constants
  assets/          # Images, fonts, icons
```

## Running on Replit
- **Web preview**: uses the `Start application` workflow — `cd frontend && yarn expo start --web --port 5000`
- **Expo Go (phone)**: uses the `Expo Go (tunnel)` workflow — `cd frontend && yarn expo start --go --tunnel --clear --port 8080`

### First-time setup
Dependencies must be installed before running:
```bash
cd frontend && yarn install
```

## User preferences
