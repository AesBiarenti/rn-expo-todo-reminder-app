import { Ionicons } from "@expo/vector-icons";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../../context/ThemeContext";

interface PickerRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function PickerRow({ icon, label, value, onPress, style }: PickerRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      backgroundColor: colors.surfaceHover,
      borderRadius: 16,
      marginBottom: 10,
    },
    label: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
      minWidth: 80,
    },
    value: { flex: 1, fontSize: 15, color: colors.textMuted },
  });

  return (
    <AnimatedPressable onPress={onPress} style={[styles.row, style]}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={styles.label}>{t(label)}</Text>
      <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </AnimatedPressable>
  );
}
