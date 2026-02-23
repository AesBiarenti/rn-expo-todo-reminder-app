import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme } from "../../../../context/ThemeContext";
import i18n from "../../../../i18n";
import { MONTH_KEYS, WEEKDAYS } from "../../constants";

const HORIZONTAL_DAY_SIZE = 44;
const DAY_CELL_WIDTH = HORIZONTAL_DAY_SIZE + 4;
const GRID_COLUMNS = 7;
const GRID_CELL_MARGIN = 12;
const GRID_CELL_SIZE = 44;
const GRID_WIDTH = GRID_COLUMNS * (GRID_CELL_SIZE + GRID_CELL_MARGIN);

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getCalendarDays(
  year: number,
  month: number,
  weekStartsOn: number,
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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function getWeekDates(centerDate: Date, daysBefore = 3, daysAfter = 3): Date[] {
  const result: Date[] = [];
  const start = new Date(centerDate);
  start.setDate(start.getDate() - daysBefore);
  for (let i = 0; i < daysBefore + daysAfter + 1; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    result.push(d);
  }
  return result;
}

export interface DatePickerWidgetProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  datesWithTasks: Set<string>;
}

export function DatePickerWidget({
  selectedDate,
  onDateSelect,
  datesWithTasks,
}: DatePickerWidgetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  const weekStartsOn = i18n.language === "tr" ? 1 : 0;

  const horizontalDates = useMemo(
    () => getWeekDates(selectedDate, 14, 14),
    [selectedDate],
  );

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!expanded && scrollRef.current && horizontalDates.length > 0) {
      const centerIndex = Math.floor(horizontalDates.length / 2);
      const screenWidth = Dimensions.get("window").width - 40;
      const scrollX = Math.max(
        0,
        centerIndex * DAY_CELL_WIDTH - screenWidth / 2 + DAY_CELL_WIDTH / 2,
      );
      scrollRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [selectedDate, expanded, horizontalDates.length]);

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth, weekStartsOn),
    [viewYear, viewMonth, weekStartsOn],
  );

  const weekdayLabels = useMemo(() => {
    const labels = [...WEEKDAYS];
    if (weekStartsOn === 1) {
      labels.push(labels.shift()!);
    }
    return labels;
  }, [weekStartsOn]);

  const monthYearLabel = `${t(MONTH_KEYS[viewMonth])} ${viewYear}`;

  const toggleExpand = () => {
    setExpanded((e) => !e);
    if (!expanded) {
      setViewMonth(selectedDate.getMonth());
      setViewYear(selectedDate.getFullYear());
    }
  };

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

  const handleGridDayPress = (cell: {
    day: number | null;
    date: Date | null;
  }) => {
    if (cell.date) {
      onDateSelect(cell.date);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginHorizontal: 20,
          marginBottom: 16,
        },
        expandBtn: {
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: colors.surfaceHover,
          alignItems: "center",
          justifyContent: "center",
        },
        expandBtnBottom: {
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
        },
        horizontalScroll: {
          paddingHorizontal: 4,
          paddingVertical: 12,
          alignItems: "center",
        },
        dayCell: {
          width: HORIZONTAL_DAY_SIZE,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          paddingHorizontal: 4,
          borderRadius: 16,
          marginHorizontal: 2,
        },
        dayCellSelected: {
          backgroundColor: colors.accent,
        },
        dayName: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 2,
        },
        dayNameWeekend: {
          color: colors.danger,
        },
        dayNameNormal: {
          color: colors.textMuted,
        },
        dayNameSelected: {
          color: colors.bg,
        },
        dayNum: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
        },
        dayNumSelected: {
          color: colors.bg,
        },
        dot: {
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: colors.accent,
          marginTop: 4,
        },
        dotSelected: {
          backgroundColor: colors.bg,
        },
        gridSection: {
          paddingVertical: 4,
          paddingBottom: 0,      
        },
        gridHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        navBtn: {
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: colors.surfaceHover,
          alignItems: "center",
          justifyContent: "center",
        },
        monthYear: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        weekdayRow: {
          flexDirection: "row",
          marginBottom: 6,
          width: GRID_WIDTH,
          alignSelf: "center",
        },
        weekdayCell: {
          width: GRID_CELL_SIZE + GRID_CELL_MARGIN,
          alignItems: "center",
          justifyContent: "center",
        },
        weekdayText: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.textMuted,
        },
        grid: {
         
          maxHeight: "auto",
          width: GRID_WIDTH,
          alignSelf: "center",
          flexDirection: "row",
          flexWrap: "wrap",
        },
        gridDayCell: {
          width: GRID_CELL_SIZE,
          height: GRID_CELL_SIZE,
          marginHorizontal: GRID_CELL_MARGIN / 2,
          marginVertical: GRID_CELL_MARGIN / 2,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
        },
        gridDayCellEmpty: {
          backgroundColor: "transparent",
        },
        gridDayCellNormal: {
          backgroundColor: colors.surfaceHover,
        },
        gridDayCellSelected: {
          backgroundColor: colors.accent,
        },
        gridDayText: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
        },
        gridDayTextSelected: {
          color: colors.bg,
          fontWeight: "600",
        },
        gridDot: {
          position: "absolute",
          bottom: 4,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.accent,
        },
        gridDotSelected: {
          backgroundColor: colors.bg,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      {!expanded ? (
        <View>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {horizontalDates.map((date, index) => {
              const selected = isSameDay(date, selectedDate);
              const dateStr = toDateStr(date);
              const hasTask = datesWithTasks.has(dateStr);
              const dow = date.getDay();
              const isWeekend = dow === 0 || dow === 6;

              const handleDayPress = () => {
                onDateSelect(date);
                const screenWidth = Dimensions.get("window").width - 40;
                const scrollX = Math.max(
                  0,
                  index * DAY_CELL_WIDTH - screenWidth / 2 + DAY_CELL_WIDTH / 2,
                );
                scrollRef.current?.scrollTo({ x: scrollX, animated: true });
              };

              return (
                <Pressable
                  key={dateStr}
                  onPress={handleDayPress}
                  style={[styles.dayCell, selected && styles.dayCellSelected]}
                >
                  <Text
                    style={[
                      styles.dayName,
                      isWeekend && !selected && styles.dayNameWeekend,
                      !isWeekend && !selected && styles.dayNameNormal,
                      selected && styles.dayNameSelected,
                    ]}
                  >
                    {t(WEEKDAYS[dow].labelKey).slice(0, 3).toUpperCase()}
                  </Text>
                  <Text
                    style={[styles.dayNum, selected && styles.dayNumSelected]}
                  >
                    {date.getDate()}
                  </Text>
                  {hasTask && (
                    <View
                      style={[styles.dot, selected && styles.dotSelected]}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            onPress={toggleExpand}
            style={({ pressed }) => [
              styles.expandBtnBottom,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.gridSection}
        >
          <View style={styles.gridHeader}>
            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={prevMonth}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <Text style={styles.monthYear}>{monthYearLabel}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={nextMonth}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
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
              const selected = cell.date && isSameDay(cell.date, selectedDate);
              const dateStr = cell.date ? toDateStr(cell.date) : "";
              const hasTask = cell.date ? datesWithTasks.has(dateStr) : false;

              return (
                <Pressable
                  key={idx}
                  style={[
                    styles.gridDayCell,
                    isEmpty && styles.gridDayCellEmpty,
                    !isEmpty && !selected && styles.gridDayCellNormal,
                    selected && styles.gridDayCellSelected,
                  ]}
                  onPress={() => handleGridDayPress(cell)}
                  disabled={isEmpty}
                >
                  {!isEmpty && (
                    <>
                      <Text
                        style={[
                          styles.gridDayText,
                          selected && styles.gridDayTextSelected,
                        ]}
                      >
                        {cell.day}
                      </Text>
                      {hasTask && (
                        <View
                          style={[
                            styles.gridDot,
                            selected && styles.gridDotSelected,
                          ]}
                        />
                      )}
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={toggleExpand}
            style={({ pressed }) => [
              styles.expandBtnBottom,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="chevron-up" size={20} color={colors.textMuted} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
