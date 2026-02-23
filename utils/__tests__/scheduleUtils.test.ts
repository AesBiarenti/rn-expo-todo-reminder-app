jest.mock("../../i18n", () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

import type { TodoModel } from "../../types/todo";
import {
  getNextOccurrence,
  isTaskActiveToday,
  getNotificationDates,
} from "../scheduleUtils";

function makeTodo(overrides: Partial<TodoModel> = {}): TodoModel {
  return {
    id: "1",
    text: "Test",
    completed: false,
    scheduleType: "one_time",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("scheduleUtils", () => {
  const realNow = Date.now;

  afterEach(() => {
    Date.now = realNow;
  });

  describe("getNextOccurrence", () => {
    it("one_time: returns reminder date when future and not completed", () => {
      const future = new Date(realNow() + 86400000);
      const todo = makeTodo({
        scheduleType: "one_time",
        reminderAt: future.toISOString(),
        completed: false,
      });
      const next = getNextOccurrence(todo);
      expect(next).not.toBeNull();
      expect(next!.getTime()).toBe(future.getTime());
    });

    it("one_time: returns null when reminder is past", () => {
      const past = new Date(realNow() - 86400000);
      const todo = makeTodo({
        scheduleType: "one_time",
        reminderAt: past.toISOString(),
        completed: false,
      });
      expect(getNextOccurrence(todo)).toBeNull();
    });

    it("one_time: returns null when completed", () => {
      const future = new Date(realNow() + 86400000);
      const todo = makeTodo({
        scheduleType: "one_time",
        reminderAt: future.toISOString(),
        completed: true,
      });
      expect(getNextOccurrence(todo)).toBeNull();
    });

    it("recurring weekly: returns next occurrence on correct day", () => {
      const base = new Date("2024-02-21T10:00:00");
      const dow = 3; // Wednesday
      const startStr = "2024-01-01";
      Date.now = () => base.getTime();
      const todo = makeTodo({
        scheduleType: "recurring",
        recurrenceType: "weekly",
        recurrenceDayOfWeek: dow,
        recurrenceTime: "14:00",
        recurrenceStartDate: startStr,
      });
      const next = getNextOccurrence(todo);
      expect(next).not.toBeNull();
      expect(next!.getDay()).toBe(dow);
    });

    it("shopping_list: returns null", () => {
      const todo = makeTodo({ scheduleType: "shopping_list" });
      expect(getNextOccurrence(todo)).toBeNull();
    });
  });

  describe("isTaskActiveToday", () => {
    it("one_time: true when reminder is today and not completed", () => {
      const today = new Date();
      const reminderAt = new Date(today);
      reminderAt.setHours(18, 0, 0, 0);
      const todo = makeTodo({
        scheduleType: "one_time",
        reminderAt: reminderAt.toISOString(),
        completed: false,
      });
      expect(isTaskActiveToday(todo)).toBe(true);
    });

    it("multi_times_daily: true when startDate is today or past and endDate is future or absent", () => {
      const today = new Date();
      const startStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const todo = makeTodo({
        scheduleType: "multi_times_daily",
        startDate: startStr,
        dailyTimes: ["09:00"],
      });
      expect(isTaskActiveToday(todo)).toBe(true);
    });

    it("shopping_list: false", () => {
      const todo = makeTodo({ scheduleType: "shopping_list" });
      expect(isTaskActiveToday(todo)).toBe(false);
    });
  });

  describe("getNotificationDates", () => {
    it("one_time: returns single future date", () => {
      const future = new Date(realNow() + 86400000);
      const todo = makeTodo({
        scheduleType: "one_time",
        reminderAt: future.toISOString(),
        completed: false,
      });
      const dates = getNotificationDates(todo, 10);
      expect(dates).toHaveLength(1);
      expect(dates[0].getTime()).toBe(future.getTime());
    });

    it("one_time: returns empty when completed", () => {
      const future = new Date(realNow() + 86400000);
      const todo = makeTodo({
        scheduleType: "one_time",
        reminderAt: future.toISOString(),
        completed: true,
      });
      expect(getNotificationDates(todo, 10)).toHaveLength(0);
    });

    it("shopping_list: returns empty", () => {
      const todo = makeTodo({ scheduleType: "shopping_list" });
      expect(getNotificationDates(todo, 10)).toHaveLength(0);
    });

    it("respects maxCount limit", () => {
      const today = new Date();
      const startStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const todo = makeTodo({
        scheduleType: "multi_times_daily",
        startDate: startStr,
        dailyTimes: ["09:00", "12:00"],
      });
      const dates = getNotificationDates(todo, 3);
      expect(dates.length).toBeLessThanOrEqual(3);
    });
  });
});
