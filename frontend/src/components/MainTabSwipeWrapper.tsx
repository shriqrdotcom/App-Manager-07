import React, { type ReactNode, useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';

const SWIPE_DISTANCE = 72;
const SWIPE_VELOCITY = 0.55;
const MIN_VELOCITY_DISTANCE = 32;
const HORIZONTAL_BIAS = 1.15;

const MAIN_TABS = [
  '/(app)/orders',
  '/(app)/booking',
  '/(app)/edit',
  '/(app)/analytics',
  '/(app)/settings',
] as const;

function getMainTabIndex(pathname: string | null): number {
  if (!pathname) return -1;
  return MAIN_TABS.findIndex((path) => pathname.endsWith(path.split('/').pop() ?? ''));
}

type MainTabSwipeWrapperProps = {
  children: ReactNode;
};

function navigateToMainTab(index: number) {
  if (index >= 0 && index < MAIN_TABS.length) {
    router.navigate(MAIN_TABS[index]);
  }
}

/**
 * Adds swipe navigation only to the five primary app pages.
 *
 * The gesture does not activate on touch-down. It waits for clear horizontal
 * movement and fails when vertical movement is stronger, leaving lists and
 * vertical scrolling to their native controls. Interactive children also get
 * first responder opportunity because the detector does not capture starts.
 */
export default function MainTabSwipeWrapper({ children }: MainTabSwipeWrapperProps) {
  const pathname = usePathname();
  const tabIndex = useMemo(() => getMainTabIndex(pathname), [pathname]);
  const translateX = useSharedValue(0);
  const screenWidth = Dimensions.get('window').width;
  const { colors } = useTheme();

  useEffect(() => {
    translateX.value = 0;
  }, [pathname, translateX]);

  const panGesture = Gesture.Pan()
    .enabled(tabIndex >= 0)
    .activeOffsetX([-12, 12])
    .failOffsetY([-24, 24])
    .onUpdate((event) => {
      if (Math.abs(event.translationX) > Math.abs(event.translationY) * HORIZONTAL_BIAS) {
        translateX.value = Math.max(
          -screenWidth,
          Math.min(screenWidth, event.translationX),
        );
      }
    })
    .onEnd((event) => {
      const direction = event.translationX > 0 ? 1 : -1;
      const targetIndex = tabIndex + direction;
      const hasClearDistance = Math.abs(event.translationX) >= SWIPE_DISTANCE;
      const hasClearVelocity =
        Math.abs(event.velocityX) >= SWIPE_VELOCITY &&
        Math.abs(event.translationX) >= MIN_VELOCITY_DISTANCE;
      const canNavigate =
        targetIndex >= 0 && targetIndex < MAIN_TABS.length;

      if ((hasClearDistance || hasClearVelocity) && canNavigate) {
        // Keep the new page at the finger's release position while the route
        // changes, then spring it into place. This avoids a blank frame and
        // makes the selected bottom-nav item update immediately.
        runOnJS(navigateToMainTab)(targetIndex);
      }

      translateX.value = withSpring(0, {
        damping: 24,
        stiffness: 240,
        mass: 0.8,
      });
    })
    .onFinalize(() => {
      translateX.value = withSpring(0, {
        damping: 24,
        stiffness: 240,
        mass: 0.8,
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.stage, { backgroundColor: colors.background }, animatedStyle]}
        testID="main-tab-swipe-wrapper"
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    overflow: 'hidden',
  },
});
