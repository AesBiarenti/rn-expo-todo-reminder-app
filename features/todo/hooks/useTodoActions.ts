import { Keyboard } from "react-native";
import { useTodoStore } from "../../../store/todoStore";

export function useTodoActions() {
  const addTodo = useTodoStore((s) => s.addTodo);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);
  const clearCompleted = useTodoStore((s) => s.clearCompleted);

  const handleAdd = (text: string, clearInput: () => void, reminderAt?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addTodo(trimmed, reminderAt);
    clearInput();
    Keyboard.dismiss();
  };

  return {
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    handleAdd,
  };
}
