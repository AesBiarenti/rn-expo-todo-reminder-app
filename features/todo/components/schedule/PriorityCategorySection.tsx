import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CATEGORIES } from "../../../../constants/categories";
import { PRIORITY_COLORS } from "../../../../constants/theme";
import { useTheme } from "../../../../context/ThemeContext";
import { PRIORITIES } from "../../constants";
import type { CategoryId, Priority } from "../../../../types/todo";

interface PriorityCategorySectionProps {
  priority: Priority;
  onPriorityChange: (p: Priority) => void;
  categoryId: CategoryId | undefined;
  onCategoryChange: (c: CategoryId | undefined) => void;
}

export function PriorityCategorySection({
  priority,
  onPriorityChange,
  categoryId,
  onCategoryChange,
}: PriorityCategorySectionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    priorityLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8 },
    priorityRow: { flexDirection: "row", gap: 8 },
    priorityBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.border,
    },
    priorityBtnText: { fontSize: 13, fontWeight: "500", color: colors.text },
    categoryLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8, marginTop: 16 },
    categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    categoryChip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.border,
    },
    categoryChipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
    categoryChipText: { fontSize: 13, fontWeight: "500", color: colors.textMuted },
    categoryChipTextActive: { color: colors.accent, fontWeight: "600" },
  });
  return (
    <>
      <Text style={styles.priorityLabel}>{t("addModal.priority")}</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => onPriorityChange(p.value)}
            style={[
              styles.priorityBtn,
              priority === p.value && {
                backgroundColor: PRIORITY_COLORS[p.value] + "30",
                borderColor: PRIORITY_COLORS[p.value],
              },
            ]}
          >
            <View
              style={[
                { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIORITY_COLORS[p.value] },
              ]}
            />
            <Text
              style={[
                styles.priorityBtnText,
                priority === p.value && { color: PRIORITY_COLORS[p.value] },
              ]}
            >
              {t(p.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.categoryLabel}>{t("addModal.category")}</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => onCategoryChange(categoryId === c.id ? undefined : c.id)}
            style={[styles.categoryChip, categoryId === c.id && styles.categoryChipActive]}
          >
            <Text
              style={[
                styles.categoryChipText,
                categoryId === c.id && styles.categoryChipTextActive,
              ]}
            >
              {t(`categories.${c.id}`)}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
