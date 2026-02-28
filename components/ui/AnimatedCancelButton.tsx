import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../../context/ThemeContext";

interface AnimatedCancelButtonProps {
  onPress: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
  /** Use flex: 1 for equal-width layout (e.g. in modal actions row) */
  flex?: boolean;
}

export function AnimatedCancelButton({
  onPress,
  label = "common.cancel",
  style,
  flex = false,
}: AnimatedCancelButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    btn: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 16,
      backgroundColor: colors.surfaceHover,
      alignItems: "center",
      justifyContent: "center",
      ...(flex && { flex: 1 }),
    },
    text: { fontSize: 16, fontWeight: "600", color: colors.text },
  });

  return (
    <AnimatedPressable onPress={onPress} style={[styles.btn, style]}>
      <Text style={styles.text}>{t(label)}</Text>
    </AnimatedPressable>
  );
}
