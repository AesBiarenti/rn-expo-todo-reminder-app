import type { TodoModel } from "../../types/todo";
import {
  parseDateLocal,
  parseTimeToDate,
  toDateStr,
} from "../dateUtils";

function getNextRecurringOccurrence(todo: TodoModel): Date | null {
  const now = Date.now();
  const rt = todo.recurrenceType;
  const time = todo.recurrenceTime ?? "09:00";
  const startStr = todo.recurrenceStartDate;
  const endStr = todo.recurrenceEndDate;

  if (!rt || !startStr) return null;

  const start = parseDateLocal(startStr);
  start.setHours(0, 0, 0, 0);
  if (start.getTime() > now) {
    let first: Date;
    if (rt === "weekly") {
      const dow = todo.recurrenceDayOfWeek ?? 0;
      const diff = (dow - start.getDay() + 7) % 7;
      first = new Date(start);
      first.setDate(first.getDate() + (diff === 0 && start.getTime() < now ? 7 : diff));
    } else if (rt === "monthly") {
      first = new Date(start.getFullYear(), start.getMonth(), todo.recurrenceDayOfMonth ?? 1);
    } else {
      first = new Date(start.getFullYear(), (todo.recurrenceMonth ?? 1) - 1, todo.recurrenceDayOfMonth ?? 1);
    }
    const occ = parseTimeToDate(toDateStr(first), time);
    if (occ.getTime() > now) return occ;
  }

  const today = new Date();
  const maxIter = 365;

  if (rt === "weekly") {
    const dow = todo.recurrenceDayOfWeek ?? 0;
    let d = new Date(today);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < maxIter; i++) {
      if (d.getTime() < start.getTime()) {
        d.setDate(d.getDate() + 1);
        continue;
      }
      if (endStr) {
        const end = parseDateLocal(endStr);
        end.setHours(23, 59, 59, 999);
        if (d.getTime() > end.getTime()) break;
      }
      if (d.getDay() === dow) {
        const occ = parseTimeToDate(toDateStr(d), time);
        if (occ.getTime() > now) return occ;
      }
      d.setDate(d.getDate() + 1);
    }
  } else if (rt === "monthly") {
    const dom = todo.recurrenceDayOfMonth ?? 1;
    let d = new Date(today);
    d.setDate(dom);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < maxIter; i++) {
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const actualDom = Math.min(dom, lastDay);
      const check = new Date(d.getFullYear(), d.getMonth(), actualDom);
      check.setHours(0, 0, 0, 0);
      if (check.getTime() < start.getTime()) {
        d.setMonth(d.getMonth() + 1);
        continue;
      }
      if (endStr) {
        const end = parseDateLocal(endStr);
        end.setHours(23, 59, 59, 999);
        if (check.getTime() > end.getTime()) break;
      }
      const occ = parseTimeToDate(toDateStr(check), time);
      if (occ.getTime() > now) return occ;
      d.setMonth(d.getMonth() + 1);
    }
  } else if (rt === "yearly") {
    const month = (todo.recurrenceMonth ?? 1) - 1;
    const dom = todo.recurrenceDayOfMonth ?? 1;
    let d = new Date(today.getFullYear(), month, dom);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < maxIter; i++) {
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const actualDom = Math.min(dom, lastDay);
      const check = new Date(d.getFullYear(), d.getMonth(), actualDom);
      check.setHours(0, 0, 0, 0);
      if (check.getTime() < start.getTime()) {
        d.setFullYear(d.getFullYear() + 1);
        continue;
      }
      if (endStr) {
        const end = parseDateLocal(endStr);
        end.setHours(23, 59, 59, 999);
        if (check.getTime() > end.getTime()) break;
      }
      const occ = parseTimeToDate(toDateStr(check), time);
      if (occ.getTime() > now) return occ;
      d.setFullYear(d.getFullYear() + 1);
    }
  }
  return null;
}

function getNextWeeklyDaysOccurrence(todo: TodoModel): Date | null {
  const now = Date.now();
  const weekdays = todo.weekdays ?? [];
  const times = todo.weeklyTimes ?? ["09:00"];
  const startStr = todo.weeklyStartDate;
  const endStr = todo.weeklyEndDate;

  if (weekdays.length === 0) return null;

  const start = startStr ? parseDateLocal(startStr) : new Date(0);
  start.setHours(0, 0, 0, 0);

  let d = new Date();
  d.setHours(0, 0, 0, 0);
  const maxIter = 365;

  for (let i = 0; i < maxIter; i++) {
    if (d.getTime() < start.getTime()) {
      d.setDate(d.getDate() + 1);
      continue;
    }
    if (endStr) {
      const end = parseDateLocal(endStr);
      end.setHours(23, 59, 59, 999);
      if (d.getTime() > end.getTime()) break;
    }
    if (weekdays.includes(d.getDay())) {
      const dateStr = toDateStr(d);
      for (const t of times) {
        const occ = parseTimeToDate(dateStr, t);
        if (occ.getTime() > now) return occ;
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return null;
}

export function getNextOccurrence(todo: TodoModel): Date | null {
  switch (todo.scheduleType) {
    case "one_time": {
      if (!todo.reminderAt) return null;
      const d = new Date(todo.reminderAt);
      const now = Date.now();
      return d.getTime() > now && !todo.completed ? d : null;
    }
    case "multi_times_daily":
    case "ongoing": {
      if (!todo.startDate) return null;
      const times = todo.dailyTimes ?? ["09:00"];
      const now = Date.now();
      const todayStr = toDateStr(new Date());
      const start = parseDateLocal(todo.startDate);
      start.setHours(0, 0, 0, 0);
      if (start.getTime() > now) {
        return parseTimeToDate(todo.startDate, times[0]);
      }
      if (todo.scheduleType === "multi_times_daily" && todo.endDate) {
        const end = parseDateLocal(todo.endDate);
        end.setHours(23, 59, 59, 999);
        if (end.getTime() < now) return null;
      }
      for (const t of times) {
        const d = parseTimeToDate(todayStr, t);
        if (d.getTime() > now) return d;
      }
      let d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      const maxIter = 365;
      for (let i = 0; i < maxIter; i++) {
        const dateStr = toDateStr(d);
        if (todo.scheduleType === "multi_times_daily" && todo.endDate) {
          const end = parseDateLocal(todo.endDate);
          end.setHours(23, 59, 59, 999);
          if (d.getTime() > end.getTime()) return null;
        }
        for (const t of times) {
          const occ = parseTimeToDate(dateStr, t);
          if (occ.getTime() > now) return occ;
        }
        d.setDate(d.getDate() + 1);
      }
      return null;
    }
    case "recurring":
      return getNextRecurringOccurrence(todo);
    case "weekly_days":
      return getNextWeeklyDaysOccurrence(todo);
    case "shopping_list":
      return null;
    default:
      return null;
  }
}
