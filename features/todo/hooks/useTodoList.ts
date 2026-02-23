import { useMemo } from "react";
import { useTodoStore } from "../../../store/todoStore";
import type {
  CategoryId,
  Priority,
  TaskScheduleType,
  TodoModel,
} from "../../../types/todo";
import type { FilterType } from "../components/TodoFilterBar";
import { getNextOccurrence } from "../../../utils/scheduleUtils";

export type SortType = "created" | "reminder" | "priority" | "text";

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function getSortDate(todo: TodoModel): number {
  const next = getNextOccurrence(todo);
  if (next) return next.getTime();
  return Infinity;
}

export function useTodoList(
  filter: FilterType,
  searchQuery = "",
  categoryFilter?: CategoryId,
  sortBy: SortType = "created",
  scheduleTypeFilter?: TaskScheduleType,
) {
  const todos = useTodoStore((s) => s.todos);

  const filteredTodos = useMemo(() => {
    let result = todos;

    if (filter === "active") {
      result = result.filter((t) => !t.completed);
    } else if (filter === "completed") {
      result = result.filter((t) => t.completed);
    }

    if (categoryFilter) {
      result = result.filter((t) => t.categoryId === categoryFilter);
    }

    if (scheduleTypeFilter) {
      result = result.filter((t) => t.scheduleType === scheduleTypeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) =>
        t.text.toLowerCase().includes(q),
      );
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "created":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "reminder": {
          const ta = getSortDate(a);
          const tb = getSortDate(b);
          return ta - tb;
        }
        case "priority":
          const pa = PRIORITY_ORDER[a.priority ?? "medium"];
          const pb = PRIORITY_ORDER[b.priority ?? "medium"];
          return pb - pa;
        case "text":
          return a.text.localeCompare(b.text);
        default:
          return 0;
      }
    });

    return result;
  }, [todos, filter, categoryFilter, searchQuery, sortBy, scheduleTypeFilter]);

  const activeCount = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos],
  );

  return { todos, filteredTodos, activeCount };
}
