import { Ionicons } from "@expo/vector-icons";
import i18n from "../../../../i18n";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../../context/ThemeContext";
import { MONTH_KEYS, WEEKDAYS } from "../../constants";

const CELL_SIZE = 42;
const GRID_COLUMNS = 7;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 42 cells (6x7) for calendar grid. Each cell: { day: number | null, date: Date | null } */
function getCalendarDays(
  year: number,
  month: number,
  weekStartsOn: number
): { day: number | null; date: Date | null }[] {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = getDaysInMonth(year, month);

  let startOffset = firstWeekday - weekStartsOn;
  if (startOffset < 0) startOffset += 7;

  const cells: { day: number | null; date: Date | null }[] = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: null, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, month, d) });
  }
  const total = GRID_COLUMNS * 6;
  while (cells.length < total) {
    cells.push({ day: null, date: null });
  }
  return cells;
}

function isDateDisabled(date: Date, minDate: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const m = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  return d.getTime() < m.getTime();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

interface CustomDatePickerProps {
  visible: boolean;
  value: Date;
  minimumDate?: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export function CustomDatePicker({
  visible,
  value,
  minimumDate,
  onSelect,
  onClose,
}: CustomDatePickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [selectedDate, setSelectedDate] = useState(value);

  const minDate = minimumDate ?? new Date();
  const weekStartsOn = i18n.language === "tr" ? 1 : 0;

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth, weekStartsOn),
    [viewYear, viewMonth, weekStartsOn]
  );

  const weekdayLabels = useMemo(() => {
    const labels = [...WEEKDAYS];
    if (weekStartsOn === 1) {
      labels.push(labels.shift()!);
    }
    return labels;
  }, [weekStartsOn]);

  const canGoPrev =
    viewYear > minDate.getFullYear() ||
    (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth());

  useEffect(() => {
    if (visible) {
      setViewMonth(value.getMonth());
      setViewYear(value.getFullYear());
      setSelectedDate(value);
    }
  }, [visible, value]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayPress = (cell: { day: number | null; date: Date | null }) => {
    if (cell.date && !isDateDisabled(cell.date, minDate)) {
      setSelectedDate(cell.date);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedDate);
    onClose();
  };

  const monthYearLabel = `${t(MONTH_KEYS[viewMonth])} ${viewYear}`;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "transparent",
          justifyContent: "flex-end",
        },
        overlayPressable: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.5)",
        },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 24,
          paddingBottom: 0,
          minHeight: Math.min(Dimensions.get("window").height * 0.52, 480),
        },
        handle: {
          width: 40,
          height: 4,
          backgroundColor: colors.border,
          borderRadius: 2,
          alignSelf: "center",
          marginBottom: 20,
        },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        },
        navBtn: {
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: colors.surfaceHover,
          alignItems: "center",
          justifyContent: "center",
        },
        monthYear: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        },
        weekdayRow: {
          flexDirection: "row",
          marginBottom: 8,
        },
        weekdayCell: {
          width: CELL_SIZE,
          alignItems: "center",
          justifyContent: "center",
        },
        weekdayText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
        },
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          marginBottom: 24,
        },
        dayCell: {
          width: CELL_SIZE,
          height: CELL_SIZE,
          marginHorizontal: 2,
          marginVertical: 10,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
        },
        dayCellEmpty: {
          backgroundColor: "transparent",
        },
        dayCellNormal: {
          backgroundColor: colors.surfaceHover,
        },
        dayCellSelected: {
          backgroundColor: colors.accent,
        },
        dayCellDisabled: {
          opacity: 0.35,
        },
        dayText: {
          fontSize: 15,
          fontWeight: "500",
          color: colors.text,
        },
        dayTextSelected: {
          color: colors.bg,
          fontWeight: "600",
        },
        dayTextDisabled: {
          color: colors.textMuted,
        },
        actions: {
          flexDirection: "row",
          gap: 12,
          paddingBottom: 24,
        },
        cancelBtn: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: 16,
          backgroundColor: colors.surfaceHover,
          alignItems: "center",
          justifyContent: "center",
        },
        confirmBtn: {
          flex: 1,
          flexDirection: "row" as const,
          gap: 8,
          paddingVertical: 14,
          borderRadius: 16,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        cancelBtnText: { fontSize: 16, fontWeight: "600", color: colors.text },
        confirmBtnText: { fontSize: 16, fontWeight: "600", color: colors.bg },
      }),
    [colors]
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={onClose} />
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Pressable
              style={styles.navBtn}
              onPress={prevMonth}
              disabled={!canGoPrev}
              hitSlop={8}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={canGoPrev ? colors.text : colors.textMuted}
              />
            </Pressable>
            <Text style={styles.monthYear}>{monthYearLabel}</Text>
            <Pressable
              style={styles.navBtn}
              onPress={nextMonth}
              hitSlop={8}
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.text}
              />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayLabels.map((w) => (
              <View key={w.value} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>
                  {t(w.labelKey).slice(0, 2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((cell, idx) => {
              const isEmpty = cell.day === null;
              const disabled = cell.date
                ? isDateDisabled(cell.date, minDate)
                : true;
              const selected =
                cell.date && isSameDay(cell.date, selectedDate);

              return (
                <Pressable
                  key={idx}
                  style={[
                    styles.dayCell,
                    isEmpty && styles.dayCellEmpty,
                    !isEmpty && !selected && styles.dayCellNormal,
                    selected && styles.dayCellSelected,
                    !isEmpty && disabled && styles.dayCellDisabled,
                  ]}
                  onPress={() => handleDayPress(cell)}
                  disabled={isEmpty || disabled}
                >
                  {!isEmpty && (
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.dayTextSelected,
                        disabled && !selected && styles.dayTextDisabled,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              style={styles.confirmBtn}
              onPress={handleConfirm}
            >
              <Ionicons name="checkmark" size={20} color={colors.bg} />
              <Text style={styles.confirmBtnText}>{t("common.save")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
