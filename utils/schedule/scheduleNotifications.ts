import type { TodoModel } from "../../types/todo";
import { parseDateLocal, parseTimeToDate, toDateStr } from "../dateUtils";

export function getRecurringNotificationDates(
  todo: TodoModel,
  maxCount: number
): Date[] {
  const results: Date[] = [];
  const now = Date.now();
  const rt = todo.recurrenceType;
  const time = todo.recurrenceTime ?? "09:00";
  const startStr = todo.recurrenceStartDate;
  const endStr = todo.recurrenceEndDate;

  if (!rt || !startStr) return results;

  const start = parseDateLocal(startStr);
  start.setHours(0, 0, 0, 0);
  let d = new Date(Math.max(start.getTime(), now));
  d.setHours(0, 0, 0, 0);
  const maxIter = 500;

  if (rt === "weekly") {
    const dow = todo.recurrenceDayOfWeek ?? 0;
    let iter = 0;
    while (results.length < maxCount && iter < maxIter) {
      if (endStr) {
        const end = parseDateLocal(endStr);
        end.setHours(23, 59, 59, 999);
        if (d.getTime() > end.getTime()) break;
      }
      if (d.getDay() === dow) {
        const occ = parseTimeToDate(toDateStr(d), time);
        if (occ.getTime() > now) {
          results.push(occ);
        }
      }
      d.setDate(d.getDate() + 1);
      iter++;
    }
  } else if (rt === "monthly") {
    const dom = todo.recurrenceDayOfMonth ?? 1;
    let year = d.getFullYear();
    let month = d.getMonth();
    let iter = 0;
    while (results.length < maxCount && iter < maxIter) {
      const lastDay = new Date(year, month + 1, 0).getDate();
      const actualDom = Math.min(dom, lastDay);
      const check = new Date(year, month, actualDom);
      const occ = parseTimeToDate(toDateStr(check), time);
      if (occ.getTime() > now) {
        results.push(occ);
      }
      if (endStr) {
        const end = parseDateLocal(endStr);
        end.setHours(23, 59, 59, 999);
        if (check.getTime() > end.getTime()) break;
      }
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      iter++;
    }
  } else if (rt === "yearly") {
    const recMonth = (todo.recurrenceMonth ?? 1) - 1;
    const dom = todo.recurrenceDayOfMonth ?? 1;
    let year = d.getFullYear();
    let iter = 0;
    while (results.length < maxCount && iter < maxIter) {
      const lastDay = new Date(year, recMonth + 1, 0).getDate();
      const actualDom = Math.min(dom, lastDay);
      const check = new Date(year, recMonth, actualDom);
      const occ = parseTimeToDate(toDateStr(check), time);
      if (occ.getTime() > now) {
        results.push(occ);
      }
      if (endStr) {
        const end = parseDateLocal(endStr);
        end.setHours(23, 59, 59, 999);
        if (check.getTime() > end.getTime()) break;
      }
      year += 1;
      iter++;
    }
  }
  return results.slice(0, maxCount);
}

