import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CATEGORIES } from "../../../constants/categories";
import { COLORS } from "../../../constants/theme";
import type { CategoryId } from "../../../types/todo";
import type { SortType } from "../hooks/useTodoList";

export type FilterType = "all" | "active" | "completed";

const FILTERS: FilterType[] = ["all", "active", "completed"];

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: "created", label: "Eklenme" },
  { value: "reminder", label: "Hatırlatıcı" },
  { value: "priority", label: "Öncelik" },
  { value: "text", label: "A-Z" },
];

interface TodoFilterBarProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  categoryFilter?: CategoryId;
  onCategoryFilterChange?: (category: CategoryId | undefined) => void;
  usedCategoryIds?: CategoryId[];
  sortBy?: SortType;
  onSortChange?: (sort: SortType) => void;
}

export function TodoFilterBar({
  filter,
  onFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  usedCategoryIds = [],
  sortBy = "created",
  onSortChange,
}: TodoFilterBarProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(120).duration(350)}
      style={styles.wrap}
    >
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => onFilterChange(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all" ? "Tümü" : f === "active" ? "Bekleyen" : "Tamamlanan"}
            </Text>
          </Pressable>
        ))}
      </View>

      {onCategoryFilterChange && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryRow}
        >
          <Pressable
            onPress={() => onCategoryFilterChange(undefined)}
            style={[
              styles.categoryChip,
              !categoryFilter && styles.categoryChipActive,
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                !categoryFilter && styles.categoryChipTextActive,
              ]}
            >
              Tüm kategoriler
            </Text>
          </Pressable>
          {CATEGORIES.filter((c) => usedCategoryIds.includes(c.id)).map(
            (c) => (
              <Pressable
                key={c.id}
                onPress={() =>
                  onCategoryFilterChange(
                    categoryFilter === c.id ? undefined : c.id,
                  )
                }
                style={[
                  styles.categoryChip,
                  categoryFilter === c.id && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    categoryFilter === c.id && styles.categoryChipTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ),
          )}
        </ScrollView>
      )}

      {onSortChange && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortScroll}
          contentContainerStyle={styles.sortRow}
        >
          {SORT_OPTIONS.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => onSortChange(s.value)}
              style={[
                styles.sortChip,
                sortBy === s.value && styles.sortChipActive,
              ]}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sortBy === s.value && styles.sortChipTextActive,
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  filterBtnActive: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: COLORS.accent,
  },
  categoryScroll: {
    marginBottom: 8,
    maxHeight: 40,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  categoryChipText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  categoryChipTextActive: {
    color: COLORS.accent,
    fontWeight: "600",
  },
  sortScroll: {
    maxHeight: 40,
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: {
    borderColor: COLORS.textMuted,
  },
  sortChipText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  sortChipTextActive: {
    color: COLORS.text,
    fontWeight: "600",
  },
});
