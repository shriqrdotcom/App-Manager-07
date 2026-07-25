---
name: SwipePager architecture
description: How the five main tabs are rendered as a mounted pager instead of Stack navigation, and the lessons that drove each decision.
---

## Rule
The five main app tabs (Orders / Booking / Edit / Analytics / Settings) are rendered simultaneously in `SwipePager` inside `app/(app)/tabs.tsx`, NOT via Expo Router's Stack. The Stack in `app/(app)/_layout.tsx` only handles `select-restaurant` and `tabs`.

## Why
Expo Router's Stack unmounts and remounts screens on every tab switch, which:
- Loses scroll positions and loaded data
- Triggers duplicate API requests
- Causes a visible flicker (new screen content appears while an outgoing animation is still running)

Keeping all five screens mounted side-by-side eliminates all three problems.

## How it's structured
- `frontend/src/components/SwipePager.tsx` — Reanimated pager; all pages in a horizontal strip with `position: absolute, top: 0, left: 0, bottom: 0` + `overflow: hidden` on the container. One `isLocked` shared value prevents multi-page swipes.
- `frontend/app/(app)/tabs.tsx` — module-level `PAGES` constant (5 JSX elements) so React never remounts screens. Manages `activeIndex` state; passes `onCommit` (fires on gesture commit before snap) and `onTabPress` (from bottom nav) to control the pager.
- `frontend/src/components/BottomNavigation.tsx` — accepts optional `activeIndex` + `onTabPress` props; falls back to `usePathname()` when not in pager mode.
- `frontend/app/index.tsx` — redirects `state === 'home'` to `/(app)/tabs` (was `/(app)/orders`).
- `frontend/app/(app)/select-restaurant.tsx` — calls `router.replace('/(app)/tabs')` after `selectRestaurant`.

## Gesture convention
Swipe RIGHT (translationX > 0) → next page (higher index). Strip offset is negated: `raw = -(activeIndex * W) - translationX`, so right-drag moves the strip left, revealing the next page from the right.

## `useFocusEffect` in booking.tsx
Kept as-is. Since the booking component is always mounted inside the `tabs` Stack screen, `useFocusEffect` fires when:
1. The `tabs` screen first gains focus (initial load) → triggers first fetch ✓
2. The `tabs` screen regains focus after `add-booking` pops from the root Stack → triggers refresh ✓

No pager-level focus context is needed for the current requirements.

## Reanimated 4 web warning
`useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }))` emits a "using shared value's .value inside reanimated inline style" warning in the Reanimated 4.x web renderer. This is a false positive — the pattern is correct and works on Android/Expo Go with no issues.

## Key pitfall: module-level PAGES
The `PAGES` array must be defined at module scope (not inside the component render function). If defined inside render, new React element objects are created on every state update, causing React to remount all five screens on every `activeIndex` change.
