---
name: Expo gesture animations
description: Compatibility guidance for swipe animations in this Expo SDK 54 app.
---

Use `react-native-gesture-handler` gestures with `react-native-reanimated` shared values for interactive swipe animations in this Expo app. Avoid relying on legacy `Animated` with `useNativeDriver` for the web/Expo Go preview path.

**Why:** The legacy responder implementation emitted native-driver fallback warnings in the web preview and triggered a transient error-boundary failure during Metro reloads. The installed Gesture Handler/Reanimated stack bundles and runs cleanly across the preview and Expo workflow.

**How to apply:** Keep gesture animations inside a `GestureDetector`, use `useSharedValue`/`useAnimatedStyle`, and keep route changes on the JS thread with `runOnJS`. Clear Metro cache after replacing gesture modules if an unresolved-module error appears.