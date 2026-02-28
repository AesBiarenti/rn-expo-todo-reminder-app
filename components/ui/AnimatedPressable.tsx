import type { ReactNode } from "react";
import { useCallback } from "react";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SOFT_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);
const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends Omit<PressableProps, "style"> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Slight scale on press (default 0.97) */
  activeScale?: number;
  /** Opacity on press (default 0.88) */
  activeOpacity?: number;
}

export function AnimatedPressable({
  children,
  style,
  activeScale = 0.97,
  activeOpacity = 0.88,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) => {
      if (disabled) return;
      scale.value = withTiming(activeScale, { duration: 120, easing: SOFT_EASING });
      opacity.value = withTiming(activeOpacity, { duration: 120, easing: SOFT_EASING });
      onPressIn?.(e);
    },
    [activeScale, activeOpacity, disabled, onPressIn, scale, opacity]
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]) => {
      scale.value = withTiming(1, { duration: 200, easing: SOFT_EASING });
      opacity.value = withTiming(1, { duration: 200, easing: SOFT_EASING });
      onPressOut?.(e);
    },
    [onPressOut, scale, opacity]
  );

  return (
    <AnimatedPressableBase
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
