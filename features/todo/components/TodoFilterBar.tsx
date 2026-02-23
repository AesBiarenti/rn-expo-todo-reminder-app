import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { CATEGORIES, getCategoryLabel } from "../../../constants/categories";
import { useTheme } from "../../../context/ThemeContext";
import type { CategoryId, TaskScheduleType } from "../../../types/todo";
import type { SortType } from "../hooks/useTodoList";

export type FilterType = "all" | "active" | "completed";

const FILTERS: FilterType[] = ["all", "active", "completed"];

const SCHEDULE_TYPE_OPTIONS: { value: TaskScheduleType; labelKey: string }[] = [
  { value: "one_time", labelKey: "scheduleTypes.oneTimeShort" },
  { value: "multi_times_daily", labelKey: "scheduleTypes.dailyRoutineShort" },
  { value: "ongoing", labelKey: "scheduleTypes.ongoingShort" },
  { value: "shopping_list", labelKey: "scheduleTypes.shoppingListShort" },
  { value: "recurring", labelKey: "scheduleTypes.recurringShort" },
  { value: "weekly_days", labelKey: "scheduleTypes.weeklyDaysShort" },
];

const SORT_OPTIONS: { value: SortType; labelKey: string }[] = [
  { value: "created", labelKey: "filters.sortBy.created" },
  { value: "reminder", labelKey: "filters.sortBy.reminder" },
  { value: "priority", labelKey: "filters.sortBy.priority" },
  { value: "text", labelKey: "filters.sortBy.textAZ" },
];

interface TodoFilterBarProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  categoryFilter?: CategoryId;
  onCategoryFilterChange?: (category: CategoryId | undefined) => void;
  scheduleTypeFilter?: TaskScheduleType;
  onScheduleTypeFilterChange?: (type: TaskScheduleType | undefined) => void;
  usedCategoryIds?: CategoryId[];
  usedScheduleTypes?: TaskScheduleType[];
  sortBy?: SortType;
  onSortChange?: (sort: SortType) => void;
}

