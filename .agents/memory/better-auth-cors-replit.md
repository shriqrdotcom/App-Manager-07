---
name: Better Auth CORS in Replit preview
description: Why Better Auth session checks fail in the Replit web preview when the production backend omits CORS headers.
---

When connecting an Expo web app running in the Replit preview to a Better Auth backend on a different domain, the browser enforces CORS on `fetch` calls such as `GET /api/auth/get-session` and `GET /api/mobile/v1/bootstrap`.

If the production backend does not return an `Access-Control-Allow-Origin` header that includes the Replit preview origin (or `*`), those requests are blocked by the browser with a CORS error. The app UI may still render, but the user cannot sign in or restore a session, and all authenticated routes remain unreachable.

**Why:** Better Auth's Expo/React client uses `fetch` with cookies for session validation. Browsers require CORS for cross-origin `fetch` requests regardless of whether cookies are sent.

**How to apply:**
- Verify the backend CORS / `trustedOrigins` configuration includes the Replit preview origin and `http://127.0.0.1:5000` (the local Expo dev server origin shown in the preview).
- Do not add a frontend-only workaround (proxy, `no-cors`, etc.) without explicit approval; the correct fix is on the backend / Vercel deployment.
- For testing in the web preview, confirm the issue with the browser console and a `curl -I` check of the affected endpoint.
