import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AnimatedPressable } from "../../components/ui/AnimatedPressable";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AddTodoModal,
  DatePickerWidget,
  TodoCard,
  TodoEditModal,
  useTodoActions,
  useTodoList,
} from "../../features/todo";
import { toDateStr } from "../../utils/dateUtils";
import {
  getDateTaskCounts,
  isTaskActiveOnDate,
} from "../../utils/scheduleUtils";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import type { AddTodoParams } from "../../store/todoStore";
import type { TodoModel } from "../../types/todo";
import type { TodoEditUpdates } from "../../features/todo/components/TodoEditModal";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchExpandProgress = useSharedValue(0);
  const [searchMaxWidth, setSearchMaxWidth] = useState(200);
  const [editingTodo, setEditingTodo] = useState<TodoModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const { filteredTodos, activeCount, todos } = useTodoList(
    "all",
    searchQuery,
  );

  const fromDate = useMemo(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    return d;
  }, [selectedDate]);
  const toDate = useMemo(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 60);
    return d;
  }, [selectedDate]);
  const dateTaskCounts = useMemo(
    () => getDateTaskCounts(todos, fromDate, toDate),
    [todos, fromDate, toDate],
  );

  const selectedDateStr = toDateStr(selectedDate);
  const todosForSelectedDate = useMemo(
    () =>
      filteredTodos.filter(
        (t) =>
          t.scheduleType === "shopping_list" ||
          isTaskActiveOnDate(t, selectedDateStr)
      ),
    [filteredTodos, selectedDateStr],
  );

  const {
    toggleTodo,
    toggleTodoSlot,
    toggleChecklistItem,
    deleteTodo,
    clearCompleted,
    handleAdd,
    updateTodo,
  } = useTodoActions();

  const handleModalAdd = (params: AddTodoParams) => {
    handleAdd(params, () => setModalVisible(false));
  };

  const handleEditSave = (updates: TodoEditUpdates) => {
    if (!editingTodo) return;
    updateTodo(editingTodo.id, updates);
    setEditingTodo(null);
  };

  const expandSearch = () => {
    setSearchExpanded(true);
    searchExpandProgress.value = withTiming(1, {
      duration: 280,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };

  const collapseSearch = () => {
    if (!searchQuery.trim()) {
      searchExpandProgress.value = withTiming(
        0,
        { duration: 220 },
        (finished) => {
          if (finished) runOnJS(setSearchExpanded)(false);
        },
      );
    }
  };

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(searchExpandProgress.value, [0, 1], [44, searchMaxWidth]),
  }));

  const renderRightActions = (
    _progress: unknown,
    _dragX: unknown,
    item: TodoModel,
  ) => (
    <RectButton
      style={[styles.swipeDelete, { backgroundColor: colors.surface }]}
      onPress={() => deleteTodo(item.id)}
    >
      <View style={[styles.swipeDeleteBar, { backgroundColor: colors.danger }]} />
      <View style={styles.swipeDeleteContent}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
        <Text style={[styles.swipeDeleteText, { color: colors.danger }]}>
          {t("common.delete")}
        </Text>
      </View>
    </RectButton>
  );

  const renderTodo = ({ item, index }: { item: TodoModel; index: number }) => (
    <View style={styles.swipeWrapper}>
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, item)
        }
        overshootRight={false}
        friction={2}
      >
        <TodoCard
        item={item}
        index={index}
        onToggle={toggleTodo}
        onToggleSlot={toggleTodoSlot}
        onToggleChecklistItem={toggleChecklistItem}
        onDelete={deleteTodo}
        onEdit={setEditingTodo}
      />
      </Swipeable>
    </View>
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: { marginBottom: 2 },
        title: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
          letterSpacing: -0.6,
          lineHeight: 34,
        },
        subtitle: {
          fontSize: 14,
          color: colors.textMuted,
          marginTop: 2,
          fontWeight: "400",
        },
        list: {
          paddingHorizontal: Math.max(20, insets.left, insets.right),
          paddingBottom: 32,
          flexGrow: 1,
        },
        listEmpty: { flex: 1, justifyContent: "center" },
        emptyState: { alignItems: "center", paddingVertical: 64 },
        emptyIconWrap: {
          width: 80,
          height: 80,
          borderRadius: 44,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        },
        emptyText: {
          fontSize: 17,
          fontWeight: "500",
          color: colors.textMuted,
          marginTop: 4,
          textAlign: "center",
        },
        emptyHint: {
          fontSize: 15,
          color: colors.textMuted,
          opacity: 0.8,
          marginTop: 8,
          textAlign: "center",
          paddingHorizontal: 32,
        },
        pressed: { opacity: 0.7 },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingHorizontal: Math.max(20, insets.left, insets.right),
          paddingTop: 16,
          paddingBottom: 12,
        },
        headerLeft: { flexShrink: 0 },
        headerActions: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
          minWidth: 0,
        },
        searchBtn: {
          width: 44,
          height: 44,
          borderRadius: 18,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        searchInputWrap: {
          height: 44,
          borderRadius: 18,
          backgroundColor: colors.surface,
          overflow: "hidden",
        },
        addTaskBtn: {
          width: 44,
          height: 44,
          borderRadius: 18,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        searchInput: {
          flex: 1,
          height: 44,
          paddingHorizontal: 14,
          paddingVertical: 0,
          fontSize: 15,
          color: colors.text,
        },
        clearBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 18,
        },
        clearText: { fontSize: 15, fontWeight: "500", color: colors.danger },
        swipeWrapper: {
          marginBottom: 8,
          borderRadius: 16,
          overflow: "hidden",
        },
        swipeDelete: {
          flexDirection: "row",
          alignItems: "stretch",
          width: 72,
          alignSelf: "stretch",
          marginVertical: 8,
          borderTopRightRadius: 14,
          borderBottomRightRadius: 14,
          overflow: "hidden",
        },
        swipeDeleteBar: {
          width: 4,
          borderRadius: 2,
          alignSelf: "stretch",
          marginRight: 12,
          marginVertical: 10,
        },
        swipeDeleteContent: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
        },
        swipeDeleteText: {
          fontSize: 12,
          fontWeight: "500",
        },
      }),
    [colors, insets.left, insets.right],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <Animated.View
        entering={FadeInDown.duration(420).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t("home.title")}</Text>
            <Text style={styles.subtitle}>
              {t(activeCount === 1 ? "home.subtitle_one" : "home.subtitle", {
                count: activeCount,
              })}
            </Text>
          </View>
          <View
            style={styles.headerActions}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0) setSearchMaxWidth(Math.max(120, w - 52));
            }}
          >
            <Animated.View
              style={[
                styles.searchInputWrap,
                searchAnimatedStyle,
              ]}
            >
              {searchExpanded ? (
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t("home.searchPlaceholder")}
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onBlur={collapseSearch}
                    returnKeyType="search"
                    autoFocus
                  />
                  <AnimatedPressable
                    onPress={() => {
                      setSearchQuery("");
                      searchExpandProgress.value = withTiming(
                        0,
                        { duration: 220 },
                        (finished) => {
                          if (finished) runOnJS(setSearchExpanded)(false);
                        },
                      );
                    }}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </AnimatedPressable>
                </View>
              ) : (
                <AnimatedPressable onPress={expandSearch} style={styles.searchBtn}>
                  <Ionicons name="search" size={22} color={colors.textMuted} />
                </AnimatedPressable>
              )}
            </Animated.View>
            <AnimatedPressable
              onPress={() => setModalVisible(true)}
              style={styles.addTaskBtn}
            >
              <Ionicons name="add" size={24} color={colors.bg} />
            </AnimatedPressable>
          </View>
        </View>
      </Animated.View>

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

      <DatePickerWidget
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        dateTaskCounts={dateTaskCounts}
      />

      <FlatList
        data={todosForSelectedDate}
        renderItem={renderTodo}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          todosForSelectedDate.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <Animated.View
            entering={FadeIn.delay(200).duration(500)}
            style={styles.emptyState}
          >
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="document-text-outline"
                size={36}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.emptyText}>
              {t("home.emptyStates.noTasks")}
            </Text>
            <Text style={styles.emptyHint}>
              {t("home.emptyStates.addFirst")}
            </Text>
          </Animated.View>
        }
      />

      {todos.some((t) => t.completed) && (
        <Animated.View
          entering={FadeIn.duration(320).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
          exiting={FadeOut.duration(220)}
        >
          <AnimatedPressable
            onPress={clearCompleted}
            style={[styles.clearBtn, { paddingBottom: insets.bottom + 16 }]}
          >
            <Ionicons
            name="close-circle-outline"
            size={18}
            color={colors.danger}
            />
            <Text style={styles.clearText}>{t("home.clearCompleted")}</Text>
          </AnimatedPressable>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

