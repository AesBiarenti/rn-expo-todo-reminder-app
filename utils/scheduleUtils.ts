import i18n from "../i18n";
import type { RecurrenceType, TodoModel } from "../types/todo";
import { formatDateShort, parseDateLocal } from "./dateUtils";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTH_KEYS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseTimeToDate(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = parseDateLocal(dateStr);
  d.setHours(h ?? 9, m ?? 0, 0, 0);
  return d;
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

  const today = toDateStr(new Date());
  if (!isTaskActiveToday(todo)) return [];

  return times;
}

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
  const todayStr = toDateStr(new Date());

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
  const now = Date.now();

  switch (todo.scheduleType) {
    case "one_time": {
      if (!todo.reminderAt) return null;
      const d = new Date(todo.reminderAt);
      return d.getTime() > now && !todo.completed ? d : null;
    }
    case "multi_times_daily":
    case "ongoing": {
      if (!todo.startDate) return null;
      const times = todo.dailyTimes ?? ["09:00"];
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

export function formatScheduleSummary(todo: TodoModel): string {
  const t = i18n.t.bind(i18n);
  switch (todo.scheduleType) {
    case "one_time": {
      if (!todo.reminderAt) return t("scheduleUtils.dateNotSet");
      const d = new Date(todo.reminderAt);
      const time = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      return `${formatDateShort(d)} ${time}`;
    }
    case "multi_times_daily": {
      if (!todo.startDate) return t("scheduleUtils.startNotSet");
      const times = todo.dailyTimes?.length
        ? todo.dailyTimes.join(", ")
        : t("scheduleUtils.timeNotSet");
      if (!todo.endDate) {
        return `${t("scheduleUtils.everyDay")} ${times}`;
      }
      const start = formatDateShort(parseDateLocal(todo.startDate));
      const end = formatDateShort(parseDateLocal(todo.endDate));
      return `${start} - ${end} • ${times}`;
    }
    case "ongoing": {
      if (!todo.startDate) return t("scheduleUtils.startNotSet");
      const start = formatDateShort(parseDateLocal(todo.startDate));
      const times = todo.dailyTimes?.length
        ? ` • ${todo.dailyTimes.join(", ")}`
        : "";
      return `${start} ${t("scheduleUtils.fromOngoing")}${times}`;
    }
    case "shopping_list": {
      const items = todo.checklistItems ?? [];
      const done = items.filter((i) => i.completed).length;
      return t("scheduleUtils.itemsCount", { done, total: items.length });
    }
    case "recurring": {
      const rt = todo.recurrenceType;
      const time = todo.recurrenceTime ?? "09:00";
      if (!rt) return t("scheduleUtils.recurrenceNotSet");
      if (rt === "weekly") {
        const dow = todo.recurrenceDayOfWeek ?? 0;
        const dayName = t(`weekdays.${WEEKDAY_KEYS[dow]}`);
        return `${t("scheduleUtils.every")} ${dayName} ${time}`;
      }
      if (rt === "monthly") {
        const dom = todo.recurrenceDayOfMonth ?? 1;
        return t("scheduleUtils.everyMonthDay", { day: dom }) + ` ${time}`;
      }
      if (rt === "yearly") {
        const month = todo.recurrenceMonth ?? 1;
        const dom = todo.recurrenceDayOfMonth ?? 1;
        const monthName = t(`months.${MONTH_KEYS[month - 1]}`);
        return `${t("scheduleUtils.everyYear")} ${dom} ${monthName} ${time}`;
      }
      return "";
    }
    case "weekly_days": {
      const weekdays = todo.weekdays ?? [];
      const names = weekdays
        .map((d) => t(`weekdays.${WEEKDAY_KEYS[d]}`))
        .filter(Boolean)
        .join(", ");
      const times = todo.weeklyTimes?.length
        ? ` • ${todo.weeklyTimes.join(", ")}`
        : "";
      return weekdays.length ? `${names}${times}` : t("scheduleUtils.dayNotSelected");
    }
    default:
      return "";
  }
}

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

/** Returns YYYY-MM-DD strings for dates that have at least one task in the given range. */
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
