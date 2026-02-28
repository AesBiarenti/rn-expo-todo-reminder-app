import { useEffect, useState } from "react";
import type {
  ChecklistItem,
  RecurrenceType,
  TaskScheduleType,
  TodoModel,
} from "../../../types/todo";
import { toTimeStr } from "../../../utils/dateUtils";

export type PickerTarget =
  | "date"
  | "time"
  | "start"
  | "end"
  | "daily"
  | "recurStart"
  | "recurEnd"
  | "recurTime"
  | "weeklyStart"
  | "weeklyEnd"
  | "weeklyTime";

export interface ScheduleFormState {
  scheduleType: TaskScheduleType;
  selectedDate: Date | null;
  selectedTime: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  dailyTimes: string[];
  timeToAdd: Date | null;
  checklistItems: ChecklistItem[];
  checklistInput: string;
  recurrenceType: RecurrenceType;
  recurrenceDayOfWeek: number;
  recurrenceDayOfMonth: number;
  recurrenceMonth: number;
  recurrenceTime: string;
  recurrenceStartDate: Date | null;
  recurrenceEndDate: Date | null;
  weekdays: number[];
  weeklyTimes: string[];
  weeklyTimeToAdd: Date | null;
  weeklyStartDate: Date | null;
  weeklyEndDate: Date | null;
  showDatePicker: boolean;
  showTimePicker: boolean;
  pickerTarget: PickerTarget;
}

const getDefaultScheduleState = (): ScheduleFormState => ({
  scheduleType: "one_time",
  selectedDate: null,
  selectedTime: null,
  startDate: null,
  endDate: null,
  dailyTimes: [],
  timeToAdd: null,
  checklistItems: [],
  checklistInput: "",
  recurrenceType: "weekly",
  recurrenceDayOfWeek: 1,
  recurrenceDayOfMonth: 1,
  recurrenceMonth: 1,
  recurrenceTime: "09:00",
  recurrenceStartDate: null,
  recurrenceEndDate: null,
  weekdays: [],
  weeklyTimes: [],
  weeklyTimeToAdd: null,
  weeklyStartDate: null,
  weeklyEndDate: null,
  showDatePicker: false,
  showTimePicker: false,
  pickerTarget: "date",
});

function populateFromTodo(state: ScheduleFormState, todo: TodoModel): ScheduleFormState {
  const next: ScheduleFormState = { ...getDefaultScheduleState(), scheduleType: todo.scheduleType };

  if (todo.scheduleType === "one_time" && todo.reminderAt) {
    const d = new Date(todo.reminderAt);
    next.selectedDate = d;
    next.selectedTime = d;
  }
  next.startDate = todo.startDate ? new Date(todo.startDate) : null;
  next.endDate = todo.endDate ? new Date(todo.endDate) : null;
  next.dailyTimes = todo.dailyTimes ?? [];
  next.checklistItems = todo.checklistItems ?? [];
  next.recurrenceType = (todo.recurrenceType ?? "weekly") as RecurrenceType;
  next.recurrenceDayOfWeek = todo.recurrenceDayOfWeek ?? 1;
  next.recurrenceDayOfMonth = todo.recurrenceDayOfMonth ?? 1;
  next.recurrenceMonth = todo.recurrenceMonth ?? 1;
  next.recurrenceTime = todo.recurrenceTime ?? "09:00";
  next.recurrenceStartDate = todo.recurrenceStartDate ? new Date(todo.recurrenceStartDate) : null;
  next.recurrenceEndDate = todo.recurrenceEndDate ? new Date(todo.recurrenceEndDate) : null;
  next.weekdays = todo.weekdays ?? [];
  next.weeklyTimes = todo.weeklyTimes ?? [];
  next.weeklyStartDate = todo.weeklyStartDate ? new Date(todo.weeklyStartDate) : null;
  next.weeklyEndDate = todo.weeklyEndDate ? new Date(todo.weeklyEndDate) : null;

  return next;
}

export function useScheduleFormState(initialTodo: TodoModel | null, visible: boolean) {
  const [state, setState] = useState<ScheduleFormState>(getDefaultScheduleState);

  useEffect(() => {
    if (visible) {
      if (initialTodo) {
        setState((prev) => populateFromTodo(prev, initialTodo));
      } else {
        setState(getDefaultScheduleState());
      }
    }
  }, [initialTodo?.id ?? null, visible]);

  const update = <K extends keyof ScheduleFormState>(key: K, value: ScheduleFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const openDatePicker = (target: PickerTarget) => {
    setState((prev) => ({ ...prev, pickerTarget: target, showDatePicker: true }));
  };

  const openTimePicker = (target: PickerTarget) => {
    setState((prev) => ({ ...prev, pickerTarget: target, showTimePicker: true }));
  };

  const closeDatePicker = () => setState((prev) => ({ ...prev, showDatePicker: false }));
  const closeTimePicker = () => setState((prev) => ({ ...prev, showTimePicker: false }));

  const handleDateChange = (date: Date) => {
    const target = state.pickerTarget;
    if (target === "date") update("selectedDate", date);
    else if (target === "start") update("startDate", date);
    else if (target === "end") update("endDate", date);
    else if (target === "recurStart") update("recurrenceStartDate", date);
    else if (target === "recurEnd") update("recurrenceEndDate", date);
    else if (target === "weeklyStart") update("weeklyStartDate", date);
    else if (target === "weeklyEnd") update("weeklyEndDate", date);
    closeDatePicker();
  };

  const handleTimeChange = (date: Date) => {
    const target = state.pickerTarget;
    if (target === "time") {
      update("selectedTime", date);
    } else if (target === "daily") {
      const ts = toTimeStr(date);
      setState((prev) => {
        if (prev.dailyTimes.includes(ts)) return prev;
        return {
          ...prev,
          dailyTimes: [...prev.dailyTimes, ts].sort(),
          timeToAdd: null,
        };
      });
    } else if (target === "recurTime") {
      update("recurrenceTime", toTimeStr(date));
    } else if (target === "weeklyTime") {
      const ts = toTimeStr(date);
      setState((prev) => {
        if (prev.weeklyTimes.includes(ts)) return prev;
        return {
          ...prev,
          weeklyTimes: [...prev.weeklyTimes, ts].sort(),
          weeklyTimeToAdd: null,
        };
      });
    }
    closeTimePicker();
  };

  const removeDailyTime = (t: string) => {
    setState((prev) => ({ ...prev, dailyTimes: prev.dailyTimes.filter((x) => x !== t) }));
  };

  const removeWeeklyTime = (t: string) => {
    setState((prev) => ({ ...prev, weeklyTimes: prev.weeklyTimes.filter((x) => x !== t) }));
  };

  const addChecklistItem = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      checklistItems: [
        ...prev.checklistItems,
        { id: `item_${Date.now()}`, text: trimmed, completed: false },
      ],
      checklistInput: "",
    }));
  };

  const removeChecklistItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((i) => i.id !== id),
    }));
  };

  const toggleWeekday = (d: number) => {
    setState((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(d)
        ? prev.weekdays.filter((x) => x !== d)
        : [...prev.weekdays, d].sort(),
    }));
  };

  return {
    ...state,
    update,
    openDatePicker,
    openTimePicker,
    handleDateChange,
    handleTimeChange,
    removeDailyTime,
    removeWeeklyTime,
    addChecklistItem,
    removeChecklistItem,
    toggleWeekday,
    closeDatePicker,
    closeTimePicker,
    resetSchedule: () => setState(getDefaultScheduleState()),
  };
}
