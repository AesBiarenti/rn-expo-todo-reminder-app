export type Priority = "low" | "medium" | "high";

export type CategoryId = "work" | "personal" | "shopping" | "health" | "other";

export type TaskScheduleType =
  | "one_time"
  | "multi_times_daily"
  | "ongoing"
  | "shopping_list"
  | "recurring"
  | "weekly_days";

export type RecurrenceType = "weekly" | "monthly" | "yearly";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoModel {
  id: string;
  text: string;
  completed: boolean;
  scheduleType: TaskScheduleType;
  reminderAt?: string;
  startDate?: string;
  endDate?: string;
  dailyTimes?: string[];
  completedSlots?: Record<string, string[]>;
  priority?: Priority;
  categoryId?: CategoryId;
  createdAt: string;

  // shopping_list
  checklistItems?: ChecklistItem[];

  // recurring (weekly | monthly | yearly)
  recurrenceType?: RecurrenceType;
  recurrenceDayOfWeek?: number;
  recurrenceDayOfMonth?: number;
  recurrenceMonth?: number;
  recurrenceTime?: string;
  recurrenceStartDate?: string;
  recurrenceEndDate?: string;

  // weekly_days
  weekdays?: number[];
  weeklyTimes?: string[];
  weeklyStartDate?: string;
  weeklyEndDate?: string;
}
