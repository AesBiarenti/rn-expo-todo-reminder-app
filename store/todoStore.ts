import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CategoryId,
  ChecklistItem,
  Priority,
  RecurrenceType,
  TaskScheduleType,
  TodoModel,
} from "../types/todo";
import {
  cancelTodoReminders,
  scheduleRemindersForTodo,
} from "../services/notificationService";
import { migrateTodo } from "./todoStoreMigration";

export interface AddTodoParams {
  text: string;
  scheduleType: TaskScheduleType;
  reminderAt?: string;
  startDate?: string;
  endDate?: string;
  dailyTimes?: string[];
  checklistItems?: ChecklistItem[];
  recurrenceType?: RecurrenceType;
  recurrenceDayOfWeek?: number;
  recurrenceDayOfMonth?: number;
  recurrenceMonth?: number;
  recurrenceTime?: string;
  recurrenceStartDate?: string;
  recurrenceEndDate?: string;
  weekdays?: number[];
  weeklyTimes?: string[];
  weeklyStartDate?: string;
  weeklyEndDate?: string;
  priority?: Priority;
  categoryId?: CategoryId;
}

interface TodoUpdates {
  text?: string;
  reminderAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  dailyTimes?: string[];
  checklistItems?: ChecklistItem[];
  recurrenceType?: RecurrenceType;
  recurrenceDayOfWeek?: number;
  recurrenceDayOfMonth?: number;
  recurrenceMonth?: number;
  recurrenceTime?: string;
  recurrenceStartDate?: string | null;
  recurrenceEndDate?: string | null;
  weekdays?: number[];
  weeklyTimes?: string[];
  weeklyStartDate?: string | null;
  weeklyEndDate?: string | null;
  scheduleType?: TaskScheduleType;
  priority?: Priority;
  categoryId?: CategoryId;
}

interface TodoState {
  todos: TodoModel[];
  notificationTodoId: string | null;
  addTodo: (params: AddTodoParams) => void;
  toggleTodo: (id: string) => void;
  toggleTodoSlot: (id: string, dateStr: string, timeStr: string) => void;
  addChecklistItem: (todoId: string, text: string) => void;
  toggleChecklistItem: (todoId: string, itemId: string) => void;
  removeChecklistItem: (todoId: string, itemId: string) => void;
  updateChecklistItem: (todoId: string, itemId: string, text: string) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
  updateTodo: (id: string, updates: TodoUpdates) => void;
  setReminder: (id: string, date: Date) => void;
  removeReminder: (id: string) => void;
  setNotificationTodoId: (id: string | null) => void;
}

const STORAGE_KEY = "todo-app-storage";

