import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../../context/ThemeContext";

interface RemovableChipListProps {
  values: string[];
  onRemove: (value: string) => void;
  onAdd: () => void;
  addLabel?: string;
  placeholder?: string;
}

export function RemovableChipList({
  values,
  onRemove,
  onAdd,
  addLabel = "addModal.addTime",
  placeholder,
}: RemovableChipListProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 24,
      backgroundColor: colors.surfaceHover,
    },
    chipText: { fontSize: 14, color: colors.text, fontWeight: "500" },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.accent,
      borderStyle: "dashed",
    },
    addText: { fontSize: 14, color: colors.accent, fontWeight: "500" },
    placeholder: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  });

  return (
    <>
      <View style={styles.row}>
        {values.map((v) => (
          <AnimatedPressable
            key={v}
            style={styles.chip}
            onPress={() => onRemove(v)}
          >
            <Text style={styles.chipText}>{v}</Text>
            <Ionicons name="close" size={14} color={colors.textMuted} />
          </AnimatedPressable>
        ))}
        <AnimatedPressable style={styles.addBtn} onPress={onAdd}>
          <Ionicons name="add" size={18} color={colors.accent} />
          <Text style={styles.addText}>{t(addLabel)}</Text>
        </AnimatedPressable>
      </View>
      {placeholder && values.length === 0 && (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}
    </>
  );
}
