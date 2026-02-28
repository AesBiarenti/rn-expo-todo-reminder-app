import { Ionicons } from "@expo/vector-icons";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../../context/ThemeContext";

interface AnimatedSaveButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  showIcon?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Use flex: 1 for equal-width layout (e.g. in modal actions row) */
  flex?: boolean;
}

export function AnimatedSaveButton({
  onPress,
  disabled = false,
  label = "common.save",
  showIcon = true,
  style,
  flex = false,
}: AnimatedSaveButtonProps) {
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
      ...(flex && { flex: 1 }),
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
      {showIcon && <Ionicons name="checkmark" size={20} color={colors.bg} />}
      <Text style={styles.text}>{t(label)}</Text>
    </AnimatedPressable>
  );
}