export function getWeeklyDaysNotificationDates(
  todo: TodoModel,
  maxCount: number
): Date[] {
  const results: Date[] = [];
  const now = Date.now();
  const weekdays = todo.weekdays ?? [];
  const times = todo.weeklyTimes ?? ["09:00"];
  const startStr = todo.weeklyStartDate;
  const endStr = todo.weeklyEndDate;

  if (weekdays.length === 0) return results;

  const start = startStr ? parseDateLocal(startStr) : new Date();
  start.setHours(0, 0, 0, 0);
  let d = new Date(Math.max(start.getTime(), now));
  d.setHours(0, 0, 0, 0);
  const maxIter = 365;

  for (let i = 0; i < maxIter && results.length < maxCount; i++) {
    if (endStr) {
      const end = parseDateLocal(endStr);
      end.setHours(23, 59, 59, 999);
      if (d.getTime() > end.getTime()) break;
    }
    if (weekdays.includes(d.getDay())) {
      const dateStr = toDateStr(d);
      for (const t of times) {
        const occ = parseTimeToDate(dateStr, t);
        if (occ.getTime() > now) {
          results.push(occ);
          if (results.length >= maxCount) break;
        }
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return results.slice(0, maxCount);
}

export function getDateStringsWithTasks(
  todos: TodoModel[],
  fromDate: Date,
  toDate: Date
): Set<string> {
  const result = new Set<string>();
  const fromTime = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime();
  const toTime = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()).getTime();

  for (const todo of todos) {
    switch (todo.scheduleType) {
      case "one_time": {
        if (!todo.reminderAt || todo.completed) break;
        const d = new Date(todo.reminderAt);
        const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        if (t >= fromTime && t <= toTime) {
          result.add(toDateStr(d));
        }
        break;
      }
      case "multi_times_daily":
      case "ongoing": {
        if (!todo.startDate) break;
        let start = parseDateLocal(todo.startDate);
        start.setHours(0, 0, 0, 0);
        let end: Date;
        if (todo.scheduleType === "multi_times_daily" && todo.endDate) {
          end = parseDateLocal(todo.endDate);
          end.setHours(23, 59, 59, 999);
        } else {
          end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
        }
        const rangeStart = Math.max(start.getTime(), fromTime);
        const rangeEnd = Math.min(end.getTime(), toTime);
        let d = new Date(rangeStart);
        d.setHours(0, 0, 0, 0);
        while (d.getTime() <= rangeEnd) {
          result.add(toDateStr(d));
          d.setDate(d.getDate() + 1);
        }
        break;
      }
      case "weekly_days": {
        const weekdays = todo.weekdays ?? [];
        if (weekdays.length === 0) break;
        const startStr = todo.weeklyStartDate;
        const endStr = todo.weeklyEndDate;
        let d = new Date(fromTime);
        d.setHours(0, 0, 0, 0);
        if (startStr) {
          const start = parseDateLocal(startStr);
          start.setHours(0, 0, 0, 0);
          if (start.getTime() > d.getTime()) d = start;
        }
        const maxEnd = endStr
          ? parseDateLocal(endStr)
          : new Date(toDate);
        maxEnd.setHours(23, 59, 59, 999);
        const rangeEnd = Math.min(maxEnd.getTime(), toTime);
        let iter = 0;
        while (d.getTime() <= rangeEnd && iter < 730) {
          if (weekdays.includes(d.getDay())) {
            result.add(toDateStr(d));
          }
          d.setDate(d.getDate() + 1);
          iter++;
        }
        break;
      }
      case "recurring": {
        const rt = todo.recurrenceType;
        const startStr = todo.recurrenceStartDate;
        const endStr = todo.recurrenceEndDate;
        if (!rt || !startStr) break;
        const start = parseDateLocal(startStr);
        start.setHours(0, 0, 0, 0);
        const effectiveStart = Math.max(start.getTime(), fromTime);
        let d = new Date(effectiveStart);
        d.setHours(0, 0, 0, 0);
        const maxIter = 500;
        let iter = 0;

        if (rt === "weekly") {
          const dow = todo.recurrenceDayOfWeek ?? 0;
          while (d.getTime() <= toTime && iter < maxIter) {
            if (endStr) {
              const end = parseDateLocal(endStr);
              end.setHours(23, 59, 59, 999);
              if (d.getTime() > end.getTime()) break;
            }
            if (d.getDay() === dow) {
              result.add(toDateStr(d));
            }
            d.setDate(d.getDate() + 1);
            iter++;
          }
        } else if (rt === "monthly") {
          const dom = todo.recurrenceDayOfMonth ?? 1;
          let year = d.getFullYear();
          let month = d.getMonth();
          while (iter < maxIter) {
            const lastDay = new Date(year, month + 1, 0).getDate();
            const actualDom = Math.min(dom, lastDay);
            const check = new Date(year, month, actualDom);
            if (check.getTime() > toTime) break;
            if (check.getTime() >= fromTime) {
              result.add(toDateStr(check));
            }
            if (endStr) {
              const end = parseDateLocal(endStr);
              end.setHours(23, 59, 59, 999);
              if (check.getTime() > end.getTime()) break;
            }
            month += 1;
            if (month > 11) {
              month = 0;
              year += 1;
            }
            iter++;
          }
        } else if (rt === "yearly") {
          const recMonth = (todo.recurrenceMonth ?? 1) - 1;
          const dom = todo.recurrenceDayOfMonth ?? 1;
          let year = d.getFullYear();
          while (iter < maxIter) {
            const lastDay = new Date(year, recMonth + 1, 0).getDate();
            const actualDom = Math.min(dom, lastDay);
            const check = new Date(year, recMonth, actualDom);
            if (check.getTime() > toTime) break;
            if (check.getTime() >= fromTime) {
              result.add(toDateStr(check));
            }
            if (endStr) {
              const end = parseDateLocal(endStr);
              end.setHours(23, 59, 59, 999);
              if (check.getTime() > end.getTime()) break;
            }
            year += 1;
            iter++;
          }
        }
        break;
      }
      case "shopping_list":
        break;
      default:
        break;
    }
  }
  return result;
}

export function getDateTaskCounts(
  todos: TodoModel[],
  fromDate: Date,
  toDate: Date
): Record<string, number> {
  const result: Record<string, number> = {};
  const fromTime = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime();
  const toTime = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()).getTime();

  const inc = (dateStr: string) => {
    result[dateStr] = (result[dateStr] ?? 0) + 1;
  };

  for (const todo of todos) {
    switch (todo.scheduleType) {
      case "one_time": {
        if (!todo.reminderAt || todo.completed) break;
        const d = new Date(todo.reminderAt);
        const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        if (t >= fromTime && t <= toTime) {
          inc(toDateStr(d));
        }
        break;
      }
      case "multi_times_daily":
      case "ongoing": {
        if (!todo.startDate) break;
        let start = parseDateLocal(todo.startDate);
        start.setHours(0, 0, 0, 0);
        let end: Date;
        if (todo.scheduleType === "multi_times_daily" && todo.endDate) {
          end = parseDateLocal(todo.endDate);
          end.setHours(23, 59, 59, 999);
        } else {
          end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
        }
        const rangeStart = Math.max(start.getTime(), fromTime);
        const rangeEnd = Math.min(end.getTime(), toTime);
        let d = new Date(rangeStart);
        d.setHours(0, 0, 0, 0);
        while (d.getTime() <= rangeEnd) {
          inc(toDateStr(d));
          d.setDate(d.getDate() + 1);
        }
        break;
      }
      case "weekly_days": {
        const weekdays = todo.weekdays ?? [];
        if (weekdays.length === 0) break;
        const startStr = todo.weeklyStartDate;
        const endStr = todo.weeklyEndDate;
        let d = new Date(fromTime);
        d.setHours(0, 0, 0, 0);
        if (startStr) {
          const start = parseDateLocal(startStr);
          start.setHours(0, 0, 0, 0);
          if (start.getTime() > d.getTime()) d = start;
        }
        const maxEnd = endStr
          ? parseDateLocal(endStr)
          : new Date(toDate);
        maxEnd.setHours(23, 59, 59, 999);
        const rangeEnd = Math.min(maxEnd.getTime(), toTime);
        let iter = 0;
        while (d.getTime() <= rangeEnd && iter < 730) {
          if (weekdays.includes(d.getDay())) {
            inc(toDateStr(d));
          }
          d.setDate(d.getDate() + 1);
          iter++;
        }
        break;
      }
      case "recurring": {
        const rt = todo.recurrenceType;
        const startStr = todo.recurrenceStartDate;
        const endStr = todo.recurrenceEndDate;
        if (!rt || !startStr) break;
        const start = parseDateLocal(startStr);
        start.setHours(0, 0, 0, 0);
        const effectiveStart = Math.max(start.getTime(), fromTime);
        let d = new Date(effectiveStart);
        d.setHours(0, 0, 0, 0);
        const maxIter = 500;
        let iter = 0;

        if (rt === "weekly") {
          const dow = todo.recurrenceDayOfWeek ?? 0;
          while (d.getTime() <= toTime && iter < maxIter) {
            if (endStr) {
              const end = parseDateLocal(endStr);
              end.setHours(23, 59, 59, 999);
              if (d.getTime() > end.getTime()) break;
            }
            if (d.getDay() === dow) {
              inc(toDateStr(d));
            }
            d.setDate(d.getDate() + 1);
            iter++;
          }
        } else if (rt === "monthly") {
          const dom = todo.recurrenceDayOfMonth ?? 1;
          let year = d.getFullYear();
          let month = d.getMonth();
          while (iter < maxIter) {
            const lastDay = new Date(year, month + 1, 0).getDate();
            const actualDom = Math.min(dom, lastDay);
            const check = new Date(year, month, actualDom);
            if (check.getTime() > toTime) break;
            if (check.getTime() >= fromTime) {
              inc(toDateStr(check));
            }
            if (endStr) {
              const end = parseDateLocal(endStr);
              end.setHours(23, 59, 59, 999);
              if (check.getTime() > end.getTime()) break;
            }
            month += 1;
            if (month > 11) {
              month = 0;
              year += 1;
            }
            iter++;
          }
        } else if (rt === "yearly") {
          const recMonth = (todo.recurrenceMonth ?? 1) - 1;
          const dom = todo.recurrenceDayOfMonth ?? 1;
          let year = d.getFullYear();
          while (iter < maxIter) {
            const lastDay = new Date(year, recMonth + 1, 0).getDate();
            const actualDom = Math.min(dom, lastDay);
            const check = new Date(year, recMonth, actualDom);
            if (check.getTime() > toTime) break;
            if (check.getTime() >= fromTime) {
              inc(toDateStr(check));
            }
            if (endStr) {
              const end = parseDateLocal(endStr);
              end.setHours(23, 59, 59, 999);
              if (check.getTime() > end.getTime()) break;
            }
            year += 1;
            iter++;
          }
        }
        break;
      }
      case "shopping_list":
        break;
      default:
        break;
    }
  }
  return result;
}

export function getNotificationDates(
  todo: TodoModel,
  maxCount: number = 100
): Date[] {
  const results: Date[] = [];
  const now = Date.now();

  if (todo.scheduleType === "one_time") {
    if (todo.reminderAt && !todo.completed) {
      const d = new Date(todo.reminderAt);
      if (d.getTime() > now) results.push(d);
    }
    return results;
  }

  if (todo.scheduleType === "recurring") {
    return getRecurringNotificationDates(todo, maxCount);
  }

  if (todo.scheduleType === "weekly_days") {
    return getWeeklyDaysNotificationDates(todo, maxCount);
  }

  if (todo.scheduleType === "shopping_list") {
    return results;
  }

  const times = todo.dailyTimes ?? ["09:00"];
  let start: Date;
  let end: Date | null = null;

  if (todo.startDate) {
    start = parseDateLocal(todo.startDate);
    start.setHours(0, 0, 0, 0);
  } else {
    return results;
  }

  if (todo.scheduleType === "multi_times_daily" && todo.endDate) {
    end = parseDateLocal(todo.endDate);
    end.setHours(23, 59, 59, 999);
  } else if (todo.scheduleType === "ongoing") {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    end = future;
  }

  let d = new Date(Math.max(start.getTime(), now));
  d.setHours(0, 0, 0, 0);
  const maxIter = 365;
  let iter = 0;

  while (results.length < maxCount && iter < maxIter) {
    if (end && d.getTime() > end.getTime()) break;
    const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    for (const t of times) {
      const occ = parseTimeToDate(dateStr, t);
      if (occ.getTime() > now) {
        results.push(occ);
        if (results.length >= maxCount) break;
      }
    }
    d.setDate(d.getDate() + 1);
    iter++;
  }

  return results.slice(0, maxCount);
}
