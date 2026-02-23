import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { getCategoryLabel } from "../../../constants/categories";
import {
  PRIORITY_COLORS,
  SCHEDULE_TYPE_CHIP_COLORS,
} from "../../../constants/theme";
import { useTheme } from "../../../context/ThemeContext";
import type { TodoModel } from "../../../types/todo";
import { formatReminderDate, isReminderPast } from "../../../utils/dateUtils";
import {
  formatScheduleSummary,
  getTodaysSlots,
  isSlotCompleted,
  isTaskActiveToday,
} from "../../../utils/scheduleUtils";

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const priorityColor = item.priority
    ? PRIORITY_COLORS[item.priority]
    : undefined;
  const isSlotType =
    item.scheduleType === "multi_times_daily" ||
    item.scheduleType === "ongoing" ||
    item.scheduleType === "weekly_days";
  const isShoppingList = item.scheduleType === "shopping_list";
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
          marginBottom: 8,
        },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: 6,
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
          borderRadius: 4,
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
        todoText: { fontSize: 15, fontWeight: "500", color: colors.text, lineHeight: 20 },
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
        },
        metaItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        metaText: { fontSize: 12, color: colors.textMuted },
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
      }),
    [colors],
  );

  return (
    <Animated.View
      entering={FadeIn.delay(index * 40).duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.todoRow,
        priorityColor && {
          borderLeftWidth: 2,
          borderLeftColor: priorityColor,
        },
      ]}
    >
      {showMainCheckbox && (
        <Pressable
          onPress={() => onToggle(item.id)}
          style={({ pressed }) => [
            styles.checkbox,
            item.completed && styles.checkboxDone,
            pressed && styles.pressed,
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {item.completed && (
            <Ionicons name="checkmark" size={14} color={colors.bg} />
          )}
        </Pressable>
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
              <Pressable
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
              </Pressable>
            )}
            {isShoppingList && checklistItems.length > 0 && (
              <Pressable
                onPress={() => setChecklistExpanded((prev) => !prev)}
                style={styles.expandBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel={checklistExpanded ? t("common.collapse") : t("common.expand")}
                accessibilityRole="button"
              >
                <Ionicons
                  name={checklistExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
            )}
          </View>
        </View>
        {isShoppingList && checklistExpanded && checklistItems.length > 0 && onToggleChecklistItem && (
          <View style={styles.checklistItems}>
            {checklistItems.map((ci) => (
              <Pressable
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
              </Pressable>
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
                <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {formatReminderDate(item.reminderAt)}
                </Text>
              </View>
            ) : item.scheduleType !== "one_time" ? (
              <View style={styles.metaItem}>
                <Ionicons name="repeat-outline" size={12} color={colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>
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
                    <Pressable
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
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
      </Pressable>
    </Animated.View>
  );
}
