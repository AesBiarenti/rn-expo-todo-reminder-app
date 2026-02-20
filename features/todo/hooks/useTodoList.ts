import { useMemo } from "react";
import { useTodoStore } from "../../../store/todoStore";
import type { TodoModel } from "../../../types/todo";
import type { FilterType } from "../components/TodoFilterBar";

export function useTodoList(filter: FilterType) {
  const todos = useTodoStore((s) => s.todos);

  const filteredTodos = useMemo(() => {
    if (filter === "active") {
      return todos.filter((t) => !t.completed);
    }
    if (filter === "completed") {
      return todos.filter((t) => t.completed);
    }
    return todos;
  }, [todos, filter]);

  const activeCount = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos],
  );

  return { todos, filteredTodos, activeCount };
}
