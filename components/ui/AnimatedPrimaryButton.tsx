import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../../context/ThemeContext";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface AnimatedPrimaryButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label: string;
  iconLeft?: IoniconsName;
  iconRight?: IoniconsName;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedPrimaryButton({
  onPress,
  disabled = false,
  label,
  iconLeft,
  iconRight,
  style,
}: AnimatedPrimaryButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 16,
      backgroundColor: colors.accent,
      ...(disabled && { opacity: 0.5 }),
    },
    text: { fontSize: 16, fontWeight: "600", color: colors.bg },
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, style]}
    >
      {iconLeft && (
        <Ionicons name={iconLeft} size={18} color={colors.bg} />
      )}
      <Text style={styles.text}>{t(label)}</Text>
      {iconRight && (
        <Ionicons name={iconRight} size={20} color={colors.bg} />
      )}
    </AnimatedPressable>
  );
}
