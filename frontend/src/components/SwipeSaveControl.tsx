import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import type { ResolvedTheme, ThemePalette } from '@/src/providers/ThemeProvider';

const TRACK_HEIGHT = 58;
const KNOB_SIZE = 46;
const TRACK_INSET = 6;
const START_X = TRACK_INSET;

const SPRING_CONFIG = {
  damping: 21,
  stiffness: 270,
  mass: 0.72,
  overshootClamping: false,
};

type Props = {
  enabled: boolean;
  colors: ThemePalette;
  resolvedTheme: ResolvedTheme;
  onConfirm: () => void | Promise<void>;
  resetKey?: number;
  testID?: string;
};

export default function SwipeSaveControl({
  enabled,
  colors,
  resolvedTheme,
  onConfirm,
  resetKey = 0,
  testID,
}: Props) {
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(colors, resolvedTheme), [colors, resolvedTheme]);
  const [trackWidth, setTrackWidth] = useState(0);
  const [focused, setFocused] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const knobX = useSharedValue(START_X);
  const trackWidthSV = useSharedValue(0);
  const dragStartX = useSharedValue(START_X);
  const isDragging = useSharedValue(false);
  const isLocked = useSharedValue(false);
  const completed = useSharedValue(false);
  const successVisibility = useSharedValue(0);
  const successPulse = useSharedValue(0);
  const glowProgress = useSharedValue(0);
  const successRef = useRef(false);
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCompleted = useCallback(() => {
    if (successRef.current) return;
    successRef.current = true;
    setSuccessState(true);
    completionTimer.current = setTimeout(() => {
      completionTimer.current = null;
      void onConfirm();
    }, 800);
  }, [onConfirm]);

  useEffect(() => {
    return () => {
      if (completionTimer.current) clearTimeout(completionTimer.current);
    };
  }, []);

  useEffect(() => {
    successRef.current = false;
    setSuccessState(false);
    knobX.value = START_X;
    completed.value = false;
    isLocked.value = false;
    successVisibility.value = 0;
    successPulse.value = 0;
    glowProgress.value = 0;
  }, [
    completed,
    glowProgress,
    isLocked,
    knobX,
    resetKey,
    successPulse,
    successVisibility,
  ]);

  const completeFromAccessibility = useCallback(() => {
    if (!enabled || successRef.current) return;
    completed.value = true;
    const target = Math.max(START_X, trackWidth - KNOB_SIZE - TRACK_INSET);
    const finish = (finished?: boolean) => {
      'worklet';
      if (!finished) return;
      successVisibility.value = reducedMotion
        ? 1
        : withTiming(1, { duration: 150 });
      if (!reducedMotion) {
        successPulse.value = withSequence(
          withTiming(0.04, { duration: 120 }),
          withTiming(0, { duration: 220 }),
        );
        glowProgress.value = withSequence(
          withTiming(1, { duration: 160 }),
          withTiming(0, { duration: 600 }),
        );
      }
      runOnJS(handleCompleted)();
    };
    knobX.value = reducedMotion
      ? withTiming(target, { duration: 100 }, finish)
      : withSpring(target, SPRING_CONFIG, finish);
  }, [
    enabled,
    handleCompleted,
    glowProgress,
    knobX,
    reducedMotion,
    successPulse,
    successVisibility,
    trackWidth,
    completed,
  ]);

  const pan = Gesture.Pan()
    .enabled(enabled && !successState)
    .activeOffsetX([-4, 4])
    .failOffsetY([-16, 16])
    .onStart(() => {
      if (completed.value || isLocked.value) return;
      dragStartX.value = knobX.value;
      isDragging.value = true;
    })
    .onUpdate((event) => {
      if (completed.value || isLocked.value) return;
      const maxX = Math.max(START_X, trackWidthSV.value - KNOB_SIZE - TRACK_INSET);
      knobX.value = Math.max(
        START_X,
        Math.min(maxX, dragStartX.value + event.translationX),
      );
    })
    .onEnd(() => {
      if (completed.value || isLocked.value) return;
      isDragging.value = false;
      isLocked.value = true;

      const maxX = Math.max(START_X, trackWidthSV.value - KNOB_SIZE - TRACK_INSET);
      const travel = Math.max(1, maxX - START_X);
      const shouldComplete = knobX.value >= START_X + travel * 0.8;

      const finish = (finished?: boolean) => {
        'worklet';
        isLocked.value = false;
        if (!finished || !shouldComplete) return;

        completed.value = true;
        successVisibility.value = reducedMotion
          ? 1
          : withTiming(1, { duration: 150 });
        if (!reducedMotion) {
          successPulse.value = withSequence(
            withTiming(0.04, { duration: 120 }),
            withTiming(0, { duration: 220 }),
          );
          glowProgress.value = withSequence(
            withTiming(1, { duration: 160 }),
            withTiming(0, { duration: 600 }),
          );
        }
        runOnJS(handleCompleted)();
      };

      knobX.value = shouldComplete
        ? reducedMotion
          ? withTiming(maxX, { duration: 100 }, finish)
          : withSpring(maxX, SPRING_CONFIG, finish)
        : reducedMotion
          ? withTiming(START_X, { duration: 100 }, finish)
          : withSpring(START_X, SPRING_CONFIG, finish);
    })
    .onFinalize(() => {
      isDragging.value = false;
    });

  const fillStyle = useAnimatedStyle(() => {
    const maxX = Math.max(START_X + 1, trackWidthSV.value - KNOB_SIZE - TRACK_INSET);
    const progress = interpolate(knobX.value, [START_X, maxX], [0, 1], 'clamp');
    return {
      width: knobX.value + KNOB_SIZE / 2 + 4,
      opacity: 0.42 + progress * 0.28 + glowProgress.value * 0.18,
    };
  });

  const reflectionStyle = useAnimatedStyle(() => {
    const maxX = Math.max(START_X + 1, trackWidthSV.value - KNOB_SIZE - TRACK_INSET);
    const progress = interpolate(knobX.value, [START_X, maxX], [0, 1], 'clamp');
    return {
      opacity: 0.12 + progress * 0.2,
      transform: [{ translateX: progress * Math.max(0, trackWidthSV.value - 92) }],
    };
  });

  const defaultTextStyle = useAnimatedStyle(() => {
    const maxX = Math.max(START_X + 1, trackWidthSV.value - KNOB_SIZE - TRACK_INSET);
    const progress = interpolate(knobX.value, [START_X, START_X + (maxX - START_X) * 0.4, maxX], [1, 0.05, 0], 'clamp');
    return { opacity: progress * (1 - successVisibility.value) };
  });

  const successTextStyle = useAnimatedStyle(() => ({
    opacity: successVisibility.value,
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: knobX.value },
      { scale: 1 + successPulse.value + (isDragging.value ? 0.018 : 0) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowProgress.value,
    transform: [{ scale: 1 + glowProgress.value * 0.12 }],
  }));

  const webInteractionProps =
    Platform.OS === 'web'
      ? {
          tabIndex: 0,
          onKeyDown: (event: { key: string; preventDefault?: () => void }) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault?.();
              completeFromAccessibility();
            }
          },
        }
      : {};

  return (
    <View
      {...(webInteractionProps as Record<string, unknown>)}
      style={[styles.track, focused && styles.trackFocused, !enabled && styles.trackDisabled]}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        setTrackWidth(width);
        trackWidthSV.value = width;
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessible
      focusable
      accessibilityRole="button"
      accessibilityLabel={successState ? 'Review link saved' : 'Swipe right to save review link'}
      accessibilityHint={successState ? undefined : 'Drag the Google logo to the right to save'}
      accessibilityState={{ disabled: !enabled, busy: successState }}
      accessibilityActions={[{ name: 'activate', label: 'Save review link' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') completeFromAccessibility();
      }}
      onAccessibilityTap={completeFromAccessibility}
      testID={testID}
    >
      <BlurView
        intensity={28}
        tint={resolvedTheme === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.025)', 'rgba(255,255,255,0.07)']}
        locations={[0, 0.48, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Animated.View style={[styles.fill, fillStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.055)']}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.reflection, reflectionStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.11)', 'rgba(255,255,255,0)']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />

      <Animated.Text style={[styles.defaultText, defaultTextStyle]} pointerEvents="none">
        Swipe to Save
      </Animated.Text>
      <Animated.View style={[styles.successContent, successTextStyle]} pointerEvents="none">
        <Feather name="check" size={16} color="#FFFFFF" />
        <Text style={styles.successText}>Saved</Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.knob, knobStyle]}>
          <FontAwesome6 name="google" size={23} color="#4285F4" />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const createStyles = (colors: ThemePalette, resolvedTheme: ResolvedTheme) => StyleSheet.create({
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: resolvedTheme === 'dark'
      ? 'rgba(255,255,255,0.075)'
      : 'rgba(24,24,27,0.9)',
    borderWidth: 1,
    borderColor: resolvedTheme === 'dark'
      ? 'rgba(255,255,255,0.2)'
      : 'rgba(255,255,255,0.28)',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  trackFocused: {
    borderColor: colors.foreground,
  },
  trackDisabled: {
    opacity: 0.45,
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  reflection: {
    position: 'absolute',
    top: -18,
    left: -48,
    width: 42,
    height: TRACK_HEIGHT + 36,
    borderRadius: 28,
    overflow: 'hidden',
    transform: [{ rotate: '18deg' }],
  },
  glow: {
    position: 'absolute',
    width: KNOB_SIZE + 22,
    height: KNOB_SIZE + 22,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  defaultText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  successContent: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  knob: {
    position: 'absolute',
    left: 0,
    top: (TRACK_HEIGHT - KNOB_SIZE) / 2,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: resolvedTheme === 'dark'
      ? 'rgba(255,255,255,0.2)'
      : 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});