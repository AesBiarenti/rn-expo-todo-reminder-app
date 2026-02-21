import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { getCategoryLabel } from "../../../constants/categories";
import { COLORS, PRIORITY_COLORS } from "../../../constants/theme";
import type { TodoModel } from "../../../types/todo";
import { formatReminderDate, isReminderPast } from "../../../utils/dateUtils";

interface TodoCardProps {
  item: TodoModel;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (todo: TodoModel) => void;
}

export function TodoCard({
  item,
  index,
  onToggle,
  onDelete,
  onEdit,
}: TodoCardProps) {
  const priorityColor = item.priority
    ? PRIORITY_COLORS[item.priority]
    : undefined;

  return (
    <Animated.View
      entering={FadeIn.delay(index * 40).duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.todoRow,
        priorityColor && {
          borderLeftWidth: 4,
          borderLeftColor: priorityColor,
        },
      ]}
    >
      <Pressable
        onPress={() => onToggle(item.id)}
        style={({ pressed }) => [
          styles.checkbox,
          item.completed && styles.checkboxDone,
          pressed && styles.pressed,
        ]}
      >
        {item.completed && (
          <Ionicons name="checkmark" size={16} color={COLORS.bg} />
        )}
      </Pressable>
      <Pressable
        style={styles.content}
        onLongPress={onEdit ? () => onEdit(item) : undefined}
        delayLongPress={400}
      >
        <Text
          style={[styles.todoText, item.completed && styles.todoTextDone]}
          numberOfLines={2}
        >
          {item.text}
        </Text>
        <View style={styles.badges}>
          {item.categoryId && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {getCategoryLabel(item.categoryId)}
              </Text>
            </View>
          )}
          {item.reminderAt &&
            !item.completed &&
            !isReminderPast(item.reminderAt) && (
              <View style={styles.reminderBadge}>
                <Ionicons
                  name="alarm-outline"
                  size={14}
                  color={COLORS.textMuted}
                />
                <Text style={styles.reminderText}>
                  {formatReminderDate(item.reminderAt)}
                </Text>
              </View>
            )}
        </View>
      </Pressable>
      <Pressable
        onPress={() => onDelete(item.id)}
        style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  content: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    color: COLORS.text,
  },
  todoTextDone: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  categoryBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  reminderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reminderText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  deleteBtn: {
    padding: 8,
    marginRight: -8,
  },
  pressed: {
    opacity: 0.6,
  },
});
