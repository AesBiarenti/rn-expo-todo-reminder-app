import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { SelectableChip } from "../../../../components/ui/SelectableChip";
import { CATEGORIES } from "../../../../constants/categories";
import { PRIORITY_COLORS } from "../../../../constants/theme";
import { useTheme } from "../../../../context/ThemeContext";
import type { CategoryId, Priority } from "../../../../types/todo";
import { PRIORITIES } from "../../constants";

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
    priorityLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
      marginBottom: 8,
    },
    priorityRow: { flexDirection: "row", gap: 8 },
    categoryLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
      marginBottom: 8,
      marginTop: 16,
    },
    categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  });

  return (
    <>
      <Text style={styles.priorityLabel}>{t("addModal.priority")}</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map((p) => (
          <SelectableChip
            key={p.value}
            selected={priority === p.value}
            onPress={() => onPriorityChange(p.value)}
            label={p.labelKey}
            variant="outline"
            activeBorderColor={PRIORITY_COLORS[p.value]}
            activeBackgroundColor={PRIORITY_COLORS[p.value] + "30"}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: PRIORITY_COLORS[p.value],
              }}
            />
          </SelectableChip>
        ))}
      </View>
      <Text style={styles.categoryLabel}>{t("addModal.category")}</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <SelectableChip
            key={c.id}
            selected={categoryId === c.id}
            onPress={() =>
              onCategoryChange(categoryId === c.id ? undefined : c.id)
            }
            label={`categories.${c.id}`}
          />
        ))}
      </View>
    </>
  );
}
