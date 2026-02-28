import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeIn, FadeOut } from "react-native-reanimated";
import { AnimatedPressable } from "../../../components/ui/AnimatedPressable";
import { getCategoryLabel } from "../../../constants/categories";
import {
  PRIORITY_COLORS,
  SCHEDULE_TYPE_CHIP_COLORS,
} from "../../../constants/theme";
import { useTheme } from "../../../context/ThemeContext";
import type { TodoModel } from "../../../types/todo";
import {
  formatReminderDate,
  isReminderPast,
  toDateStr,
} from "../../../utils/dateUtils";
import {
  formatScheduleSummary,
  getTodaysSlots,
  isSlotCompleted,
  isTaskActiveToday,
} from "../../../utils/scheduleUtils";

interface TodoCardProps {
  item: TodoModel;
  index: number;
  onToggle: (id: string) => void;
  onToggleSlot?: (id: string, dateStr: string, timeStr: string) => void;
  onToggleChecklistItem?: (todoId: string, itemId: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (todo: TodoModel) => void;
}

export function TodoCard({
  item,
  index,
  onToggle,
  onToggleSlot,
  onToggleChecklistItem,
  onDelete,
  onEdit,
}: TodoCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isShoppingList = item.scheduleType === "shopping_list";
  const [checklistExpanded, setChecklistExpanded] = useState(isShoppingList);
  const priorityColor = item.priority
    ? PRIORITY_COLORS[item.priority]
    : undefined;
  const isSlotType =
    item.scheduleType === "multi_times_daily" ||
    item.scheduleType === "ongoing" ||
    item.scheduleType === "weekly_days";
  const todaysSlots = isSlotType ? getTodaysSlots(item) : [];
  const todayStr = toDateStr(new Date());
  const showMainCheckbox = !isSlotType;
  const checklistItems = item.checklistItems ?? [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        todoRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          backgroundColor: colors.surface,
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
        },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          marginTop: 1,
        },
        checkboxSpacer: { width: 22, marginRight: 12 },
        checkboxDone: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        content: { flex: 1, minWidth: 0 },
        titleRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        },
        titleRowActions: {
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
          marginLeft: 4,
          flexShrink: 0,
        },
        expandBtn: { padding: 4 },
        editBtn: { padding: 4 },
        checklistItems: {
          marginTop: 10,
          paddingTop: 10,
          marginLeft: -4,
          paddingLeft: 4,
          borderLeftWidth: 1,
          borderLeftColor: colors.border,
        },
        checklistItemRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 6,
        },
        checklistCheckbox: {
          width: 18,
          height: 18,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        checklistItemText: { flex: 1, fontSize: 14, color: colors.text },
        checklistItemTextDone: {
          textDecorationLine: "line-through",
          color: colors.textMuted,
        },
        todoText: {
          fontSize: 15,
          fontWeight: "500",
          color: colors.text,
          lineHeight: 20,
        },
        todoTextDone: {
          textDecorationLine: "line-through",
          color: colors.textMuted,
          fontWeight: "400",
        },
        meta: {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 8,
          minWidth: 0,
        },
        metaItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          flexShrink: 1,
          minWidth: 0,
        },
        metaText: {
          fontSize: 12,
          color: colors.textMuted,
          flexShrink: 1,
        },
        metaDot: {
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: colors.textMuted,
          opacity: 0.6,
        },
        categoryDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        slotsRow: {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 10,
        },
        slotsLabel: { fontSize: 12, color: colors.textMuted, marginRight: 2 },
        slotsList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
        slotChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
        },
        slotChipText: { fontSize: 12, fontWeight: "500", color: colors.text },
        slotChipTextDone: { color: colors.accent, fontWeight: "600" },
        pressed: { opacity: 0.7 },
        priorityBar: {
          width: 4,
          borderRadius: 2,
          alignSelf: "stretch",
          marginRight: 12,
          marginVertical: 10,
        },
      }),
    [colors],
  );

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(360).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
      exiting={FadeOut.duration(220)}
      style={styles.todoRow}
    >
      {priorityColor && (
        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
      )}
      {showMainCheckbox && (
        <AnimatedPressable
          onPress={() => onToggle(item.id)}
          style={[styles.checkbox, item.completed && styles.checkboxDone]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {item.completed && (
            <Ionicons name="checkmark" size={14} color={colors.bg} />
          )}
        </AnimatedPressable>
      )}
      {isSlotType && <View style={styles.checkboxSpacer} />}
      <Pressable
        style={styles.content}
        onLongPress={onEdit ? () => onEdit(item) : undefined}
        delayLongPress={400}
        accessibilityLabel={item.text}
        accessibilityHint={t("home.swipeToDeleteHint")}
      >
        <View style={styles.titleRow}>
          <Text
            style={[styles.todoText, item.completed && styles.todoTextDone]}
            numberOfLines={2}
          >
            {item.text}
          </Text>
          <View style={styles.titleRowActions}>
            {onEdit && (
              <AnimatedPressable
                onPress={() => onEdit(item)}
                style={styles.editBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel={t("common.edit")}
                accessibilityRole="button"
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </AnimatedPressable>
            )}
            {isShoppingList && checklistItems.length > 0 && (
              <AnimatedPressable
                onPress={() => setChecklistExpanded((prev) => !prev)}
                style={styles.expandBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel={
                  checklistExpanded ? t("common.collapse") : t("common.expand")
                }
                accessibilityRole="button"
              >
                <Ionicons
                  name={checklistExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.textMuted}
                />
              </AnimatedPressable>
            )}
          </View>
        </View>
        {isShoppingList &&
          checklistExpanded &&
          checklistItems.length > 0 &&
          onToggleChecklistItem && (
            <View style={styles.checklistItems}>
              {checklistItems.map((ci) => (
                <AnimatedPressable
                  key={ci.id}
                  onPress={() => onToggleChecklistItem(item.id, ci.id)}
                  style={styles.checklistItemRow}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <View
                    style={[
                      styles.checklistCheckbox,
                      ci.completed && styles.checkboxDone,
                    ]}
                  >
                    {ci.completed && (
                      <Ionicons name="checkmark" size={10} color={colors.bg} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.checklistItemText,
                      ci.completed && styles.checklistItemTextDone,
                    ]}
                    numberOfLines={1}
                  >
                    {ci.text}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          )}
        {(item.categoryId ||
          (item.scheduleType === "one_time" &&
            item.reminderAt &&
            !item.completed &&
            !isReminderPast(item.reminderAt)) ||
          item.scheduleType !== "one_time") && (
          <View style={styles.meta}>
            {item.categoryId && (
              <>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: priorityColor ?? colors.textMuted },
                  ]}
                />
                <Text style={styles.metaText}>
                  {getCategoryLabel(item.categoryId)}
                </Text>
                {((item.scheduleType === "one_time" &&
                  item.reminderAt &&
                  !item.completed &&
                  !isReminderPast(item.reminderAt)) ||
                  item.scheduleType !== "one_time") && (
                  <View style={styles.metaDot} />
                )}
              </>
            )}
            {item.scheduleType === "one_time" &&
            item.reminderAt &&
            !item.completed &&
            !isReminderPast(item.reminderAt) ? (
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={colors.textMuted}
                />
                <Text style={styles.metaText}>
                  {formatReminderDate(item.reminderAt)}
                </Text>
              </View>
            ) : item.scheduleType !== "one_time" ? (
              <View style={styles.metaItem}>
                <Ionicons
                  name="repeat-outline"
                  size={12}
                  color={colors.textMuted}
                />
                <Text
                  style={styles.metaText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatScheduleSummary(item)}
                </Text>
              </View>
            ) : null}
          </View>
        )}
        {isSlotType &&
          isTaskActiveToday(item) &&
          todaysSlots.length > 0 &&
          onToggleSlot && (
            <View style={styles.slotsRow}>
              <Text style={styles.slotsLabel}>{t("todoCard.today")}</Text>
              <View style={styles.slotsList}>
                {todaysSlots.map((timeStr) => {
                  const done = isSlotCompleted(item, todayStr, timeStr);
                    return (
                    <AnimatedPressable
                      key={timeStr}
                      onPress={() => onToggleSlot(item.id, todayStr, timeStr)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={[
                        styles.slotChip,
                        {
                          backgroundColor: done
                            ? colors.accentDim
                            : SCHEDULE_TYPE_CHIP_COLORS[item.scheduleType],
                        },
                      ]}
                    >
                      {done && (
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color={colors.bg}
                        />
                      )}
                      <Text
                        style={[
                          styles.slotChipText,
                          done && styles.slotChipTextDone,
                        ]}
                      >
                        {timeStr}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          )}
      </Pressable>
    </Animated.View>
  );
}
