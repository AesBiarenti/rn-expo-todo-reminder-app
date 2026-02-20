import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  TodoCard,
  TodoFilterBar,
  TodoInput,
  useTodoActions,
  useTodoList,
  type FilterType,
} from "../../features/todo";
import type { TodoModel } from "../../types/todo";
import { COLORS } from "../../constants/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const { filteredTodos, activeCount, todos } = useTodoList(filter);
  const {
    toggleTodo,
    deleteTodo,
    clearCompleted,
    handleAdd,
  } = useTodoActions();

  const handleAddTodo = () => {
    handleAdd(input, () => setInput(""));
  };

  const renderTodo = ({ item, index }: { item: TodoModel; index: number }) => (
    <TodoCard
      item={item}
      index={index}
      onToggle={toggleTodo}
      onDelete={deleteTodo}
    />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <Animated.View
        entering={FadeInDown.duration(350)}
        style={styles.header}
      >
        <Text style={styles.title}>Tasks</Text>
        <Text style={styles.subtitle}>
          {activeCount} {activeCount === 1 ? "task" : "tasks"} remaining
        </Text>
      </Animated.View>

      <TodoInput
        value={input}
        onChangeText={setInput}
        onAdd={(reminderAt) => handleAddTodo(reminderAt)}
      />

      <TodoFilterBar filter={filter} onFilterChange={setFilter} />

      <FlatList
        data={filteredTodos}
        renderItem={renderTodo}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          filteredTodos.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <Animated.View
            entering={FadeIn.delay(200).duration(500)}
            style={styles.emptyState}
          >
            <Ionicons
              name={
                filter === "completed"
                  ? "checkmark-circle-outline"
                  : filter === "active"
                    ? "time-outline"
                    : "document-text-outline"
              }
              size={48}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyText}>
              {filter === "completed"
                ? "No completed tasks"
                : filter === "active"
                  ? "No active tasks"
                  : "No tasks yet"}
            </Text>
            <Text style={styles.emptyHint}>
              {filter === "all"
                ? "Add one above to get started"
                : "Try a different filter"}
            </Text>
          </Animated.View>
        }
      />

      {todos.some((t) => t.completed) && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
        >
          <Pressable
            onPress={clearCompleted}
            style={({ pressed }) => [
              styles.clearBtn,
              pressed && styles.pressed,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color={COLORS.danger}
            />
            <Text style={styles.clearText}>Clear completed</Text>
          </Pressable>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textMuted,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.textMuted,
    opacity: 0.7,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  clearText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.danger,
  },
});
