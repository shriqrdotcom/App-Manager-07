/**
 * SwipePager — WhatsApp-style horizontal pager.
 *
 * All pages are kept mounted side-by-side so scroll positions and loaded data
 * are preserved across tab switches. A single Pan gesture drives the entire
 * strip; one gesture can move at most one page.
 *
 * Direction convention:
 *   swipe LEFT  (finger moves left)  → next page (higher index)
 *   swipe RIGHT (finger moves right) → prev page (lower index)
 *
 * Width is measured from the container via onLayout so it works correctly on
 * web even when the viewport is constrained to a phone-sized frame via CSS.
 */
import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SPRING_CONFIG = {
  damping: 32,
  stiffness: 320,
  mass: 0.85,
  overshootClamping: false,
};

/** Minimum horizontal drag to commit a page change. */
const COMMIT_DIST = 56;
/** Minimum fling velocity (px/s) to commit even on a short drag. */
const COMMIT_VEL = 380;
/** Minimum drag required when using velocity shortcut. */
const MIN_VEL_DIST = 20;

type SwipePagerProps = {
  /** Rendered page nodes (all kept mounted simultaneously). */
  pages: ReactNode[];
  /** Controlled active page index (0-based). */
  activeIndex: number;
  /**
   * Fired immediately when a swipe is committed — before the snap animation
   * finishes. Update `activeIndex` from this callback. The bottom-nav icon
   * updates at this moment so it feels instant.
   */
  onCommit: (index: number) => void;
};

export default function SwipePager({ pages, activeIndex, onCommit }: SwipePagerProps) {
  const n = pages.length;

  // Use the window width as the starting value so the first render is
  // correct on native.  On web the CSS phone frame may constrain the
  // container to a smaller size; onLayout corrects W once the DOM settles.
  const { width: windowWidth } = useWindowDimensions();
  const [W, setW] = useState(windowWidth);

  // Steady-state: offset = -(activeIndex * W)
  const offset = useSharedValue(-activeIndex * W);
  // Mirror of activeIndex on the UI thread so worklets can read it safely.
  const activeSV = useSharedValue(activeIndex);
  // Mirror of W on the UI thread so worklets can read the current page width.
  const wSV = useSharedValue(W);
  // Locked while a snap animation is running to block concurrent gestures.
  const isLocked = useSharedValue(false);

  // Prevents the sync useEffect from firing a redundant spring after a
  // gesture has already started the animation.
  const fromGesture = useRef(false);
  const isFirstRender = useRef(true);

  // When the container's measured width changes (e.g. web CSS phone frame
  // constrains the viewport), reset the shared value and snap to the current
  // active page using the new width.
  useEffect(() => {
    wSV.value = W;
    offset.value = -(activeSV.value * W);
  }, [W]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // First render: offset is already initialised correctly; just sync the SV.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      activeSV.value = activeIndex;
      return;
    }

    activeSV.value = activeIndex;

    if (!fromGesture.current) {
      // External change (e.g. bottom-nav tap) — jump immediately, no animation.
      offset.value = -activeIndex * W;
    }
    fromGesture.current = false;
  }, [activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCommit = useCallback(
    (index: number) => {
      fromGesture.current = true; // suppress the sync useEffect's spring
      onCommit(index);
    },
    [onCommit],
  );

  // Measure the actual rendered container width so pages fill it exactly.
  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      if (w > 0 && w !== W) {
        setW(w);
      }
    },
    [W],
  );

  const pan = Gesture.Pan()
    // Activate only after clear horizontal movement.
    .activeOffsetX([-10, 10])
    // Fail if the gesture is clearly vertical — keeps FlatList scrolling working.
    .failOffsetY([-18, 18])
    .onUpdate((e) => {
      if (isLocked.value) return;

      // Content follows the finger: right-swipe (positive tx) shifts strip rightward →
      // prev page (lower index) slides into view from the left.
      const raw = -(activeSV.value * wSV.value) + e.translationX;

      // Clamp so the drag cannot cross more than one page boundary,
      // and cannot drag past the very first or very last page.
      const lo =
        activeSV.value < n - 1
          ? -((activeSV.value + 1) * wSV.value) // hard stop at next page
          : -(activeSV.value * wSV.value);       // at last page: no movement past end
      const hi =
        activeSV.value > 0
          ? -((activeSV.value - 1) * wSV.value) // hard stop at prev page
          : -(activeSV.value * wSV.value);       // at first page: no movement past start
      offset.value = Math.max(lo, Math.min(hi, raw));
    })
    .onEnd((e) => {
      if (isLocked.value) return;

      const cur = activeSV.value;
      // left swipe → next (+1)  |  right swipe → prev (−1)
      const dir = e.translationX < 0 ? 1 : -1;
      const target = cur + dir;

      const committed =
        target >= 0 &&
        target < n &&
        (Math.abs(e.translationX) >= COMMIT_DIST ||
          (Math.abs(e.velocityX) >= COMMIT_VEL &&
            Math.abs(e.translationX) >= MIN_VEL_DIST));

      const dest = committed ? target : cur;

      // Lock immediately so a second finger-down cannot race the snap.
      isLocked.value = true;

      if (committed) {
        // Update the UI-thread index BEFORE the spring so subsequent
        // onUpdate/onFinalize calls clamp against the new index.
        activeSV.value = dest;
        // Notify JS (updates bottom-nav instantly, before snap finishes).
        runOnJS(handleCommit)(dest);
      }

      offset.value = withSpring(-(dest * wSV.value), SPRING_CONFIG, () => {
        isLocked.value = false;
      });
    })
    .onFinalize(() => {
      // Safety net: if the gesture was interrupted without firing onEnd,
      // snap back to wherever activeSV currently points.
      if (!isLocked.value) {
        const cur = activeSV.value;
        isLocked.value = true;
        offset.value = withSpring(-(cur * wSV.value), SPRING_CONFIG, () => {
          isLocked.value = false;
        });
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.container} onLayout={handleLayout}>
        <Animated.View style={[styles.strip, animStyle]}>
          {pages.map((page, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <View key={i} style={[styles.page, { width: W }]}>
              {page}
            </View>
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  /**
   * Container clips the strip to exactly one page width.
   * overflow:'hidden' is reliable for rectangular clipping on both platforms.
   */
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  /**
   * Strip is absolutely sized so it can be wider than its parent without
   * shrinking.  top/bottom:0 gives it the container's full height.
   * translateX moves it; the container clips everything outside view.
   */
  strip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  /**
   * Each page width is set via inline style from the measured container width.
   * Height is inherited from the strip (alignItems:'stretch' default).
   */
  page: {},
});
