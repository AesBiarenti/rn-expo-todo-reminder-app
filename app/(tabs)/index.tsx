import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AddTodoModal,
  TodoCard,
  TodoEditModal,
  TodoFilterBar,
  useTodoActions,
  useTodoList,
  type FilterType,
  type SortType,
} from "../../features/todo";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import type {
  CategoryId,
  Priority,
  TodoModel,
} from "../../types/todo";
import { COLORS } from "../../constants/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoModel | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | undefined>();
  const [sortBy, setSortBy] = useState<SortType>("created");

  const { filteredTodos, activeCount, todos } = useTodoList(
    filter,
    searchQuery,
    categoryFilter,
    sortBy,
  );

  const usedCategoryIds = useMemo(
    () =>
      [...new Set(todos.map((t) => t.categoryId).filter(Boolean))] as CategoryId[],
    [todos],
  );

  const {
    toggleTodo,
    deleteTodo,
    clearCompleted,
    handleAdd,
    updateTodo,
  } = useTodoActions();

  const handleModalAdd = (
    text: string,
    reminderAt?: string,
    priority?: Priority,
    categoryId?: CategoryId,
  ) => {
    handleAdd(text, () => setModalVisible(false), reminderAt, priority, categoryId);
  };

  const handleEditSave = (updates: {
    text: string;
    reminderAt: string | null;
    priority?: Priority;
    categoryId?: CategoryId;
  }) => {
    if (!editingTodo) return;
    updateTodo(editingTodo.id, updates);
    setEditingTodo(null);
  };

  const renderRightActions = (
    _progress: unknown,
    _dragX: unknown,
    item: TodoModel,
  ) => (
    <RectButton
      style={styles.swipeDelete}
      onPress={() => deleteTodo(item.id)}
    >
      <Ionicons name="trash-outline" size={22} color={COLORS.bg} />
      <Text style={styles.swipeDeleteText}>Sil</Text>
    </RectButton>
  );

  const renderTodo = ({ item, index }: { item: TodoModel; index: number }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item)
      }
      overshootRight={false}
    >
      <TodoCard
        item={item}
        index={index}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onEdit={setEditingTodo}
      />
    </Swipeable>
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

      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.addTaskBtn,
          pressed && styles.pressed,
          { marginHorizontal: 24, marginBottom: 12 },
        ]}
      >
        <Ionicons name="add" size={24} color={COLORS.bg} />
        <Text style={styles.addTaskBtnText}>Add Task</Text>
      </Pressable>

      <TextInput
        style={styles.searchInput}
        placeholder="Ara..."
        placeholderTextColor={COLORS.textMuted}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
      />

      <TodoFilterBar
        filter={filter}
        onFilterChange={setFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        usedCategoryIds={usedCategoryIds}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <AddTodoModal
        visible={modalVisible}
        onAdd={handleModalAdd}
        onClose={() => setModalVisible(false)}
      />

      <TodoEditModal
        todo={editingTodo}
        visible={editingTodo !== null}
        onSave={handleEditSave}
        onClose={() => setEditingTodo(null)}
      />

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
  addTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
  },
  addTaskBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.bg,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    marginHorizontal: 24,
    marginBottom: 12,
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
  swipeDelete: {
    backgroundColor: COLORS.danger,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 8,
    borderRadius: 12,
  },
  swipeDeleteText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
});
