import type {
  CategoryId,
  ChecklistItem,
  Priority,
  RecurrenceType,
  TaskScheduleType,
  TodoModel,
} from "../types/todo";

export const VALID_SCHEDULE_TYPES: TaskScheduleType[] = [
  "one_time",
  "multi_times_daily",
  "ongoing",
  "shopping_list",
  "recurring",
  "weekly_days",
];

export function migrateChecklistItem(item: unknown): ChecklistItem | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.text !== "string") return null;
  return {
    id: String(o.id),
    text: String(o.text),
    completed: Boolean(o.completed),
  };
}

export function migrateTodo(todo: Record<string, unknown>): TodoModel {
  const createdAt =
    typeof todo.createdAt === "string"
      ? todo.createdAt
      : typeof todo.id === "string"
        ? new Date(parseInt(todo.id, 10) || Date.now()).toISOString()
        : new Date().toISOString();

  const hasReminderAt = todo.reminderAt && typeof todo.reminderAt === "string";
  const rawScheduleType = todo.scheduleType as string | undefined;
  let scheduleType: TaskScheduleType =
    VALID_SCHEDULE_TYPES.includes(rawScheduleType as TaskScheduleType)
      ? (rawScheduleType as TaskScheduleType)
      : (hasReminderAt ? "one_time" : "one_time");
  if (rawScheduleType === "date_range") {
    scheduleType = "multi_times_daily";
  }
  const needsCompletedSlots =
    scheduleType === "multi_times_daily" ||
    scheduleType === "ongoing" ||
    scheduleType === "weekly_days";
  const base: TodoModel = {
    id: String(todo.id),
    text: String(todo.text),
    completed: Boolean(todo.completed),
    scheduleType,
    priority: todo.priority as Priority | undefined,
    categoryId: todo.categoryId as CategoryId | undefined,
    createdAt,
  };

  if (scheduleType === "one_time" && hasReminderAt) {
    return { ...base, reminderAt: String(todo.reminderAt) };
  }
  if (scheduleType === "one_time" && !hasReminderAt) {
    const created = new Date(createdAt);
    return {
      ...base,
      startDate: `${created.getFullYear()}-${(created.getMonth() + 1).toString().padStart(2, "0")}-${created.getDate().toString().padStart(2, "0")}`,
    };
  }

  const dailyTimesArr = Array.isArray(todo.dailyTimes)
    ? (todo.dailyTimes as unknown[]).map(String)
    : [];
  const hasDailyTimes = dailyTimesArr.length > 0;
  const checklistItems = Array.isArray(todo.checklistItems)
    ? (todo.checklistItems as unknown[])
        .map(migrateChecklistItem)
        .filter((x): x is ChecklistItem => x !== null)
    : undefined;

  const result: TodoModel = {
    ...base,
    ...(todo.reminderAt ? { reminderAt: String(todo.reminderAt) } : {}),
    ...(todo.startDate ? { startDate: String(todo.startDate) } : {}),
    ...(todo.endDate ? { endDate: String(todo.endDate) } : {}),
    ...(hasDailyTimes
      ? { dailyTimes: dailyTimesArr }
      : needsCompletedSlots
        ? { dailyTimes: ["09:00"] }
        : {}),
    ...(todo.completedSlots && typeof todo.completedSlots === "object"
      ? { completedSlots: todo.completedSlots as Record<string, string[]> }
      : needsCompletedSlots
        ? { completedSlots: {} }
        : {}),
    ...(checklistItems?.length ? { checklistItems } : {}),
    ...(todo.recurrenceType
      ? { recurrenceType: todo.recurrenceType as RecurrenceType }
      : {}),
    ...(todo.recurrenceDayOfWeek != null
      ? { recurrenceDayOfWeek: Number(todo.recurrenceDayOfWeek) }
      : {}),
    ...(todo.recurrenceDayOfMonth != null
      ? { recurrenceDayOfMonth: Number(todo.recurrenceDayOfMonth) }
      : {}),
    ...(todo.recurrenceMonth != null
      ? { recurrenceMonth: Number(todo.recurrenceMonth) }
      : {}),
    ...(todo.recurrenceTime ? { recurrenceTime: String(todo.recurrenceTime) } : {}),
    ...(todo.recurrenceStartDate
      ? { recurrenceStartDate: String(todo.recurrenceStartDate) }
      : {}),
    ...(todo.recurrenceEndDate
      ? { recurrenceEndDate: String(todo.recurrenceEndDate) }
      : {}),
    ...(Array.isArray(todo.weekdays)
      ? { weekdays: (todo.weekdays as unknown[]).map(Number) }
      : {}),
    ...(Array.isArray(todo.weeklyTimes)
      ? { weeklyTimes: (todo.weeklyTimes as unknown[]).map(String) }
      : {}),
    ...(todo.weeklyStartDate
      ? { weeklyStartDate: String(todo.weeklyStartDate) }
      : {}),
    ...(todo.weeklyEndDate ? { weeklyEndDate: String(todo.weeklyEndDate) } : {}),
  };
  return result;
}
