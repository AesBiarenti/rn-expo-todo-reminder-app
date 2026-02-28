import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../../context/ThemeContext";

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  rightContent?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function MenuItem({
  icon,
  label,
  onPress,
  rightContent,
  disabled = false,
  style,
}: MenuItemProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: colors.surfaceHover,
      marginBottom: 8,
    },
    content: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minWidth: 0,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    labelDisabled: { color: colors.textMuted, opacity: 0.7 },
  });

  const content = (
    <>
      <Ionicons
        name={icon}
        size={22}
        color={colors.textMuted}
      />
      <View style={styles.content}>
        <Text
          style={[styles.label, disabled && styles.labelDisabled]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {t(label)}
        </Text>
        {rightContent}
      </View>
    </>
  );

  if (onPress && !disabled) {
    return (
      <AnimatedPressable onPress={onPress} style={[styles.row, style]}>
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={[styles.row, style]}>{content}</View>;
}