export function TodoFilterBar({
  filter,
  onFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  scheduleTypeFilter,
  onScheduleTypeFilterChange,
  usedCategoryIds = [],
  usedScheduleTypes = [],
  sortBy = "created",
  onSortChange,
}: TodoFilterBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const filterIndex = FILTERS.indexOf(filter);
  const slideX = useSharedValue(0);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const isFirstLayout = useRef(true);

  const hasActiveFilters =
    !!categoryFilter || !!scheduleTypeFilter || sortBy !== "created";
  const hasChipFilters =
    onScheduleTypeFilterChange || onCategoryFilterChange || onSortChange;

  const toggleExpanded = () => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
    LayoutAnimation.configureNext({
      duration: 220,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    setExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (segmentWidth > 0) {
      const offset = 6 + filterIndex * (segmentWidth + 4);
      if (isFirstLayout.current) {
        slideX.value = offset;
        isFirstLayout.current = false;
      } else {
        slideX.value = withTiming(offset, {
          duration: 220,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    }
  }, [filterIndex, segmentWidth, slideX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { paddingHorizontal: 20, marginBottom: 12 },
        filters: {
          flexDirection: "row",
          gap: 4,
          marginBottom: 10,
          padding: 6,
          borderRadius: 16,
          position: "relative",
        },
        filterBtn: {
          flex: 1,
          minHeight: 40,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
        },
        filterBtnActive: {
          backgroundColor: colors.surface,
        },
        filterText: {
          fontSize: 15,
          fontWeight: "500",
          color: colors.textMuted,
        },
        filterTextActive: { color: colors.text, fontWeight: "600" },
        filterToggleRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          marginTop: 8,
        },
        filterToggleBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 14,
          backgroundColor: colors.surface,
        },
        filterToggleBtnActive: { backgroundColor: colors.accentDim },
        chipSection: { marginBottom: 8 },
        chipsScroll: { maxHeight: 38 },
        chipsRow: {
          flexDirection: "row",
          gap: 8,
          paddingVertical: 1,
          alignItems: "center",
        },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 14,
          backgroundColor: colors.surface,
        },
        chipActive: {
          backgroundColor: colors.accentDim,
        },
        chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
        chipTextActive: {
          color: colors.accent,
          fontWeight: "600",
        },
        groupDivider: {
          color: colors.textMuted,
          fontWeight: "700",
          paddingHorizontal: 2,
        },
      }),
    [colors],
  );
  return (
    <Animated.View
      entering={FadeInDown.delay(120).duration(350)}
      style={styles.wrap}
    >
      <View
        style={styles.filters}
        accessibilityRole="tablist"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setSegmentWidth((w - 24) / 3);
        }}
      >
        {segmentWidth > 0 && (
          <Animated.View
            style={[
              styles.filterBtn,
              styles.filterBtnActive,
              {
                position: "absolute",
                left: 0,
                top: 6,
                bottom: 6,
                width: segmentWidth,
                margin: 0,
                minHeight: undefined,
              },
              pillStyle,
            ]}
            pointerEvents="none"
          />
        )}
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => onFilterChange(f)}
            style={[styles.filterBtn, { backgroundColor: "transparent" }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {t(`filters.${f}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {hasChipFilters && (
        <Pressable
          onPress={toggleExpanded}
          style={[
            styles.filterToggleBtn,
            hasActiveFilters && styles.filterToggleBtnActive,
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={hasActiveFilters ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.filterText,
              hasActiveFilters && styles.filterTextActive,
            ]}
          >
            {expanded ? t("filters.hideFilters") : t("filters.showFilters")}
          </Text>
        </Pressable>
      )}

      {expanded && hasChipFilters && (
        <View style={styles.chipSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsRow}
          >
            {onScheduleTypeFilterChange && (
              <>
                <Pressable
                  onPress={() => onScheduleTypeFilterChange(undefined)}
                  style={[styles.chip, !scheduleTypeFilter && styles.chipActive]}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      !scheduleTypeFilter && styles.chipTextActive,
                    ]}
                  >
                    {t("filters.allTypes")}
                  </Text>
                </Pressable>
                {SCHEDULE_TYPE_OPTIONS.filter(
                  (s) =>
                    usedScheduleTypes.includes(s.value) ||
                    scheduleTypeFilter === s.value,
                ).map((s) => (
                  <Pressable
                    key={s.value}
                    onPress={() =>
                      onScheduleTypeFilterChange(
                        scheduleTypeFilter === s.value ? undefined : s.value,
                      )
                    }
                    style={[
                      styles.chip,
                      scheduleTypeFilter === s.value && styles.chipActive,
                    ]}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        scheduleTypeFilter === s.value && styles.chipTextActive,
                      ]}
                    >
                      {t(s.labelKey)}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}

            {onScheduleTypeFilterChange &&
              (onCategoryFilterChange || onSortChange) && (
                <Text style={styles.groupDivider}>•</Text>
              )}

            {onCategoryFilterChange && (
              <>
                <Pressable
                  onPress={() => onCategoryFilterChange(undefined)}
                  style={[styles.chip, !categoryFilter && styles.chipActive]}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      !categoryFilter && styles.chipTextActive,
                    ]}
                  >
                    {t("filters.allCategories")}
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
                        styles.chip,
                        categoryFilter === c.id && styles.chipActive,
                      ]}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          categoryFilter === c.id && styles.chipTextActive,
                        ]}
                      >
                        {getCategoryLabel(c.id)}
                      </Text>
                    </Pressable>
                  ),
                )}
              </>
            )}

            {onCategoryFilterChange && onSortChange && (
              <Text style={styles.groupDivider}>•</Text>
            )}

            {onSortChange &&
              SORT_OPTIONS.map((s) => (
                <Pressable
                  key={s.value}
                  onPress={() => onSortChange(s.value)}
                  style={[styles.chip, sortBy === s.value && styles.chipActive]}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      sortBy === s.value && styles.chipTextActive,
                    ]}
                  >
                    {t(s.labelKey)}
                  </Text>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );
}
