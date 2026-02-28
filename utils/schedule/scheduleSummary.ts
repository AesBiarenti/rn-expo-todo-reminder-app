import i18n from "../../i18n";
import type { TodoModel } from "../../types/todo";
import { formatDateShort, parseDateLocal } from "../dateUtils";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTH_KEYS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

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
