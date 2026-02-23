import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import { SCHEDULE_TYPES } from "../../constants";
import type { TaskScheduleType } from "../../../../types/todo";

interface ScheduleTypeSelectorProps {
  value: TaskScheduleType;
  onChange: (type: TaskScheduleType) => void;
}

export function ScheduleTypeSelector({ value, onChange }: ScheduleTypeSelectorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    typeHint: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 12 },
    typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    typeCard: {
      width: "30%",
      minWidth: 100,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.border,
    },
    typeCardActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
    typeCardText: { fontSize: 12, fontWeight: "500", color: colors.textMuted, marginTop: 6 },
    typeCardTextActive: { color: colors.accent, fontWeight: "600" },
  });
  return (
    <>
      <Text style={styles.typeHint}>{t("addModal.selectType")}</Text>
      <View style={styles.typeGrid}>
        {SCHEDULE_TYPES.map((st) => (
          <Pressable
            key={st.value}
            onPress={() => onChange(st.value)}
            style={[styles.typeCard, value === st.value && styles.typeCardActive]}
          >
            <Ionicons
              name={st.icon as keyof typeof Ionicons.glyphMap}
              size={28}
              color={value === st.value ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.typeCardText, value === st.value && styles.typeCardTextActive]}>
              {t(st.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
