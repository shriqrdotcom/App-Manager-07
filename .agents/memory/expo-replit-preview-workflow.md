---
name: Expo Replit preview workflow
description: Replit web previews should use Expo Web locally instead of an Expo Go ngrok tunnel.
---

Replit’s proxied preview is most reliable when an Expo app runs with `expo start --web --lan` on port 5000. The Expo Go `--tunnel` mode depends on an external ngrok tunnel and can fail before the local Metro server is available.

**Why:** The imported app’s tunnel failed with a remote ngrok disconnect even though Metro itself was healthy, while Expo Web served the dashboard successfully.

**How to apply:** Keep the Replit workflow on Expo Web for preview; reserve Expo Go/tunnel commands for local native-device development.