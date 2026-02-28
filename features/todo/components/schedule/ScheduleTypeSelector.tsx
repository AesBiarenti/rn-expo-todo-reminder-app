import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { SelectableChip } from "../../../../components/ui/SelectableChip";
import { useTheme } from "../../../../context/ThemeContext";
import type { TaskScheduleType } from "../../../../types/todo";
import { SCHEDULE_TYPES } from "../../constants";

interface ScheduleTypeSelectorProps {
  value: TaskScheduleType;
  onChange: (type: TaskScheduleType) => void;
}

export function ScheduleTypeSelector({
  value,
  onChange,
}: ScheduleTypeSelectorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    typeHint: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
      marginBottom: 12,
    },
    typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  });
  return (
    <>
      <Text style={styles.typeHint}>{t("addModal.selectType")}</Text>
      <View style={styles.typeGrid}>
        {SCHEDULE_TYPES.map((st) => (
          <SelectableChip
            key={st.value}
            selected={value === st.value}
            onPress={() => onChange(st.value)}
            label={st.labelKey}
            icon={st.icon as keyof typeof Ionicons.glyphMap}
            layout="column"
            style={{ width: "30%", minWidth: 100 }}
          />
        ))}
      </View>
    </>
  );
}
