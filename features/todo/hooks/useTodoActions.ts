import type { CategoryId, Priority } from "../../../types/todo";
import { Keyboard } from "react-native";
import { useTodoStore } from "../../../store/todoStore";

export function useTodoActions() {
  const addTodo = useTodoStore((s) => s.addTodo);
  const updateTodo = useTodoStore((s) => s.updateTodo);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);
  const clearCompleted = useTodoStore((s) => s.clearCompleted);

  const handleAdd = (
    text: string,
    clearInput: () => void,
    reminderAt?: string,
    priority?: Priority,
    categoryId?: CategoryId,
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addTodo(trimmed, reminderAt, priority, categoryId);
    clearInput();
    Keyboard.dismiss();
  };

  return {
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    handleAdd,
  };
}
