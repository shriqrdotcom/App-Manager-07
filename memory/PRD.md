# Exzibo Manager — PRD (imported port)

## Overview
A React Native / Expo port of the GitHub repo `shriqrdotcom/App-Manager-07` (Exzibo Manager), a restaurant management mobile app. The original repo was a pnpm monorepo on Expo SDK 57 with an Express + Postgres + Better-Auth backend and Google OAuth. It was rebuilt on this platform's stack: **Expo SDK 54 + FastAPI + MongoDB + JWT email/password auth**, preserving the app's screens, navigation, and visual language.

## Features
- **Dark professional UI** — near-black background (`#121313`), dark cards with subtle borders, soft white text, muted grey secondary, limited accent colours (indigo/green/amber/red/purple) for status only. No gradients or glass effects.
- **Global chrome:** SafeArea-aware **TopHeader** (restaurant logo/name/description + share/bell/more pill) and fixed **BottomNavigation** with 5 tabs — Orders, Booking, Edit, Analytics, Settings.
- **Auth:** Email/password sign in + sign up. JWT stored in expo-secure-store (native) / localStorage (web). Demo user auto-seeded (`demo@exzibo.com` / `demo1234`).
- **Restaurant selection:** Users with >1 restaurant see a picker after login; users with exactly 1 go straight to Orders.
- **Orders:** Live-service indicator, search + filter actions, 4 summary cards (active/pending/avg prep/revenue), status chips (New/Confirmed/Preparing/Ready) with counts, order cards with type badge (dine-in/takeaway/delivery), items, notes, total, payment pill, and context-aware primary action (Accept/Reject → Start → Mark ready → Complete).
- **Booking:** Search + filter actions, Table bookings / Private rooms tabs, horizontal date strip (with per-day counts), booking cards with guest initials, phone (with Call), status pill, notes, and stage-aware primary action (Confirm → Mark arrived → Seat guest → Complete). Toast confirmations.
- **Edit Menu:** Search bar, quick-actions row (Add item / Combos / Categories), Menu items / Combo offers tabs, All/Active/Paused status filter chips. Item cards show image, veg indicator, name, category, price, bestseller badge, Active/Paused pill, availability Switch, Edit & More buttons. Combo cards show items, current + strikethrough old price, savings badge, and Edit / Publish-Pause / Delete actions.
- **Analytics:** Today / 7 Days / 30 Days / Custom range filter, 4 KPI cards with % delta vs previous period, Revenue trend bars, Orders-by-hour thin bars, Booking trend dots, Order-source stacked bar with legend.
- **Settings:** Search field, profile row (Danny-Rico-style) + Team access, Restaurant identity card (logo/name/desc + edit + social links), grouped sections — Account & Team (Notifications/Theme/Language/Help), Restaurant Information (Hours/Email/Mobile/Location), Public Content (Google Review/Hero Gallery/Gallery Text/About), Security & Application (Privacy/App info/Logout). Logout has a confirmation modal.

## Stack
- **Frontend:** Expo SDK 54, expo-router, React Native 0.81, expo-secure-store, @expo/vector-icons, expo-haptics
- **Backend:** FastAPI + Motor (MongoDB), bcrypt, JWT (HS256, python-jose)
- **State:** React Context (`AppProvider`)

## API endpoints (all `/api` prefix)
- `POST /auth/register` → `{ access_token, user }`, also auto-adds membership to Demo Diner
- `POST /auth/login` → `{ access_token, user }`
- `GET /auth/me` → current user (Bearer)
- `GET /bootstrap` → `{ user, restaurants[] }` (Bearer)
- `GET /bookings?restaurant_id=&date=YYYY-MM-DD` → `Booking[]` (Bearer, membership required)
- `POST /bookings` → creates a booking. Enforces double-booking check (same restaurant + seat + date, within 90-min window). Returns **409** on conflict with `detail`.

## Manual booking creation
- **Floating "+" button** on the Bookings screen (56×56, bottom-right, above bottom nav & safe-area, accessibility label "Add booking").
- **`/add-booking` full-screen page** with back button and header. Sections: Guest details · Date & time · Seating · Additional details. All 15 required features are implemented — booking type toggle (Table / Private room), name, mobile with country-code picker, date picker (30-day list), time text input, stepper for guests (1–30), seating-area chips → available table/room chips, status (Pending/Confirmed), source (Phone/Walk-in/WhatsApp/Other), special request, private staff note, per-field validation errors, disabled submit while pending, KeyboardAvoidingView, Cancel + Create actions.
- On success the page pops back to Bookings and the list refetches via `useFocusEffect` — new booking appears immediately.

## Deviations from original repo
- Better-Auth + Google OAuth → simple JWT email/password (documented in `test_credentials.md`).
- Postgres + Drizzle → MongoDB + Motor.
- Restaurant memberships were derived from Better-Auth org roles; here they live in a `memberships` collection.
- Orders/Calendar/Analytics used mock data in the original (placeholder screens); this port ships richer mock-data UIs so the screens actually feel usable.

## Test credentials
See `/app/memory/test_credentials.md`.
