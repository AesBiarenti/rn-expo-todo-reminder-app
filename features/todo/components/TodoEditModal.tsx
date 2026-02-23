import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  CategoryId,
  ChecklistItem,
  Priority,
  RecurrenceType,
  TaskScheduleType,
  TodoModel,
} from "../../../types/todo";
import { useTheme } from "../../../context/ThemeContext";
import {
  combineDateAndTime,
  formatDateShort,
  formatReminderDate,
  formatTime,
} from "../../../utils/dateUtils";
import { CustomDatePicker, CustomTimePicker } from "./DateTimePicker";
import { PriorityCategorySection, ScheduleTypeSelector } from "./schedule";
import {
  MONTH_KEYS,
  RECURRENCE_TYPES,
  WEEKDAYS,
} from "../constants";
import { PRIORITY_COLORS } from "../../../constants/theme";

const getDefaultDate = () => new Date(Date.now() + 3600000);
const getDefaultTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  return d;
};

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTimeStr(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

export interface TodoEditUpdates {
  text: string;
  scheduleType: TaskScheduleType;
  reminderAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  dailyTimes?: string[];
  checklistItems?: ChecklistItem[];
  recurrenceType?: RecurrenceType;
  recurrenceDayOfWeek?: number;
  recurrenceDayOfMonth?: number;
  recurrenceMonth?: number;
  recurrenceTime?: string;
  recurrenceStartDate?: string | null;
  recurrenceEndDate?: string | null;
  weekdays?: number[];
  weeklyTimes?: string[];
  weeklyStartDate?: string | null;
  weeklyEndDate?: string | null;
  priority?: Priority;
  categoryId?: CategoryId;
}

interface TodoEditModalProps {
  todo: TodoModel | null;
  visible: boolean;
  onSave: (updates: TodoEditUpdates) => void;
  onClose: () => void;
}

export function TodoEditModal({
  todo,
  visible,
  onSave,
  onClose,
}: TodoEditModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dailyTimes, setDailyTimes] = useState<string[]>([]);
  const [timeToAdd, setTimeToAdd] = useState<Date | null>(null);
  const [scheduleType, setScheduleType] =
    useState<TaskScheduleType>("one_time");
  const [priority, setPriority] = useState<Priority>("medium");
  const [categoryId, setCategoryId] = useState<CategoryId | undefined>();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistInput, setChecklistInput] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState(1);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(1);
  const [recurrenceMonth, setRecurrenceMonth] = useState(1);
  const [recurrenceTime, setRecurrenceTime] = useState("09:00");
  const [recurrenceStartDate, setRecurrenceStartDate] = useState<Date | null>(null);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [weeklyTimes, setWeeklyTimes] = useState<string[]>([]);
  const [weeklyTimeToAdd, setWeeklyTimeToAdd] = useState<Date | null>(null);
  const [weeklyStartDate, setWeeklyStartDate] = useState<Date | null>(null);
  const [weeklyEndDate, setWeeklyEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<
    "date" | "time" | "start" | "end" | "daily" | "recurStart" | "recurEnd" | "recurTime" | "weeklyStart" | "weeklyEnd" | "weeklyTime"
  >("date");

  useEffect(() => {
    if (todo && visible) {
      setText(todo.text);
      setScheduleType(todo.scheduleType);
      setPriority(todo.priority ?? "medium");
      setCategoryId(todo.categoryId);

      if (todo.scheduleType === "one_time" && todo.reminderAt) {
        const d = new Date(todo.reminderAt);
        setSelectedDate(d);
        setSelectedTime(d);
      } else {
        setSelectedDate(null);
        setSelectedTime(null);
      }

      if (todo.startDate) setStartDate(new Date(todo.startDate));
      else setStartDate(null);
      if (todo.endDate) setEndDate(new Date(todo.endDate));
      else setEndDate(null);
      setDailyTimes(todo.dailyTimes ?? []);
      setChecklistItems(todo.checklistItems ?? []);
      setRecurrenceType(todo.recurrenceType ?? "weekly");
      setRecurrenceDayOfWeek(todo.recurrenceDayOfWeek ?? 1);
      setRecurrenceDayOfMonth(todo.recurrenceDayOfMonth ?? 1);
      setRecurrenceMonth(todo.recurrenceMonth ?? 1);
      setRecurrenceTime(todo.recurrenceTime ?? "09:00");
      setRecurrenceStartDate(todo.recurrenceStartDate ? new Date(todo.recurrenceStartDate) : null);
      setRecurrenceEndDate(todo.recurrenceEndDate ? new Date(todo.recurrenceEndDate) : null);
      setWeekdays(todo.weekdays ?? []);
      setWeeklyTimes(todo.weeklyTimes ?? []);
      setWeeklyStartDate(todo.weeklyStartDate ? new Date(todo.weeklyStartDate) : null);
      setWeeklyEndDate(todo.weeklyEndDate ? new Date(todo.weeklyEndDate) : null);
    }
  }, [todo, visible]);

  const resetState = () => {
    if (todo) {
      setText(todo.text);
      setScheduleType(todo.scheduleType);
      setPriority(todo.priority ?? "medium");
      setCategoryId(todo.categoryId);
      if (todo.reminderAt) {
        const d = new Date(todo.reminderAt);
        setSelectedDate(d);
        setSelectedTime(d);
      } else {
        setSelectedDate(null);
        setSelectedTime(null);
      }
      setStartDate(todo.startDate ? new Date(todo.startDate) : null);
      setEndDate(todo.endDate ? new Date(todo.endDate) : null);
      setDailyTimes(todo.dailyTimes ?? []);
      setChecklistItems(todo.checklistItems ?? []);
      setRecurrenceType(todo.recurrenceType ?? "weekly");
      setRecurrenceDayOfWeek(todo.recurrenceDayOfWeek ?? 1);
      setRecurrenceDayOfMonth(todo.recurrenceDayOfMonth ?? 1);
      setRecurrenceMonth(todo.recurrenceMonth ?? 1);
      setRecurrenceTime(todo.recurrenceTime ?? "09:00");
      setRecurrenceStartDate(todo.recurrenceStartDate ? new Date(todo.recurrenceStartDate) : null);
      setRecurrenceEndDate(todo.recurrenceEndDate ? new Date(todo.recurrenceEndDate) : null);
      setWeekdays(todo.weekdays ?? []);
      setWeeklyTimes(todo.weeklyTimes ?? []);
      setWeeklyStartDate(todo.weeklyStartDate ? new Date(todo.weeklyStartDate) : null);
      setWeeklyEndDate(todo.weeklyEndDate ? new Date(todo.weeklyEndDate) : null);
    }
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const addChecklistItem = () => {
    const trimmed = checklistInput.trim();
    if (!trimmed) return;
    setChecklistItems((prev) => [
      ...prev,
      { id: `item_${Date.now()}`, text: trimmed, completed: false },
    ]);
    setChecklistInput("");
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleWeekday = (d: number) => {
    setWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  };

  const addWeeklyTime = () => {
    if (weeklyTimeToAdd) {
      const ts = toTimeStr(weeklyTimeToAdd);
      if (!weeklyTimes.includes(ts)) setWeeklyTimes([...weeklyTimes, ts].sort());
      setWeeklyTimeToAdd(null);
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const hasReminder = selectedDate !== null && selectedTime !== null;
  const reminderAt = hasReminder
    ? combineDateAndTime(selectedDate, selectedTime).toISOString()
    : null;

  const canSave =
    text.trim().length > 0 &&
    (scheduleType === "one_time"
      ? hasReminder
      : scheduleType === "ongoing"
        ? startDate !== null
        : scheduleType === "multi_times_daily"
          ? startDate !== null && dailyTimes.length > 0
          : scheduleType === "shopping_list"
            ? true
            : scheduleType === "recurring"
              ? recurrenceStartDate !== null
              : scheduleType === "weekly_days"
                ? weekdays.length > 0 && weeklyStartDate !== null
                : true);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const updates: TodoEditUpdates = {
      text: trimmed,
      scheduleType,
      priority,
      categoryId,
    };

    switch (scheduleType) {
      case "one_time":
        updates.reminderAt = hasReminder ? reminderAt : null;
        updates.startDate = null;
        updates.endDate = null;
        updates.dailyTimes = [];
        break;
      case "multi_times_daily":
        updates.reminderAt = null;
        updates.startDate = startDate ? toDateStr(startDate) : null;
        updates.endDate = endDate ? toDateStr(endDate) : null;
        updates.dailyTimes = dailyTimes;
        break;
      case "ongoing":
        updates.reminderAt = null;
        updates.startDate = startDate ? toDateStr(startDate) : null;
        updates.endDate = null;
        updates.dailyTimes = dailyTimes.length > 0 ? dailyTimes : undefined;
        break;
      case "shopping_list":
        updates.reminderAt = null;
        updates.startDate = null;
        updates.endDate = null;
        updates.dailyTimes = [];
        updates.checklistItems = checklistItems;
        break;
      case "recurring":
        updates.reminderAt = null;
        updates.startDate = null;
        updates.endDate = null;
        updates.dailyTimes = [];
        updates.recurrenceType = recurrenceType;
        updates.recurrenceDayOfWeek = recurrenceType === "weekly" ? recurrenceDayOfWeek : undefined;
        updates.recurrenceDayOfMonth = (recurrenceType === "monthly" || recurrenceType === "yearly") ? recurrenceDayOfMonth : undefined;
        updates.recurrenceMonth = recurrenceType === "yearly" ? recurrenceMonth : undefined;
        updates.recurrenceTime = recurrenceTime;
        updates.recurrenceStartDate = recurrenceStartDate ? toDateStr(recurrenceStartDate) : null;
        updates.recurrenceEndDate = recurrenceEndDate ? toDateStr(recurrenceEndDate) : null;
        break;
      case "weekly_days":
        updates.reminderAt = null;
        updates.startDate = null;
        updates.endDate = null;
        updates.dailyTimes = [];
        updates.weekdays = weekdays;
        updates.weeklyTimes = weeklyTimes.length > 0 ? weeklyTimes : undefined;
        updates.weeklyStartDate = weeklyStartDate ? toDateStr(weeklyStartDate) : null;
        updates.weeklyEndDate = weeklyEndDate ? toDateStr(weeklyEndDate) : null;
        break;
    }

    if (!canSave) return;
    onSave(updates);
    handleClose();
  };

  const openDatePicker = (
    target:
      | "date"
      | "start"
      | "end"
      | "recurStart"
      | "recurEnd"
      | "weeklyStart"
      | "weeklyEnd",
  ) => {
    const minDate =
      target === "end" && startDate
        ? startDate
        : target === "recurEnd" && recurrenceStartDate
          ? recurrenceStartDate
          : target === "weeklyEnd" && weeklyStartDate
            ? weeklyStartDate
            : new Date();
    const value =
      target === "date"
        ? selectedDate ?? getDefaultDate()
        : target === "start"
          ? startDate ?? new Date()
          : target === "end"
            ? endDate ?? startDate ?? new Date()
            : target === "recurStart"
              ? recurrenceStartDate ?? new Date()
              : target === "recurEnd"
                ? recurrenceEndDate ?? recurrenceStartDate ?? new Date()
                : target === "weeklyStart"
                  ? weeklyStartDate ?? new Date()
                  : weeklyEndDate ?? weeklyStartDate ?? new Date();
    setPickerTarget(target);
    setShowDatePicker(true);
  };

  const openTimePicker = (target: "time" | "daily" | "recurTime" | "weeklyTime") => {
    const value =
      target === "time"
        ? selectedTime ?? getDefaultTime()
        : target === "daily"
          ? timeToAdd ?? getDefaultTime()
          : target === "recurTime"
            ? (() => {
                const [h, m] = (recurrenceTime ?? "09:00").split(":").map(Number);
                const d = new Date();
                d.setHours(h, m, 0, 0);
                return d;
              })()
            : weeklyTimeToAdd ?? getDefaultTime();
    setPickerTarget(target);
    setShowTimePicker(true);
  };

  const handleDateSelect = (date: Date) => {
    if (pickerTarget === "date") setSelectedDate(date);
    else if (pickerTarget === "start") setStartDate(date);
    else if (pickerTarget === "end") setEndDate(date);
    else if (pickerTarget === "recurStart") setRecurrenceStartDate(date);
    else if (pickerTarget === "recurEnd") setRecurrenceEndDate(date);
    else if (pickerTarget === "weeklyStart") setWeeklyStartDate(date);
    else if (pickerTarget === "weeklyEnd") setWeeklyEndDate(date);
    setShowDatePicker(false);
  };

  const handleTimeSelect = (date: Date) => {
    if (pickerTarget === "time") setSelectedTime(date);
    else if (pickerTarget === "daily") {
      const ts = toTimeStr(date);
      if (!dailyTimes.includes(ts)) setDailyTimes([...dailyTimes, ts].sort());
      setTimeToAdd(null);
    } else if (pickerTarget === "recurTime") setRecurrenceTime(toTimeStr(date));
    else if (pickerTarget === "weeklyTime") {
      const ts = toTimeStr(date);
      if (!weeklyTimes.includes(ts)) setWeeklyTimes([...weeklyTimes, ts].sort());
      setWeeklyTimeToAdd(null);
    }
    setShowTimePicker(false);
  };

  const removeDailyTime = (t: string) => {
    setDailyTimes(dailyTimes.filter((x) => x !== t));
  };

  if (!todo) return null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 24,
        },
        modal: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 24,
          maxHeight: "90%",
        },
        title: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 20 },
        input: {
          backgroundColor: colors.surfaceHover,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          color: colors.text,
          marginBottom: 20,
        },
        section: { marginBottom: 20 },
        label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8 },
        priorityRow: { flexDirection: "row", gap: 8 },
        priorityBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: colors.surfaceHover,
        },
        priorityDot: { width: 8, height: 8, borderRadius: 4 },
        priorityLabel: { fontSize: 13, fontWeight: "500", color: colors.text },
        categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        categoryChip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 24,
          backgroundColor: colors.surfaceHover,
        },
        categoryChipActive: {
          backgroundColor: colors.accentDim,
          borderWidth: 1,
          borderColor: colors.accent,
        },
        categoryChipText: { fontSize: 14, color: colors.textMuted },
        categoryChipTextActive: { color: colors.accent, fontWeight: "600" },
        typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        typeChip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 24,
          backgroundColor: colors.surfaceHover,
        },
        typeChipActive: {
          backgroundColor: colors.accentDim,
          borderWidth: 1,
          borderColor: colors.accent,
        },
        typeChipText: { fontSize: 14, color: colors.textMuted },
        typeChipTextActive: { color: colors.accent, fontWeight: "600" },
        pickerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          padding: 14,
          backgroundColor: colors.surfaceHover,
          borderRadius: 16,
          marginBottom: 10,
        },
        pickerLabel: { fontSize: 15, fontWeight: "500", color: colors.text, width: 50 },
        pickerValue: { flex: 1, fontSize: 15, color: colors.textMuted },
        dailyTimesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
        timeChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 24,
          backgroundColor: colors.surfaceHover,
        },
        timeChipText: { fontSize: 14, color: colors.text, fontWeight: "500" },
        addTimeBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.accent,
          borderStyle: "dashed",
        },
        addTimeText: { fontSize: 14, color: colors.accent, fontWeight: "500" },
        reminderPreview: { fontSize: 13, color: colors.accent, marginTop: 4 },
        reminderHint: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
        checklistInputRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
        checklistInput: {
          flex: 1,
          backgroundColor: colors.surfaceHover,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          color: colors.text,
        },
        addChecklistBtn: {
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        checklistItemRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.surfaceHover,
          borderRadius: 14,
          marginBottom: 8,
        },
        checklistItemText: { fontSize: 15, color: colors.text, flex: 1 },
        removeItemBtn: { padding: 4 },
        recurrenceTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
        recurrenceChip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 24,
          backgroundColor: colors.surfaceHover,
        },
        recurrenceChipText: { fontSize: 14, color: colors.textMuted },
        weekdaysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
        weekdayChip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 24,
          backgroundColor: colors.surfaceHover,
        },
        weekdayChipActive: {
          backgroundColor: colors.accentDim,
          borderWidth: 1,
          borderColor: colors.accent,
        },
        weekdayChipText: { fontSize: 14, color: colors.textMuted },
        weekdayChipTextActive: { color: colors.accent, fontWeight: "600" },
        dayOfMonthRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
        dayOfMonthChip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 24,
          backgroundColor: colors.surfaceHover,
        },
        monthsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
        monthChip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 24,
          backgroundColor: colors.surfaceHover,
        },
        monthChipText: { fontSize: 13, color: colors.textMuted },
        actions: { flexDirection: "row", gap: 12, justifyContent: "flex-end", marginTop: 8 },
        cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16 },
        cancelBtnText: { fontSize: 16, color: colors.textMuted },
        saveBtn: {
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 16,
          backgroundColor: colors.accent,
        },
        saveBtnDisabled: { opacity: 0.5 },
        saveBtnText: { fontSize: 16, fontWeight: "600", color: colors.bg },
      }),
    [colors],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={styles.modal}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>{t("editModal.title")}</Text>

            <TextInput
              style={styles.input}
              placeholder={t("editModal.taskPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={setText}
              autoFocus
            />

            <View style={styles.section}>
              <PriorityCategorySection
                priority={priority}
                onPriorityChange={setPriority}
                categoryId={categoryId}
                onCategoryChange={setCategoryId}
              />
            </View>

            <View style={styles.section}>
              <ScheduleTypeSelector
                value={scheduleType}
                onChange={setScheduleType}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>
                {scheduleType === "one_time"
                  ? t("editModal.reminder")
                  : t("editModal.scheduling")}
              </Text>

              {scheduleType === "one_time" && (
                <>
                  <Pressable
                    onPress={() => openDatePicker("date")}
                    style={styles.pickerRow}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.accent}
                    />
                    <Text style={styles.pickerLabel}>{t("addModal.date")}</Text>
                    <Text style={styles.pickerValue}>
                      {selectedDate
                        ? formatDateShort(selectedDate)
                        : t("addModal.selectDate")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openTimePicker("time")}
                    style={styles.pickerRow}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={colors.accent}
                    />
                    <Text style={styles.pickerLabel}>{t("addModal.time")}</Text>
                    <Text style={styles.pickerValue}>
                      {selectedTime
                        ? formatTime(selectedTime)
                        : t("addModal.selectTime")}
                    </Text>
                  </Pressable>
                  {hasReminder && (
                    <Text style={styles.reminderPreview}>
                      {formatReminderDate(reminderAt!)}
                    </Text>
                  )}
                </>
              )}

              {(scheduleType === "multi_times_daily" ||
                scheduleType === "ongoing") && (
                <>
                  <Pressable
                    onPress={() => openDatePicker("start")}
                    style={styles.pickerRow}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.accent}
                    />
                    <Text style={styles.pickerLabel}>{t("addModal.start")}</Text>
                    <Text style={styles.pickerValue}>
                      {startDate
                        ? formatDateShort(startDate)
                        : t("addModal.selectDate")}
                    </Text>
                  </Pressable>

                  {scheduleType === "multi_times_daily" && (
                    <Pressable
                      onPress={() => openDatePicker("end")}
                      style={styles.pickerRow}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={colors.accent}
                      />
                      <Text style={styles.pickerLabel}>{t("addModal.end")}</Text>
                      <Text style={styles.pickerValue}>
                        {endDate
                          ? formatDateShort(endDate)
                          : t("addModal.selectDateOptional")}
                      </Text>
                    </Pressable>
                  )}

                  {(scheduleType === "multi_times_daily" ||
                    scheduleType === "ongoing") && (
                    <View style={styles.dailyTimesRow}>
                      {dailyTimes.map((t) => (
                        <Pressable
                          key={t}
                          style={styles.timeChip}
                          onPress={() => removeDailyTime(t)}
                        >
                          <Text style={styles.timeChipText}>{t}</Text>
                          <Ionicons
                            name="close"
                            size={14}
                            color={colors.textMuted}
                          />
                        </Pressable>
                      ))}
                      <Pressable
                        style={styles.addTimeBtn}
                        onPress={() => openTimePicker("daily")}
                      >
                        <Ionicons name="add" size={18} color={colors.accent} />
                        <Text style={styles.addTimeText}>{t("addModal.addTime")}</Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}

              {scheduleType === "shopping_list" && (
                <>
                  <Text style={styles.reminderHint}>{t("editModal.listItems")}</Text>
                  <View style={styles.checklistInputRow}>
                    <TextInput
                      style={styles.checklistInput}
                      placeholder={t("editModal.addItem")}
                      placeholderTextColor={colors.textMuted}
                      value={checklistInput}
                      onChangeText={setChecklistInput}
                      onSubmitEditing={addChecklistItem}
                      returnKeyType="done"
                    />
                    <Pressable
                      style={styles.addChecklistBtn}
                      onPress={addChecklistItem}
                    >
                      <Ionicons name="add" size={24} color={colors.bg} />
                    </Pressable>
                  </View>
                  {checklistItems.map((item) => (
                    <View key={item.id} style={styles.checklistItemRow}>
                      <Text style={styles.checklistItemText}>{item.text}</Text>
                      <Pressable
                        onPress={() => removeChecklistItem(item.id)}
                        style={styles.removeItemBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </Pressable>
                    </View>
                  ))}
                </>
              )}

              {scheduleType === "recurring" && (
                <>
                  <Text style={styles.reminderHint}>{t("editModal.recurrence")}</Text>
                  <View style={styles.recurrenceTypeRow}>
                    {RECURRENCE_TYPES.map((r) => (
                      <Pressable
                        key={r.value}
                        onPress={() => setRecurrenceType(r.value)}
                        style={[
                          styles.recurrenceChip,
                          recurrenceType === r.value && styles.categoryChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.recurrenceChipText,
                            recurrenceType === r.value && styles.categoryChipTextActive,
                          ]}
                        >
                          {t(r.labelKey)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {recurrenceType === "weekly" && (
                    <>
                      <Text style={styles.reminderHint}>{t("addModal.dayOfWeek")}</Text>
                      <View style={styles.weekdaysRow}>
                        {WEEKDAYS.map((w) => (
                          <Pressable
                            key={w.value}
                            onPress={() => setRecurrenceDayOfWeek(w.value)}
                            style={[
                              styles.weekdayChip,
                              recurrenceDayOfWeek === w.value && styles.weekdayChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.weekdayChipText,
                                recurrenceDayOfWeek === w.value && styles.weekdayChipTextActive,
                              ]}
                            >
                              {t(w.labelKey)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
                  {recurrenceType === "monthly" && (
                    <>
                      <Text style={styles.reminderHint}>{t("addModal.dayOfMonth")}</Text>
                      <View style={styles.dayOfMonthRow}>
                        {[1, 5, 10, 15, 20, 25, 31].map((d) => (
                          <Pressable
                            key={d}
                            onPress={() => setRecurrenceDayOfMonth(d)}
                            style={[
                              styles.dayOfMonthChip,
                              recurrenceDayOfMonth === d && styles.weekdayChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.weekdayChipText,
                                recurrenceDayOfMonth === d && styles.weekdayChipTextActive,
                              ]}
                            >
                              {d}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
                  {recurrenceType === "yearly" && (
                    <>
                          <Text style={styles.reminderHint}>{t("addModal.month")}</Text>
                      <View style={styles.monthsRow}>
                            {MONTH_KEYS.map((key, i) => (
                          <Pressable
                            key={i}
                            onPress={() => setRecurrenceMonth(i + 1)}
                            style={[
                              styles.monthChip,
                              recurrenceMonth === i + 1 && styles.weekdayChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.monthChipText,
                                recurrenceMonth === i + 1 && styles.weekdayChipTextActive,
                              ]}
                            >
                              {t(key)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <Text style={styles.reminderHint}>{t("addModal.dayOfMonth")}</Text>
                      <View style={styles.dayOfMonthRow}>
                        {[1, 5, 10, 15, 20, 25, 31].map((d) => (
                          <Pressable
                            key={d}
                            onPress={() => setRecurrenceDayOfMonth(d)}
                            style={[
                              styles.dayOfMonthChip,
                              recurrenceDayOfMonth === d && styles.weekdayChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.weekdayChipText,
                                recurrenceDayOfMonth === d && styles.weekdayChipTextActive,
                              ]}
                            >
                              {d}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
                  <Text style={styles.reminderHint}>{t("addModal.time")}</Text>
                  <Pressable
                    onPress={() => openTimePicker("recurTime")}
                    style={styles.pickerRow}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.accent} />
                    <Text style={styles.pickerLabel}>{t("addModal.time")}</Text>
                    <Text style={styles.pickerValue}>{recurrenceTime}</Text>
                  </Pressable>
                  <Text style={styles.reminderHint}>{t("addModal.startDate")}</Text>
                  <Pressable
                    onPress={() => openDatePicker("recurStart")}
                    style={styles.pickerRow}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                    <Text style={styles.pickerLabel}>{t("addModal.start")}</Text>
                    <Text style={styles.pickerValue}>
                      {recurrenceStartDate
                        ? formatDateShort(recurrenceStartDate)
                        : t("addModal.selectDate")}
                    </Text>
                  </Pressable>
                  <Text style={styles.reminderHint}>{t("addModal.endDate")}</Text>
                  <Pressable
                    onPress={() => openDatePicker("recurEnd")}
                    style={styles.pickerRow}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                    <Text style={styles.pickerLabel}>{t("addModal.end")}</Text>
                    <Text style={styles.pickerValue}>
                      {recurrenceEndDate
                        ? formatDateShort(recurrenceEndDate)
                        : t("addModal.selectDateOptional")}
                    </Text>
                  </Pressable>
                </>
              )}

              {scheduleType === "weekly_days" && (
                <>
                  <Text style={styles.reminderHint}>{t("addModal.weekdays")}</Text>
                  <View style={styles.weekdaysRow}>
                    {WEEKDAYS.map((w) => (
                      <Pressable
                        key={w.value}
                        onPress={() => toggleWeekday(w.value)}
                        style={[
                          styles.weekdayChip,
                          weekdays.includes(w.value) && styles.weekdayChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.weekdayChipText,
                            weekdays.includes(w.value) && styles.weekdayChipTextActive,
                          ]}
                        >
                                {t(w.labelKey)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.reminderHint}>{t("addModal.timesOptional")}</Text>
                  <View style={styles.dailyTimesRow}>
                    {weeklyTimes.map((t) => (
                      <Pressable
                        key={t}
                        style={styles.timeChip}
                        onPress={() =>
                          setWeeklyTimes(weeklyTimes.filter((x) => x !== t))
                        }
                      >
                        <Text style={styles.timeChipText}>{t}</Text>
                        <Ionicons name="close" size={14} color={colors.textMuted} />
                      </Pressable>
                    ))}
                    <Pressable
                      style={styles.addTimeBtn}
                      onPress={() => openTimePicker("weeklyTime")}
                    >
                      <Ionicons name="add" size={18} color={colors.accent} />
                        <Text style={styles.addTimeText}>{t("addModal.addTime")}</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.reminderHint}>{t("addModal.startDate")}</Text>
                  <Pressable
                    onPress={() => openDatePicker("weeklyStart")}
                    style={styles.pickerRow}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                    <Text style={styles.pickerLabel}>{t("addModal.start")}</Text>
                    <Text style={styles.pickerValue}>
                      {weeklyStartDate
                        ? formatDateShort(weeklyStartDate)
                        : t("addModal.selectDate")}
                    </Text>
                  </Pressable>
                  <Text style={styles.reminderHint}>{t("addModal.endDate")}</Text>
                  <Pressable
                    onPress={() => openDatePicker("weeklyEnd")}
                    style={styles.pickerRow}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                    <Text style={styles.pickerLabel}>{t("addModal.end")}</Text>
                    <Text style={styles.pickerValue}>
                      {weeklyEndDate
                        ? formatDateShort(weeklyEndDate)
                        : t("addModal.selectDateOptional")}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            {showDatePicker && (
              <CustomDatePicker
                visible={showDatePicker}
                value={
                  pickerTarget === "date"
                    ? selectedDate ?? getDefaultDate()
                    : pickerTarget === "start"
                      ? startDate ?? new Date()
                      : pickerTarget === "end"
                        ? endDate ?? startDate ?? new Date()
                        : pickerTarget === "recurStart"
                          ? recurrenceStartDate ?? new Date()
                          : pickerTarget === "recurEnd"
                            ? recurrenceEndDate ?? recurrenceStartDate ?? new Date()
                            : pickerTarget === "weeklyStart"
                              ? weeklyStartDate ?? new Date()
                              : weeklyEndDate ?? weeklyStartDate ?? new Date()
                }
                minimumDate={
                  pickerTarget === "end" && startDate
                    ? startDate
                    : pickerTarget === "recurEnd" && recurrenceStartDate
                      ? recurrenceStartDate
                      : pickerTarget === "weeklyEnd" && weeklyStartDate
                        ? weeklyStartDate
                        : new Date()
                }
                onSelect={handleDateSelect}
                onClose={() => setShowDatePicker(false)}
              />
            )}
            {showTimePicker && (
              <CustomTimePicker
                visible={showTimePicker}
                value={
                  pickerTarget === "time"
                    ? selectedTime ?? getDefaultTime()
                    : pickerTarget === "daily"
                      ? timeToAdd ?? getDefaultTime()
                      : pickerTarget === "recurTime"
                        ? (() => {
                            const [h, m] = (recurrenceTime ?? "09:00").split(":").map(Number);
                            const d = new Date();
                            d.setHours(h, m, 0, 0);
                            return d;
                          })()
                        : weeklyTimeToAdd ?? getDefaultTime()
                }
                onSelect={handleTimeSelect}
                onClose={() => setShowTimePicker(false)}
              />
            )}

            <View style={styles.actions}>
              <Pressable onPress={handleClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>{t("editModal.cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                disabled={!canSave}
              >
                <Text style={styles.saveBtnText}>{t("editModal.save")}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