const customStorage = {
  getItem: async (name: string) => {
    const value = await AsyncStorage.getItem(name);
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (parsed?.state?.todos) {
        parsed.state.todos = parsed.state.todos.map(migrateTodo);
        return JSON.stringify(parsed);
      }
      return value;
    } catch {
      return value;
    }
  },
  setItem: AsyncStorage.setItem.bind(AsyncStorage),
  removeItem: AsyncStorage.removeItem.bind(AsyncStorage),
};

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],
      notificationTodoId: null,

      addTodo: (params) =>
        set((state) => {
          const now = new Date().toISOString();
          const newTodo: TodoModel = {
            id: Date.now().toString(),
            text: params.text.trim(),
            completed: false,
            scheduleType: params.scheduleType,
            createdAt: now,
            ...(params.reminderAt && { reminderAt: params.reminderAt }),
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate }),
            ...(params.dailyTimes?.length && { dailyTimes: params.dailyTimes }),
            ...(params.priority && { priority: params.priority }),
            ...(params.categoryId && { categoryId: params.categoryId }),
            ...((params.scheduleType === "multi_times_daily" ||
              params.scheduleType === "ongoing") && {
              completedSlots: {},
            }),
            ...(params.scheduleType === "shopping_list" && {
              checklistItems: params.checklistItems ?? [],
            }),
            ...(params.scheduleType === "recurring" && {
              recurrenceType: params.recurrenceType,
              recurrenceDayOfWeek: params.recurrenceDayOfWeek,
              recurrenceDayOfMonth: params.recurrenceDayOfMonth,
              recurrenceMonth: params.recurrenceMonth,
              recurrenceTime: params.recurrenceTime ?? "09:00",
              recurrenceStartDate: params.recurrenceStartDate,
              recurrenceEndDate: params.recurrenceEndDate,
            }),
            ...(params.scheduleType === "weekly_days" && {
              weekdays: params.weekdays ?? [],
              weeklyTimes: params.weeklyTimes,
              weeklyStartDate: params.weeklyStartDate,
              weeklyEndDate: params.weeklyEndDate,
              completedSlots: {},
            }),
          };
          scheduleRemindersForTodo(newTodo).catch(() => {});
          return {
            todos: [...state.todos, newTodo],
          };
        }),

      toggleTodo: (id) =>
        set((state) => {
          const todo = state.todos.find((t) => t.id === id);
          if (!todo) return state;

          if (
            todo.scheduleType === "multi_times_daily" ||
            todo.scheduleType === "ongoing" ||
            todo.scheduleType === "weekly_days"
          ) {
            return state;
          }
          if (todo.scheduleType === "shopping_list") {
            return state;
          }

          const nextCompleted = !todo.completed;
          if (todo.completed === false) {
            cancelTodoReminders(id).catch(() => {});
          } else if (nextCompleted === false) {
            scheduleRemindersForTodo({ ...todo, completed: false }).catch(
              () => {},
            );
          }
          return {
            todos: state.todos.map((t) =>
              t.id === id ? { ...t, completed: nextCompleted } : t,
            ),
          };
        }),

      toggleTodoSlot: (id, dateStr, timeStr) =>
        set((state) => {
          const todo = state.todos.find((t) => t.id === id);
          if (!todo) return state;
          const slotTypes: TaskScheduleType[] = [
            "multi_times_daily",
            "ongoing",
            "weekly_days",
          ];
          if (!slotTypes.includes(todo.scheduleType)) {
            return state;
          }

          const slots = { ...(todo.completedSlots ?? {}) };
          const daySlots = [...(slots[dateStr] ?? [])];
          const idx = daySlots.indexOf(timeStr);
          if (idx >= 0) {
            daySlots.splice(idx, 1);
          } else {
            daySlots.push(timeStr);
            daySlots.sort();
          }
          if (daySlots.length === 0) {
            delete slots[dateStr];
          } else {
            slots[dateStr] = daySlots;
          }

          return {
            todos: state.todos.map((t) =>
              t.id === id ? { ...t, completedSlots: slots } : t,
            ),
          };
        }),

      addChecklistItem: (todoId, text) =>
        set((state) => {
          const todo = state.todos.find((t) => t.id === todoId);
          if (!todo || todo.scheduleType !== "shopping_list") return state;
          const items = todo.checklistItems ?? [];
          const newItem: ChecklistItem = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
          };
          const nextItems = [...items, newItem];
          const allDone = nextItems.every((i) => i.completed);
          return {
            todos: state.todos.map((t) =>
              t.id === todoId
                ? {
                    ...t,
                    checklistItems: nextItems,
                    completed: allDone,
                  }
                : t,
            ),
          };
        }),

      toggleChecklistItem: (todoId, itemId) =>
        set((state) => {
          const todo = state.todos.find((t) => t.id === todoId);
          if (!todo || todo.scheduleType !== "shopping_list") return state;
          const items = (todo.checklistItems ?? []).map((i) =>
            i.id === itemId ? { ...i, completed: !i.completed } : i,
          );
          const allDone = items.length > 0 && items.every((i) => i.completed);
          return {
            todos: state.todos.map((t) =>
              t.id === todoId
                ? { ...t, checklistItems: items, completed: allDone }
                : t,
            ),
          };
        }),

      removeChecklistItem: (todoId, itemId) =>
        set((state) => {
          const todo = state.todos.find((t) => t.id === todoId);
          if (!todo || todo.scheduleType !== "shopping_list") return state;
          const items = (todo.checklistItems ?? []).filter((i) => i.id !== itemId);
          const allDone = items.length > 0 && items.every((i) => i.completed);
          return {
            todos: state.todos.map((t) =>
              t.id === todoId
                ? { ...t, checklistItems: items, completed: allDone }
                : t,
            ),
          };
        }),

      updateChecklistItem: (todoId, itemId, text) =>
        set((state) => {
          const todo = state.todos.find((t) => t.id === todoId);
          if (!todo || todo.scheduleType !== "shopping_list") return state;
          const items = (todo.checklistItems ?? []).map((i) =>
            i.id === itemId ? { ...i, text: text.trim() } : i,
          );
          return {
            todos: state.todos.map((t) =>
              t.id === todoId ? { ...t, checklistItems: items } : t,
            ),
          };
        }),

      deleteTodo: (id) =>
        set((state) => {
          cancelTodoReminders(id).catch(() => {});
          return {
            todos: state.todos.filter((t) => t.id !== id),
          };
        }),

      clearCompleted: () =>
        set((state) => ({
          todos: state.todos.filter((t) => !t.completed),
        })),

      updateTodo: (id, updates) =>
        set((state) => {
          const todo = state.todos.find((t) => t.id === id);
          if (!todo) return state;

          cancelTodoReminders(id).catch(() => {});

          const next: TodoModel = {
            ...todo,
            ...(updates.text !== undefined && { text: updates.text }),
            ...(updates.reminderAt !== undefined && {
              reminderAt: updates.reminderAt ?? undefined,
            }),
            ...(updates.startDate !== undefined && {
              startDate: updates.startDate ?? undefined,
            }),
            ...(updates.endDate !== undefined && {
              endDate: updates.endDate ?? undefined,
            }),
            ...(updates.dailyTimes !== undefined && {
              dailyTimes: updates.dailyTimes,
            }),
            ...(updates.checklistItems !== undefined && {
              checklistItems: updates.checklistItems,
            }),
            ...(updates.recurrenceType !== undefined && {
              recurrenceType: updates.recurrenceType,
            }),
            ...(updates.recurrenceDayOfWeek !== undefined && {
              recurrenceDayOfWeek: updates.recurrenceDayOfWeek,
            }),
            ...(updates.recurrenceDayOfMonth !== undefined && {
              recurrenceDayOfMonth: updates.recurrenceDayOfMonth,
            }),
            ...(updates.recurrenceMonth !== undefined && {
              recurrenceMonth: updates.recurrenceMonth,
            }),
            ...(updates.recurrenceTime !== undefined && {
              recurrenceTime: updates.recurrenceTime,
            }),
            ...(updates.recurrenceStartDate !== undefined && {
              recurrenceStartDate: updates.recurrenceStartDate ?? undefined,
            }),
            ...(updates.recurrenceEndDate !== undefined && {
              recurrenceEndDate: updates.recurrenceEndDate ?? undefined,
            }),
            ...(updates.weekdays !== undefined && { weekdays: updates.weekdays }),
            ...(updates.weeklyTimes !== undefined && {
              weeklyTimes: updates.weeklyTimes,
            }),
            ...(updates.weeklyStartDate !== undefined && {
              weeklyStartDate: updates.weeklyStartDate ?? undefined,
            }),
            ...(updates.weeklyEndDate !== undefined && {
              weeklyEndDate: updates.weeklyEndDate ?? undefined,
            }),
            ...(updates.scheduleType !== undefined && {
              scheduleType: updates.scheduleType,
            }),
            ...(updates.priority !== undefined && {
              priority: updates.priority,
            }),
            ...(updates.categoryId !== undefined && {
              categoryId: updates.categoryId,
            }),
          };

          scheduleRemindersForTodo(next).catch(() => {});

          return {
            todos: state.todos.map((t) => (t.id === id ? next : t)),
          };
        }),

      setReminder: (id, date) => {
        const state = get();
        const todo = state.todos.find((t) => t.id === id);
        if (!todo) return;
        const next: TodoModel = {
          ...todo,
          scheduleType: "one_time",
          reminderAt: date.toISOString(),
        };
        cancelTodoReminders(id).catch(() => {});
        scheduleRemindersForTodo(next).catch(() => {});
        set((s) => ({
          todos: s.todos.map((t) => (t.id === id ? next : t)),
        }));
      },

      removeReminder: (id) => {
        cancelTodoReminders(id).catch(() => {});
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id
              ? { ...t, reminderAt: undefined, scheduleType: "one_time" as const }
              : t,
          ),
        }));
      },

      setNotificationTodoId: (id) => set({ notificationTodoId: id }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({ todos: state.todos }),
    },
  ),
);
