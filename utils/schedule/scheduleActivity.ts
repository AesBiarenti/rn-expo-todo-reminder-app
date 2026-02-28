import type { TodoModel } from "../../types/todo";
import { parseDateLocal, toDateStr } from "../dateUtils";

export function isTaskActiveOnDate(todo: TodoModel, dateStr: string): boolean {
  const checkDate = parseDateLocal(dateStr);
  checkDate.setHours(12, 0, 0, 0);

  switch (todo.scheduleType) {
    case "one_time": {
      if (!todo.reminderAt || todo.completed) return false;
      return toDateStr(new Date(todo.reminderAt)) === dateStr;
    }
    case "multi_times_daily":
    case "ongoing": {
      if (!todo.startDate) return false;
      const start = parseDateLocal(todo.startDate);
      start.setHours(0, 0, 0, 0);
      if (checkDate < start) return false;
      if (todo.scheduleType === "multi_times_daily" && todo.endDate) {
        const end = parseDateLocal(todo.endDate);
        end.setHours(23, 59, 59, 999);
        if (checkDate > end) return false;
      }
      return true;
    }
    case "weekly_days": {
      const weekdays = todo.weekdays ?? [];
      if (weekdays.length === 0) return false;
      const dow = checkDate.getDay();
      if (!weekdays.includes(dow)) return false;
      if (todo.weeklyStartDate) {
        const start = parseDateLocal(todo.weeklyStartDate);
        start.setHours(0, 0, 0, 0);
        if (checkDate < start) return false;
      }
      if (todo.weeklyEndDate) {
        const end = parseDateLocal(todo.weeklyEndDate);
        end.setHours(23, 59, 59, 999);
        if (checkDate > end) return false;
      }
      return true;
    }
    case "recurring": {
      const rt = todo.recurrenceType;
      const startStr = todo.recurrenceStartDate;
      const endStr = todo.recurrenceEndDate;
      if (!rt || !startStr) return false;
      const start = parseDateLocal(startStr);
      start.setHours(0, 0, 0, 0);
      if (checkDate < start) return false;
      if (endStr) {
        const end = parseDateLocal(endStr);
        end.setHours(23, 59, 59, 999);
        if (checkDate > end) return false;
      }
      if (rt === "weekly") {
        return checkDate.getDay() === (todo.recurrenceDayOfWeek ?? 0);
      }
      if (rt === "monthly") {
        const dom = todo.recurrenceDayOfMonth ?? 1;
        const lastDay = new Date(
          checkDate.getFullYear(),
          checkDate.getMonth() + 1,
          0
        ).getDate();
        return checkDate.getDate() === Math.min(dom, lastDay);
      }
      if (rt === "yearly") {
        const recMonth = (todo.recurrenceMonth ?? 1) - 1;
        const dom = todo.recurrenceDayOfMonth ?? 1;
        return (
          checkDate.getMonth() === recMonth &&
          checkDate.getDate() ===
            Math.min(
              dom,
              new Date(checkDate.getFullYear(), recMonth + 1, 0).getDate()
            )
        );
      }
      return false;
    }
    case "shopping_list":
      return false;
    default:
      return false;
  }
}

export function isTaskActiveToday(todo: TodoModel): boolean {
  const today = new Date();
  const todayStr = toDateStr(today);

  switch (todo.scheduleType) {
    case "one_time": {
      if (!todo.reminderAt) return false;
      const d = new Date(todo.reminderAt);
      return toDateStr(d) === todayStr && !todo.completed;
    }
    case "multi_times_daily":
    case "ongoing": {
      if (!todo.startDate) return false;
      const start = parseDateLocal(todo.startDate);
      start.setHours(0, 0, 0, 0);
      if (today < start) return false;
      if (todo.scheduleType === "multi_times_daily" && todo.endDate) {
        const end = parseDateLocal(todo.endDate);
        end.setHours(23, 59, 59, 999);
        if (today > end) return false;
      }
      return true;
    }
    case "weekly_days": {
      const weekdays = todo.weekdays ?? [];
      if (weekdays.length === 0) return false;
      const todayDow = today.getDay();
      if (!weekdays.includes(todayDow)) return false;
      if (todo.weeklyStartDate) {
        const start = parseDateLocal(todo.weeklyStartDate);
        start.setHours(0, 0, 0, 0);
        if (today < start) return false;
      }
      if (todo.weeklyEndDate) {
        const end = parseDateLocal(todo.weeklyEndDate);
        end.setHours(23, 59, 59, 999);
        if (today > end) return false;
      }
      return true;
    }
    case "recurring":
    case "shopping_list":
      return false;
    default:
      return false;
  }
}

export function isSlotCompleted(
  todo: TodoModel,
  dateStr: string,
  timeStr: string
): boolean {
  const slots = todo.completedSlots ?? {};
  const daySlots = slots[dateStr] ?? [];
  return daySlots.includes(timeStr);
}

export function getTodaysSlots(todo: TodoModel): string[] {
  if (
    todo.scheduleType !== "multi_times_daily" &&
    todo.scheduleType !== "ongoing" &&
    todo.scheduleType !== "weekly_days"
  ) {
    return [];
  }
  if (todo.scheduleType === "weekly_days") {
    const times = todo.weeklyTimes ?? ["09:00"];
    if (!isTaskActiveToday(todo)) return [];
    return times;
  }
  const times = todo.dailyTimes ?? [];
  if (times.length === 0) return [];

  if (!isTaskActiveToday(todo)) return [];

  return times;
}
