import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { TodoModel } from "../types/todo";
import {
  cancelTodoReminder,
  scheduleTodoReminder,
} from "../services/notificationService";

interface TodoState {
  todos: TodoModel[];
  addTodo: (text: string, reminderAt?: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
  updateTodo: (id: string, updates: { text?: string; reminderAt?: string | null }) => void;
  setReminder: (id: string, date: Date) => void;
  removeReminder: (id: string) => void;
}

const STORAGE_KEY = "todo-app-storage";

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],

      addTodo: (text, reminderAt) =>
        set((state) => {
          const newTodo: TodoModel = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            ...(reminderAt && { reminderAt }),
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
            scheduleTodoReminder(id, updates.text ?? todo.text, date).catch(() => {});
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
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ todos: state.todos }),
    },
  ),
);
