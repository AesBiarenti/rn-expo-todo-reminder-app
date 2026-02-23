import type { AddTodoParams } from "../../../store/todoStore";
import { Keyboard } from "react-native";
import { useTodoStore } from "../../../store/todoStore";

export function useTodoActions() {
  const addTodo = useTodoStore((s) => s.addTodo);
  const updateTodo = useTodoStore((s) => s.updateTodo);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const toggleTodoSlot = useTodoStore((s) => s.toggleTodoSlot);
  const toggleChecklistItem = useTodoStore((s) => s.toggleChecklistItem);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);
  const clearCompleted = useTodoStore((s) => s.clearCompleted);

  const handleAdd = (params: AddTodoParams, clearInput?: () => void) => {
    const trimmed = params.text.trim();
    if (!trimmed) return;
    addTodo({ ...params, text: trimmed });
    clearInput?.();
    Keyboard.dismiss();
  };

  return {
    addTodo,
    updateTodo,
    toggleTodo,
    toggleTodoSlot,
    toggleChecklistItem,
    deleteTodo,
    clearCompleted,
    handleAdd,
  };
}
