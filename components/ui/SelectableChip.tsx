import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../../context/ThemeContext";

interface SelectableChipProps {
  selected: boolean;
  onPress: () => void;
  /** i18n key or raw string (if labelIsRaw, displayed as-is) */
  label: string;
  /** If true, label is displayed as-is without translation */
  labelIsRaw?: boolean;
  children?: ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "default" | "outline";
  layout?: "row" | "column";
  /** Override border color when selected (e.g. for priority chips) */
  activeBorderColor?: string;
  /** Override background color when selected */
  activeBackgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function SelectableChip({
  selected,
  onPress,
  label,
  labelIsRaw = false,
  children,
  icon,
  variant = "default",
  layout = "row",
  activeBorderColor,
  activeBackgroundColor,
  style,
}: SelectableChipProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const accentColor = activeBorderColor ?? colors.accent;
  const borderColor = selected ? accentColor : colors.border;
  const backgroundColor = selected
    ? (activeBackgroundColor ?? colors.accentDim)
    : "transparent";

  const styles = StyleSheet.create({
    chip: {
      flexDirection: layout,
      alignItems: "center",
      justifyContent: "center",
      gap: layout === "row" ? 6 : 4,
      paddingVertical: layout === "column" ? 16 : 10,
      paddingHorizontal: layout === "column" ? 16 : variant === "outline" ? 14 : 16,
      borderRadius: layout === "column" ? 20 : 16,
      borderWidth: 2,
      borderColor,
      backgroundColor,
      minWidth: layout === "column" ? 100 : undefined,
    },
    text: {
      fontSize: layout === "column" ? 12 : 13,
      fontWeight: selected ? "600" : "500",
      color: selected ? accentColor : colors.textMuted,
    },
  });

  const iconColor = selected ? accentColor : colors.textMuted;

  return (
    <AnimatedPressable onPress={onPress} style={[styles.chip, style]}>
      {icon && <Ionicons name={icon} size={layout === "column" ? 28 : 18} color={iconColor} />}
      {children}
      <Text style={styles.text}>{labelIsRaw ? label : t(label)}</Text>
    </AnimatedPressable>
  );
}
