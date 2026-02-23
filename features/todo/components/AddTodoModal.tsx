import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  CategoryId,
  ChecklistItem,
  Priority,
  RecurrenceType,
  TaskScheduleType,
} from "../../../types/todo";
import type { AddTodoParams } from "../../../store/todoStore";
import { useTheme } from "../../../context/ThemeContext";
import {
  combineDateAndTime,
  formatDateShort,
  formatTime,
} from "../../../utils/dateUtils";
import { PRIORITY_COLORS } from "../../../constants/theme";
import { CustomDatePicker, CustomTimePicker } from "./DateTimePicker";
import { PriorityCategorySection, ScheduleTypeSelector } from "./schedule";
import {
  MONTH_KEYS,
  RECURRENCE_TYPES,
  SCHEDULE_TYPES,
  WEEKDAYS,
} from "../constants";

interface AddTodoModalProps {
  visible: boolean;
  onAdd: (params: AddTodoParams) => void;
  onClose: () => void;
}

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

export function AddTodoModal({ visible, onAdd, onClose }: AddTodoModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [categoryId, setCategoryId] = useState<CategoryId | undefined>();
  const [scheduleType, setScheduleType] =
    useState<TaskScheduleType>("one_time");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dailyTimes, setDailyTimes] = useState<string[]>([]);
  const [timeToAdd, setTimeToAdd] = useState<Date | null>(null);
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

  const resetState = () => {
    setStep(1);
    setText("");
    setPriority("medium");
    setCategoryId(undefined);
    setScheduleType("one_time");
    setSelectedDate(null);
    setSelectedTime(null);
    setStartDate(null);
    setEndDate(null);
    setDailyTimes([]);
    setTimeToAdd(null);
    setChecklistItems([]);
    setChecklistInput("");
    setRecurrenceType("weekly");
    setRecurrenceDayOfWeek(1);
    setRecurrenceDayOfMonth(1);
    setRecurrenceMonth(1);
    setRecurrenceTime("09:00");
    setRecurrenceStartDate(null);
    setRecurrenceEndDate(null);
    setWeekdays([]);
    setWeeklyTimes([]);
    setWeeklyTimeToAdd(null);
    setWeeklyStartDate(null);
    setWeeklyEndDate(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  useEffect(() => {
    if (!visible) resetState();
  }, [visible]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNext = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const canProceedStep2 = text.trim().length > 0;
  const canProceedStep3 =
    scheduleType === "one_time"
      ? selectedDate !== null && selectedTime !== null
      : scheduleType === "multi_times_daily"
        ? startDate !== null && dailyTimes.length > 0
        : scheduleType === "ongoing"
          ? startDate !== null
          : scheduleType === "shopping_list"
            ? true
            : scheduleType === "recurring"
              ? recurrenceStartDate !== null &&
                (recurrenceType === "weekly" ||
                  (recurrenceType === "monthly" && recurrenceDayOfMonth >= 1) ||
                  (recurrenceType === "yearly" && recurrenceMonth >= 1 && recurrenceDayOfMonth >= 1))
              : scheduleType === "weekly_days"
                ? weekdays.length > 0 && weeklyStartDate !== null
                : false;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const params: AddTodoParams = {
      text: trimmed,
      scheduleType,
      priority,
      categoryId,
    };

    switch (scheduleType) {
      case "one_time":
        if (selectedDate && selectedTime) {
          params.reminderAt = combineDateAndTime(
            selectedDate,
            selectedTime,
          ).toISOString();
        }
        break;
      case "multi_times_daily":
        if (startDate) params.startDate = toDateStr(startDate);
        if (endDate) params.endDate = toDateStr(endDate);
        if (dailyTimes.length > 0) params.dailyTimes = dailyTimes;
        break;
      case "ongoing":
        if (startDate) params.startDate = toDateStr(startDate);
        if (dailyTimes.length > 0) params.dailyTimes = dailyTimes;
        break;
      case "shopping_list":
        params.checklistItems = checklistItems.map((i) => ({
          ...i,
          id: i.id || Date.now().toString() + Math.random(),
        }));
        break;
      case "recurring":
        params.recurrenceType = recurrenceType;
        params.recurrenceDayOfWeek = recurrenceDayOfWeek;
        params.recurrenceDayOfMonth = recurrenceDayOfMonth;
        params.recurrenceMonth = recurrenceMonth;
        params.recurrenceTime = recurrenceTime;
        if (recurrenceStartDate) params.recurrenceStartDate = toDateStr(recurrenceStartDate);
        if (recurrenceEndDate) params.recurrenceEndDate = toDateStr(recurrenceEndDate);
        break;
      case "weekly_days":
        params.weekdays = weekdays;
        if (weeklyTimes.length > 0) params.weeklyTimes = weeklyTimes;
        if (weeklyStartDate) params.weeklyStartDate = toDateStr(weeklyStartDate);
        if (weeklyEndDate) params.weeklyEndDate = toDateStr(weeklyEndDate);
        break;
    }

    if (
      (scheduleType === "one_time" && !params.reminderAt) ||
      (scheduleType === "multi_times_daily" &&
        (!params.startDate || !params.dailyTimes?.length)) ||
      (scheduleType === "ongoing" && !params.startDate) ||
      (scheduleType === "recurring" && !params.recurrenceStartDate) ||
      (scheduleType === "weekly_days" && (!params.weekdays?.length || !params.weeklyStartDate))
    ) {
      return;
    }

    onAdd(params);
    handleClose();
  };

  const addChecklistItem = () => {
    const t = checklistInput.trim();
    if (!t) return;
    setChecklistItems((prev) => [
      ...prev,
      { id: Date.now().toString(), text: t, completed: false },
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
        keyboardView: { width: "100%" },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 24,
          paddingTop: 12,
          paddingBottom: 0,
        },
        scrollContent: { flex: 1 },
        scrollContentContainer: { paddingBottom: 16, flexGrow: 1 },
        actionsBar: {
          flexDirection: "row",
          gap: 12,
          justifyContent: "flex-end",
          paddingTop: 16,
          paddingHorizontal: 0,
          marginTop: 8,
        },
        handle: {
          width: 40,
          height: 4,
          backgroundColor: colors.border,
          borderRadius: 2,
          alignSelf: "center",
          marginBottom: 20,
        },
        stepIndicator: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 8 },
        stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
        stepDotActive: { backgroundColor: colors.accent, width: 24 },
        stepDotDone: { backgroundColor: colors.accent },
        stepLabel: { fontSize: 14, fontWeight: "600", color: colors.textMuted, marginBottom: 20, textAlign: "center" },
        stepContent: { gap: 16 },
        typeHint: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
        typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
        typeCard: {
          flex: 1,
          minWidth: "45%",
          alignItems: "center",
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.surfaceHover,
        },
        typeCardActive: {
          borderWidth: 1,
          borderColor: colors.accent,
          backgroundColor: colors.accentDim,
        },
        typeCardText: { fontSize: 14, fontWeight: "500", color: colors.textMuted, marginTop: 8 },
        typeCardTextActive: { color: colors.accent },
        prioritySection: { marginBottom: 4 },
        priorityLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8 },
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
        priorityBtnText: { fontSize: 13, fontWeight: "500", color: colors.text },
        categorySection: { marginBottom: 4 },
        categoryLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8 },
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
        input: {
          backgroundColor: colors.surfaceHover,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          color: colors.text,
        },
        reminderHint: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
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
        requiredHint: { fontSize: 12, color: colors.danger, marginTop: -4 },
        checklistInputRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
        checklistInput: { flex: 1, marginBottom: 0 },
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
        primaryBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 16,
          backgroundColor: colors.accent,
        },
        primaryBtnDisabled: { opacity: 0.5 },
        primaryBtnText: { fontSize: 16, fontWeight: "600", color: colors.bg },
        secondaryBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: 16,
          backgroundColor: colors.surfaceHover,
        },
        secondaryBtnText: { fontSize: 16, fontWeight: "500", color: colors.text },
        pressed: { opacity: 0.8 },
      }),
    [colors],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <Pressable
            style={[
              styles.sheet,
              { height: Math.min(Dimensions.get("window").height * 0.88, 700) },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    s === step && styles.stepDotActive,
                    s < step && styles.stepDotDone,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.stepLabel}>
              {step === 1 && t("addModal.step1")}
              {step === 2 && t("addModal.step2")}
              {step === 3 && (() => {
                const st = SCHEDULE_TYPES.find((s) => s.value === scheduleType);
                return t("addModal.step3", { label: st ? t(st.labelKey) : t("addModal.scheduling") });
              })()}
            </Text>

            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {step === 1 && (
                <View style={styles.stepContent}>
                  <TextInput
                    style={styles.input}
                    placeholder={t("addModal.placeholder")}
                    placeholderTextColor={colors.textMuted}
                    value={text}
                    onChangeText={setText}
                    autoFocus
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                  <View style={styles.prioritySection}>
                    <PriorityCategorySection
                      priority={priority}
                      onPriorityChange={setPriority}
                      categoryId={categoryId}
                      onCategoryChange={setCategoryId}
                    />
                  </View>
                </View>
              )}

              {step === 2 && (
                <View style={styles.stepContent}>
                  <ScheduleTypeSelector
                    value={scheduleType}
                    onChange={setScheduleType}
                  />
                </View>
              )}

              {step === 3 && (
                <View style={styles.stepContent}>
                  {scheduleType === "one_time" && (
                    <>
                      <Text style={styles.reminderHint}>
                        {t("addModal.selectDateAndTime")}
                      </Text>
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
                    </>
                  )}

                  {(scheduleType === "multi_times_daily" ||
                    scheduleType === "ongoing") && (
                    <>
                      <Text style={styles.reminderHint}>
                        {t("addModal.startDate")}
                      </Text>
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
                        <>
                          <Text style={styles.reminderHint}>
                            {t("addModal.endDate")}
                          </Text>
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
                        </>
                      )}

                      <>
                        <Text style={styles.reminderHint}>
                          {scheduleType === "multi_times_daily"
                            ? t("addModal.dailyTimesRequired")
                            : t("addModal.dailyTimesOptional")}
                        </Text>
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
                              <Ionicons
                                name="add"
                                size={18}
                                color={colors.accent}
                              />
                              <Text style={styles.addTimeText}>{t("addModal.addTime")}</Text>
                            </Pressable>
                          </View>
                        {scheduleType === "multi_times_daily" &&
                          dailyTimes.length === 0 && (
                            <Text style={styles.requiredHint}>
                              {t("addModal.addAtLeastOne")}
                            </Text>
                          )}
                      </>
                    </>
                  )}

                  {scheduleType === "shopping_list" && (
                    <>
                      <Text style={styles.reminderHint}>
                        {t("addModal.checklistHint")}
                      </Text>
                      <View style={styles.checklistInputRow}>
                        <TextInput
                          style={[styles.input, styles.checklistInput]}
                          placeholder={t("addModal.checklistPlaceholder")}
                          placeholderTextColor={colors.textMuted}
                          value={checklistInput}
                          onChangeText={setChecklistInput}
                          onSubmitEditing={addChecklistItem}
                          returnKeyType="done"
                        />
                        <Pressable
                          onPress={addChecklistItem}
                          style={({ pressed }) => [
                            styles.addChecklistBtn,
                            pressed && styles.pressed,
                            !checklistInput.trim() && styles.primaryBtnDisabled,
                          ]}
                          disabled={!checklistInput.trim()}
                        >
                          <Ionicons name="add" size={20} color={colors.bg} />
                        </Pressable>
                      </View>
                      {checklistItems.map((item) => (
                        <View key={item.id} style={styles.checklistItemRow}>
                          <Text style={styles.checklistItemText}>{item.text}</Text>
                          <Pressable
                            onPress={() => removeChecklistItem(item.id)}
                            style={({ pressed }) => [styles.removeItemBtn, pressed && styles.pressed]}
                          >
                            <Ionicons name="close-circle" size={20} color={colors.danger} />
                          </Pressable>
                        </View>
                      ))}
                    </>
                  )}

                  {scheduleType === "recurring" && (
                    <>
                      <Text style={styles.reminderHint}>{t("addModal.recurrenceType")}</Text>
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
                      {weeklyTimes.length === 0 && (
                        <Text style={styles.requiredHint}>
                          {t("addModal.defaultTimeHint")}
                        </Text>
                      )}
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
                </View>
              )}
            </ScrollView>

            <View
              style={[
                styles.actionsBar,
                { paddingBottom: insets.bottom + 16 },
              ]}
            >
              <Pressable
                onPress={step === 1 ? handleClose : handleBack}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color={colors.text}
                />
                <Text style={styles.secondaryBtnText}>
                  {step === 1 ? t("addModal.cancel") : t("addModal.back")}
                </Text>
              </Pressable>
              {step < 3 ? (
                <Pressable
                  onPress={handleNext}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.pressed,
                    step === 1 && !canProceedStep2 && styles.primaryBtnDisabled,
                  ]}
                  disabled={step === 1 && !canProceedStep2}
                >
                  <Text style={styles.primaryBtnText}>{t("addModal.next")}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.bg}
                  />
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.pressed,
                    !canProceedStep3 && styles.primaryBtnDisabled,
                  ]}
                  disabled={!canProceedStep3}
                >
                  <Text style={styles.primaryBtnText}>{t("addModal.add")}</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
