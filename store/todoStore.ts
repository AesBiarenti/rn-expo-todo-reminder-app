import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CategoryId, Priority, TodoModel } from "../types/todo";
import {
  cancelTodoReminder,
  scheduleTodoReminder,
} from "../services/notificationService";

interface TodoUpdates {
  text?: string;
  reminderAt?: string | null;
  priority?: Priority;
  categoryId?: CategoryId;
}

interface TodoState {
  todos: TodoModel[];
  notificationTodoId: string | null;
  addTodo: (
    text: string,
    reminderAt?: string,
    priority?: Priority,
    categoryId?: CategoryId,
  ) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
  updateTodo: (id: string, updates: TodoUpdates) => void;
  setReminder: (id: string, date: Date) => void;
  removeReminder: (id: string) => void;
  setNotificationTodoId: (id: string | null) => void;
}

const STORAGE_KEY = "todo-app-storage";

function migrateTodo(todo: Record<string, unknown>): TodoModel {
  const createdAt =
    typeof todo.createdAt === "string"
      ? todo.createdAt
      : typeof todo.id === "string"
        ? new Date(parseInt(todo.id, 10) || Date.now()).toISOString()
        : new Date().toISOString();

  return {
    id: String(todo.id),
    text: String(todo.text),
    completed: Boolean(todo.completed),
    reminderAt: todo.reminderAt ? String(todo.reminderAt) : undefined,
    priority: todo.priority as Priority | undefined,
    categoryId: todo.categoryId as CategoryId | undefined,
    createdAt,
  };
}

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

      addTodo: (text, reminderAt, priority, categoryId) =>
        set((state) => {
          const now = new Date().toISOString();
          const newTodo: TodoModel = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            createdAt: now,
            ...(reminderAt && { reminderAt }),
            ...(priority && { priority }),
            ...(categoryId && { categoryId }),
          };
          if (reminderAt) {
            const date = new Date(reminderAt);
            scheduleTodoReminder(newTodo.id, newTodo.text, date).catch(() => {});
          }
          return {
            todos: [...state.todos, newTodo],
          };
        }),

      toggleTodo: (id) =>
        set((state) => {
          const todo = state.todos.find((t) => t.id === id);
          if (todo?.completed === false && todo?.reminderAt) {
            cancelTodoReminder(id).catch(() => {});
          }
          return {
            todos: state.todos.map((t) =>
              t.id === id ? { ...t, completed: !t.completed } : t,
            ),
          };
        }),

      deleteTodo: (id) =>
        set((state) => {
          cancelTodoReminder(id).catch(() => {});
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

          if (updates.reminderAt === null && todo.reminderAt) {
            cancelTodoReminder(id).catch(() => {});
          } else if (updates.reminderAt) {
            cancelTodoReminder(id).catch(() => {});
            const date = new Date(updates.reminderAt);
            scheduleTodoReminder(id, updates.text ?? todo.text, date).catch(
              () => {},
            );
          }

          return {
            todos: state.todos.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...(updates.text !== undefined && { text: updates.text }),
                    ...(updates.reminderAt !== undefined && {
                      reminderAt: updates.reminderAt ?? undefined,
                    }),
                    ...(updates.priority !== undefined && {
                      priority: updates.priority,
                    }),
                    ...(updates.categoryId !== undefined && {
                      categoryId: updates.categoryId,
                    }),
                  }
                : t,
            ),
          };
        }),

      setReminder: (id, date) => {
        const state = get();
        const todo = state.todos.find((t) => t.id === id);
        if (!todo) return;
        cancelTodoReminder(id).catch(() => {});
        scheduleTodoReminder(id, todo.text, date).catch(() => {});
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, reminderAt: date.toISOString() } : t,
          ),
        }));
      },

      removeReminder: (id) => {
        cancelTodoReminder(id).catch(() => {});
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, reminderAt: undefined } : t,
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
