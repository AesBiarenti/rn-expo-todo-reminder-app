import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type {
  CategoryId,
  ChecklistItem,
  Priority,
  RecurrenceType,
  TaskScheduleType,
  TodoModel,
} from "../../../types/todo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";
import {
  combineDateAndTime,
  formatDateShort,
  formatReminderDate,
  formatTime,
  getDefaultDate,
  getDefaultTime,
  toDateStr,
  toTimeStr,
} from "../../../utils/dateUtils";
import { AnimatedCancelButton } from "../../../components/ui/AnimatedCancelButton";
import { AnimatedSaveButton } from "../../../components/ui/AnimatedSaveButton";
import { BottomSheetModal } from "../../../components/ui/BottomSheetModal";
import { ChipRow } from "../../../components/ui/ChipRow";
import { PickerRow } from "../../../components/ui/PickerRow";
import { RemovableChipList } from "../../../components/ui/RemovableChipList";
import { createTodoModalStyles } from "../styles/todoModalStyles";
import { CustomDatePicker, CustomTimePicker } from "./DateTimePicker";
import { PriorityCategorySection, ScheduleTypeSelector } from "./schedule";
import {
  MONTH_KEYS,
  RECURRENCE_TYPES,
  WEEKDAYS,
} from "../constants";
import { PRIORITY_COLORS } from "../../../constants/theme";

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
  const insets = useSafeAreaInsets();
  const horizontalPadding = Math.max(24, insets.left, insets.right);
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

  const styles = useMemo(() => createTodoModalStyles(colors), [colors]);

  if (!todo) return null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      keyboardAvoiding
      maxHeight={Math.min(Dimensions.get("window").height * 0.88, 700)}
      paddingHorizontal={horizontalPadding}
    >
      <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
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
                  <PickerRow
                    icon="calendar-outline"
                    label="addModal.date"
                    value={
                      selectedDate
                        ? formatDateShort(selectedDate)
                        : t("addModal.selectDate")
                    }
                    onPress={() => openDatePicker("date")}
                  />
                  <PickerRow
                    icon="time-outline"
                    label="addModal.time"
                    value={
                      selectedTime
                        ? formatTime(selectedTime)
                        : t("addModal.selectTime")
                    }
                    onPress={() => openTimePicker("time")}
                  />
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
                  <PickerRow
                    icon="calendar-outline"
                    label="addModal.start"
                    value={
                      startDate
                        ? formatDateShort(startDate)
                        : t("addModal.selectDate")
                    }
                    onPress={() => openDatePicker("start")}
                  />

                  {scheduleType === "multi_times_daily" && (
                    <PickerRow
                      icon="calendar-outline"
                      label="addModal.end"
                      value={
                        endDate
                          ? formatDateShort(endDate)
                          : t("addModal.selectDateOptional")
                      }
                      onPress={() => openDatePicker("end")}
                    />
                  )}

                  {(scheduleType === "multi_times_daily" ||
                    scheduleType === "ongoing") && (
                    <RemovableChipList
                      values={dailyTimes}
                      onRemove={removeDailyTime}
                      onAdd={() => openTimePicker("daily")}
                    />
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
                  <ChipRow
                    items={RECURRENCE_TYPES}
                    selected={recurrenceType}
                    onSelect={setRecurrenceType}
                  />
                  {recurrenceType === "weekly" && (
                    <>
                      <Text style={styles.reminderHint}>{t("addModal.dayOfWeek")}</Text>
                      <ChipRow
                        items={WEEKDAYS}
                        selected={recurrenceDayOfWeek}
                        onSelect={setRecurrenceDayOfWeek}
                      />
                    </>
                  )}
                  {recurrenceType === "monthly" && (
                    <>
                      <Text style={styles.reminderHint}>{t("addModal.dayOfMonth")}</Text>
                      <ChipRow
                        items={[1, 5, 10, 15, 20, 25, 31].map((d) => ({
                          value: d,
                          labelKey: String(d),
                          label: String(d),
                        }))}
                        selected={recurrenceDayOfMonth}
                        onSelect={setRecurrenceDayOfMonth}
                      />
                    </>
                  )}
                  {recurrenceType === "yearly" && (
                    <>
                      <Text style={styles.reminderHint}>{t("addModal.month")}</Text>
                      <ChipRow
                        items={MONTH_KEYS.map((key, i) => ({
                          value: i + 1,
                          labelKey: key,
                        }))}
                        selected={recurrenceMonth}
                        onSelect={setRecurrenceMonth}
                      />
                      <Text style={styles.reminderHint}>{t("addModal.dayOfMonth")}</Text>
                      <ChipRow
                        items={[1, 5, 10, 15, 20, 25, 31].map((d) => ({
                          value: d,
                          labelKey: String(d),
                          label: String(d),
                        }))}
                        selected={recurrenceDayOfMonth}
                        onSelect={setRecurrenceDayOfMonth}
                      />
                    </>
                  )}
                  <Text style={styles.reminderHint}>{t("addModal.time")}</Text>
                  <PickerRow
                    icon="time-outline"
                    label="addModal.time"
                    value={recurrenceTime ?? "09:00"}
                    onPress={() => openTimePicker("recurTime")}
                  />
                  <Text style={styles.reminderHint}>{t("addModal.startDate")}</Text>
                  <PickerRow
                    icon="calendar-outline"
                    label="addModal.start"
                    value={
                      recurrenceStartDate
                        ? formatDateShort(recurrenceStartDate)
                        : t("addModal.selectDate")
                    }
                    onPress={() => openDatePicker("recurStart")}
                  />
                  <Text style={styles.reminderHint}>{t("addModal.endDate")}</Text>
                  <PickerRow
                    icon="calendar-outline"
                    label="addModal.end"
                    value={
                      recurrenceEndDate
                        ? formatDateShort(recurrenceEndDate)
                        : t("addModal.selectDateOptional")
                    }
                    onPress={() => openDatePicker("recurEnd")}
                  />
                </>
              )}

              {scheduleType === "weekly_days" && (
                <>
                  <Text style={styles.reminderHint}>{t("addModal.weekdays")}</Text>
                  <ChipRow
                    items={WEEKDAYS}
                    selected={weekdays}
                    onSelect={toggleWeekday}
                    multiSelect
                  />
                  <Text style={styles.reminderHint}>{t("addModal.timesOptional")}</Text>
                  <RemovableChipList
                    values={weeklyTimes}
                    onRemove={(t) =>
                      setWeeklyTimes(weeklyTimes.filter((x) => x !== t))
                    }
                    onAdd={() => openTimePicker("weeklyTime")}
                  />
                  <Text style={styles.reminderHint}>{t("addModal.startDate")}</Text>
                  <PickerRow
                    icon="calendar-outline"
                    label="addModal.start"
                    value={
                      weeklyStartDate
                        ? formatDateShort(weeklyStartDate)
                        : t("addModal.selectDate")
                    }
                    onPress={() => openDatePicker("weeklyStart")}
                  />
                  <Text style={styles.reminderHint}>{t("addModal.endDate")}</Text>
                  <PickerRow
                    icon="calendar-outline"
                    label="addModal.end"
                    value={
                      weeklyEndDate
                        ? formatDateShort(weeklyEndDate)
                        : t("addModal.selectDateOptional")
                    }
                    onPress={() => openDatePicker("weeklyEnd")}
                  />
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
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <AnimatedCancelButton onPress={handleClose} label="editModal.cancel" />
        <AnimatedSaveButton
          onPress={handleSave}
          disabled={!canSave}
          label="editModal.save"
        />
      </View>
    </BottomSheetModal>
  );
}
