import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS } from "../../../constants/theme";

export type FilterType = "all" | "active" | "completed";

const FILTERS: FilterType[] = ["all", "active", "completed"];

interface TodoFilterBarProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function TodoFilterBar({ filter, onFilterChange }: TodoFilterBarProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(120).duration(350)}
      style={styles.filters}
    >
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
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 16,
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
});
