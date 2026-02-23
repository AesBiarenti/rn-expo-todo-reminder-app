import type { Priority, RecurrenceType, TaskScheduleType } from "../../types/todo";

export const PRIORITIES: { value: Priority; labelKey: string }[] = [
  { value: "low", labelKey: "priorities.low" },
  { value: "medium", labelKey: "priorities.medium" },
  { value: "high", labelKey: "priorities.high" },
];

export const SCHEDULE_TYPES: { value: TaskScheduleType; labelKey: string; icon: string }[] = [
  { value: "one_time", labelKey: "scheduleTypes.oneTime", icon: "radio-button-on-outline" },
  { value: "multi_times_daily", labelKey: "scheduleTypes.dailyRoutine", icon: "repeat-outline" },
  { value: "ongoing", labelKey: "scheduleTypes.ongoing", icon: "infinite-outline" },
  { value: "shopping_list", labelKey: "scheduleTypes.shoppingList", icon: "cart-outline" },
  { value: "recurring", labelKey: "scheduleTypes.recurring", icon: "calendar-outline" },
  { value: "weekly_days", labelKey: "scheduleTypes.weeklyDays", icon: "fitness-outline" },
];

export const RECURRENCE_TYPES: { value: RecurrenceType; labelKey: string }[] = [
  { value: "weekly", labelKey: "recurrenceTypes.weekly" },
  { value: "monthly", labelKey: "recurrenceTypes.monthly" },
  { value: "yearly", labelKey: "recurrenceTypes.yearly" },
];

export const WEEKDAYS: { value: number; labelKey: string }[] = [
  { value: 0, labelKey: "weekdays.sun" },
  { value: 1, labelKey: "weekdays.mon" },
  { value: 2, labelKey: "weekdays.tue" },
  { value: 3, labelKey: "weekdays.wed" },
  { value: 4, labelKey: "weekdays.thu" },
  { value: 5, labelKey: "weekdays.fri" },
  { value: 6, labelKey: "weekdays.sat" },
];

export const MONTH_KEYS = [
  "months.jan",
  "months.feb",
  "months.mar",
  "months.apr",
  "months.may",
  "months.jun",
  "months.jul",
  "months.aug",
  "months.sep",
  "months.oct",
  "months.nov",
  "months.dec",
];
