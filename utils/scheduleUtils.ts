/** Re-exports schedule utilities for backward compatibility. */

export {
  getTodaysSlots,
  isSlotCompleted,
  isTaskActiveOnDate,
  isTaskActiveToday,
} from "./schedule/scheduleActivity";
export { getNextOccurrence } from "./schedule/scheduleOccurrence";
export {
  getDateStringsWithTasks,
  getDateTaskCounts,
  getNotificationDates,
  getRecurringNotificationDates,
  getWeeklyDaysNotificationDates,
} from "./schedule/scheduleNotifications";
export { formatScheduleSummary } from "./schedule/scheduleSummary";
