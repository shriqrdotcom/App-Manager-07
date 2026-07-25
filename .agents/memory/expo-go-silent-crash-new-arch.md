---
name: Expo Go silent crash with New Architecture
description: Why an Expo SDK 54 project with `newArchEnabled: true` shows only "Something went wrong" in Expo Go, and how to recover.
---

## Rule

If an Expo SDK 54 project loads fine in the Replit web preview but shows **“Something went wrong”** in Expo Go with no detailed error, disable the New Architecture by setting `newArchEnabled: false` in `app.json`.

**Why:** The Expo Go app on the user’s phone may not have a build of the New Architecture runtime that exactly matches the project’s native dependency set, especially when transitive native modules like `react-native-reanimated` / `react-native-worklets` are present. The failure happens before the app’s own error boundary can render, so Expo Go shows only a generic screen.

**How to apply:**

1. Set `"newArchEnabled": false` in `app.json`.
2. Clear `.expo` and Metro cache (`rm -rf frontend/.expo frontend/.metro-cache`).
3. Restart the Expo dev server with `--go --tunnel --clear`.
4. Re-scan the freshly generated QR code.

**Additional permanent fixes that must be present for Expo Go to work at all:**

- `frontend/babel.config.js` must exist with `babel-preset-expo` (and `react-native-worklets/plugin` if `react-native-reanimated` is in the dependency tree).
- `expo-network` must match the Expo SDK 54 expected version (`~8.0.8`, not `57.0.1`).
- The Replit Run workflow must use `--go --tunnel --clear --port 5000` so the generated QR code is reachable from the public internet, not `localhost`/`LAN`.

**Why this matters:** Replit’s environment is cloud-hosted; the Expo dev server must expose a public tunnel URL (via `@expo/ngrok`) for a physical phone to reach it. The default `localhost`/`LAN` modes are invisible to the phone.
