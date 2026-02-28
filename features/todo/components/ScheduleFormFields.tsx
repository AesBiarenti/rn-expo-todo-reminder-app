import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";
import { AnimatedPressable } from "../../../components/ui/AnimatedPressable";
import { ChipRow } from "../../../components/ui/ChipRow";
import { PickerRow } from "../../../components/ui/PickerRow";
import { RemovableChipList } from "../../../components/ui/RemovableChipList";
import {
  formatDateShort,
  formatTime,
  getDefaultDate,
  getDefaultTime,
} from "../../../utils/dateUtils";
import { MONTH_KEYS, RECURRENCE_TYPES, WEEKDAYS } from "../constants";
import type { useScheduleFormState } from "../hooks/useScheduleFormState";
import { CustomDatePicker, CustomTimePicker } from "./DateTimePicker";
import type { createTodoModalStyles } from "../styles/todoModalStyles";

type ScheduleForm = ReturnType<typeof useScheduleFormState>;
type Styles = ReturnType<typeof createTodoModalStyles>;

interface ScheduleFormFieldsProps {
  form: ScheduleForm;
  styles: Styles;
  colors: {
    accent: string;
    text: string;
    textMuted: string;
    bg: string;
    danger: string;
  };
}

export function ScheduleFormFields({ form, styles, colors }: ScheduleFormFieldsProps) {
  const { t } = useTranslation();
  const {
    scheduleType,
    selectedDate,
    selectedTime,
    startDate,
    endDate,
    dailyTimes,
    timeToAdd,
    checklistItems,
    checklistInput,
    recurrenceType,
    recurrenceDayOfWeek,
    recurrenceDayOfMonth,
    recurrenceMonth,
    recurrenceTime,
    recurrenceStartDate,
    recurrenceEndDate,
    weekdays,
    weeklyTimes,
    weeklyTimeToAdd,
    weeklyStartDate,
    weeklyEndDate,
    showDatePicker,
    showTimePicker,
    pickerTarget,
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
  } = form;

  const recurrenceTimeAsDate = () => {
    const [h, m] = (recurrenceTime ?? "09:00").split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const datePickerValue =
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
                : weeklyEndDate ?? weeklyStartDate ?? new Date();

  const timePickerValue =
    pickerTarget === "time"
      ? selectedTime ?? getDefaultTime()
      : pickerTarget === "daily"
        ? timeToAdd ?? getDefaultTime()
        : pickerTarget === "recurTime"
          ? recurrenceTimeAsDate()
          : weeklyTimeToAdd ?? getDefaultTime();

  const addChecklist = () => addChecklistItem(checklistInput);

  return (
    <>
      {scheduleType === "one_time" && (
        <>
          <Text style={styles.reminderHint}>{t("addModal.selectDateAndTime")}</Text>
          <PickerRow
            icon="calendar-outline"
            label="addModal.date"
            value={selectedDate ? formatDateShort(selectedDate) : t("addModal.selectDate")}
            onPress={() => openDatePicker("date")}
          />
          <PickerRow
            icon="time-outline"
            label="addModal.time"
            value={selectedTime ? formatTime(selectedTime) : t("addModal.selectTime")}
            onPress={() => openTimePicker("time")}
          />
        </>
      )}

      {(scheduleType === "multi_times_daily" || scheduleType === "ongoing") && (
        <>
          <Text style={styles.reminderHint}>{t("addModal.startDate")}</Text>
          <PickerRow
            icon="calendar-outline"
            label="addModal.start"
            value={startDate ? formatDateShort(startDate) : t("addModal.selectDate")}
            onPress={() => openDatePicker("start")}
          />
          {scheduleType === "multi_times_daily" && (
            <>
              <Text style={styles.reminderHint}>{t("addModal.endDate")}</Text>
              <PickerRow
                icon="calendar-outline"
                label="addModal.end"
                value={endDate ? formatDateShort(endDate) : t("addModal.selectDateOptional")}
                onPress={() => openDatePicker("end")}
              />
            </>
          )}
          <>
            <Text style={styles.reminderHint}>
              {scheduleType === "multi_times_daily"
                ? t("addModal.dailyTimesRequired")
                : t("addModal.dailyTimesOptional")}
            </Text>
            <RemovableChipList
              values={dailyTimes}
              onRemove={removeDailyTime}
              onAdd={() => openTimePicker("daily")}
              placeholder={
                scheduleType === "multi_times_daily"
                  ? t("addModal.addAtLeastOne")
                  : undefined
              }
            />
          </>
        </>
      )}

      {scheduleType === "shopping_list" && (
        <>
          <Text style={styles.reminderHint}>{t("addModal.checklistHint")}</Text>
          <View style={styles.checklistInputRow}>
            <TextInput
              style={[styles.input, styles.checklistInput]}
              placeholder={t("addModal.checklistPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={checklistInput}
              onChangeText={(v) => update("checklistInput", v)}
              onSubmitEditing={addChecklist}
              returnKeyType="done"
            />
            <AnimatedPressable
              onPress={addChecklist}
              style={[styles.addChecklistBtn, !checklistInput.trim() && styles.primaryBtnDisabled]}
              disabled={!checklistInput.trim()}
            >
              <Ionicons name="add" size={20} color={colors.bg} />
            </AnimatedPressable>
          </View>
          {checklistItems.map((item) => (
            <View key={item.id} style={styles.checklistItemRow}>
              <Text style={styles.checklistItemText}>{item.text}</Text>
              <AnimatedPressable onPress={() => removeChecklistItem(item.id)} style={styles.removeItemBtn}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </AnimatedPressable>
            </View>
          ))}
        </>
      )}

      {scheduleType === "recurring" && (
        <>
          <Text style={styles.reminderHint}>{t("addModal.recurrenceType")}</Text>
          <ChipRow
            items={RECURRENCE_TYPES}
            selected={recurrenceType}
            onSelect={(v) => update("recurrenceType", v)}
          />
          {recurrenceType === "weekly" && (
            <>
              <Text style={styles.reminderHint}>{t("addModal.dayOfWeek")}</Text>
              <ChipRow
                items={WEEKDAYS}
                selected={recurrenceDayOfWeek}
                onSelect={(v) => update("recurrenceDayOfWeek", v)}
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
                onSelect={(v) => update("recurrenceDayOfMonth", v)}
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
                onSelect={(v) => update("recurrenceMonth", v)}
              />
              <Text style={styles.reminderHint}>{t("addModal.dayOfMonth")}</Text>
              <ChipRow
                items={[1, 5, 10, 15, 20, 25, 31].map((d) => ({
                  value: d,
                  labelKey: String(d),
                  label: String(d),
                }))}
                selected={recurrenceDayOfMonth}
                onSelect={(v) => update("recurrenceDayOfMonth", v)}
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
            onRemove={removeWeeklyTime}
            onAdd={() => openTimePicker("weeklyTime")}
            placeholder={t("addModal.defaultTimeHint")}
          />
          <Text style={styles.reminderHint}>{t("addModal.startDate")}</Text>
          <PickerRow
            icon="calendar-outline"
            label="addModal.start"
            value={weeklyStartDate ? formatDateShort(weeklyStartDate) : t("addModal.selectDate")}
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

      {showDatePicker && (
        <CustomDatePicker
          visible={showDatePicker}
          value={datePickerValue}
          minimumDate={
            pickerTarget === "end" && startDate
              ? startDate
              : pickerTarget === "recurEnd" && recurrenceStartDate
                ? recurrenceStartDate
                : pickerTarget === "weeklyEnd" && weeklyStartDate
                  ? weeklyStartDate
                  : new Date()
          }
          onSelect={handleDateChange}
          onClose={closeDatePicker}
        />
      )}
      {showTimePicker && (
        <CustomTimePicker
          visible={showTimePicker}
          value={timePickerValue}
          onSelect={handleTimeChange}
          onClose={closeTimePicker}
        />
      )}
    </>
  );
}
