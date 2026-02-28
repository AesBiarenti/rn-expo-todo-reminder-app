import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { AnimatedPressable } from "../../../../components/ui/AnimatedPressable";
import { useTheme } from "../../../../context/ThemeContext";
import i18n from "../../../../i18n";
import { toDateStr } from "../../../../utils/dateUtils";
import { MONTH_KEYS, WEEKDAYS } from "../../constants";

const HORIZONTAL_DAY_SIZE = 44;
const DAY_CELL_WIDTH = HORIZONTAL_DAY_SIZE + 4;
const GRID_COLUMNS = 7;
const COLLAPSED_HEIGHT = 100;
const EXPANDED_HEIGHT = 420;
const DRAG_RANGE = 120;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

type CalendarCell = {
  day: number;
  date: Date;
  isOtherMonth?: boolean;
};

function getCalendarDays(
  year: number,
  month: number,
  weekStartsOn: number,
): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = getDaysInMonth(year, month);

  let startOffset = firstWeekday - weekStartsOn;
  if (startOffset < 0) startOffset += 7;

  const cells: CalendarCell[] = [];

  // Önceki ayın son günleri
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDaysInMonth = getDaysInMonth(prevYear, prevMonth);
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = prevDaysInMonth - i;
    cells.push({
      day,
      date: new Date(prevYear, prevMonth, day),
      isOtherMonth: true,
    });
  }

  // Mevcut ayın günleri
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, month, d) });
  }

  // Sonraki ayın ilk günleri
  const total = GRID_COLUMNS * 6;
  const remaining = total - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({
      day: d,
      date: new Date(nextYear, nextMonth, d),
      isOtherMonth: true,
    });
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
  dateTaskCounts: Record<string, number>;
}

export function DatePickerWidget({
  selectedDate,
  onDateSelect,
  dateTaskCounts,
}: DatePickerWidgetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const expandProgress = useSharedValue(expanded ? 1 : 0);
  const panStartProgress = useSharedValue(0);
  const monthSlideOffset = useSharedValue(0);
  const isMonthTransitioning = useSharedValue(0);

  const containerWidth = screenWidth - 40;
  const gridCellMargin = Math.min(12, Math.floor(containerWidth / 56));
  const gridCellSize = Math.floor(
    (containerWidth - (GRID_COLUMNS - 1) * gridCellMargin) / GRID_COLUMNS,
  );
  const gridWidth =
    GRID_COLUMNS * gridCellSize + (GRID_COLUMNS - 1) * gridCellMargin;
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

  const prevMonthData = useMemo(() => {
    if (viewMonth === 0) return { month: 11, year: viewYear - 1 };
    return { month: viewMonth - 1, year: viewYear };
  }, [viewMonth, viewYear]);

  const nextMonthData = useMemo(() => {
    if (viewMonth === 11) return { month: 0, year: viewYear + 1 };
    return { month: viewMonth + 1, year: viewYear };
  }, [viewMonth, viewYear]);

  const prevMonthDays = useMemo(
    () =>
      getCalendarDays(prevMonthData.year, prevMonthData.month, weekStartsOn),
    [prevMonthData, weekStartsOn],
  );

  const nextMonthDays = useMemo(
    () =>
      getCalendarDays(nextMonthData.year, nextMonthData.month, weekStartsOn),
    [nextMonthData, weekStartsOn],
  );

  const applyPrevMonth = useCallback(() => {
    setViewMonth(prevMonthData.month);
    setViewYear(prevMonthData.year);
    monthSlideOffset.value = 0;
    isMonthTransitioning.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable
  }, [prevMonthData]);

  const applyNextMonth = useCallback(() => {
    setViewMonth(nextMonthData.month);
    setViewYear(nextMonthData.year);
    monthSlideOffset.value = 0;
    isMonthTransitioning.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable
  }, [nextMonthData]);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      setViewMonth(selectedDate.getMonth());
      setViewYear(selectedDate.getFullYear());
    }
    expandProgress.value = withSpring(next ? 1 : 0, {
      damping: 100,
      stiffness: 700,
    });
  };

  const commitExpand = useCallback(
    (toExpand: boolean) => {
      setExpanded(toExpand);
      if (toExpand) {
        setViewMonth(selectedDate.getMonth());
        setViewYear(selectedDate.getFullYear());
      }
    },
    [selectedDate],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-12, 12])
        .failOffsetX([-22, 22])
        .onStart(() => {
          "worklet";
          panStartProgress.value = expandProgress.value;
        })
        .onUpdate((e) => {
          "worklet";
          const start = panStartProgress.value;
          const delta = e.translationY / DRAG_RANGE;
          const next = Math.max(0, Math.min(1, start + delta));
          expandProgress.value = next;
        })
        .onEnd((e) => {
          "worklet";
          const progress = expandProgress.value;
          const velocity = e.velocityY / DRAG_RANGE;
          const snapTo = progress + velocity * 0.15 > 0.5 ? 1 : 0;
          expandProgress.value = withSpring(snapTo, {
            damping: 100,
            stiffness: 700,
          });
          runOnJS(commitExpand)(snapTo === 1);
        }),
    // expandProgress and panStartProgress are stable shared values
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commitExpand],
  );

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      expandProgress.value,
      [0, 1],
      [COLLAPSED_HEIGHT, EXPANDED_HEIGHT],
    ),
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -expandProgress.value * COLLAPSED_HEIGHT }],
  }));

  const pageWidth = containerWidth;
  const monthPagerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: -(1 - monthSlideOffset.value) * pageWidth,
      },
    ],
  }));

  const prevMonth = useCallback(() => {
    if (isMonthTransitioning.value) return;
    isMonthTransitioning.value = 1;
    monthSlideOffset.value = withTiming(
      1,
      { duration: 280, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
      (finished) => {
        if (finished) runOnJS(applyPrevMonth)();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable
  }, [applyPrevMonth]);

  const nextMonth = useCallback(() => {
    if (isMonthTransitioning.value) return;
    isMonthTransitioning.value = 1;
    monthSlideOffset.value = withTiming(
      -1,
      { duration: 280, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
      (finished) => {
        if (finished) runOnJS(applyNextMonth)();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable
  }, [applyNextMonth]);

  const handleGridDayPress = (cell: {
    day: number | null;
    date: Date | null;
  }) => {
    if (cell.date) {
      onDateSelect(cell.date);
    }
  };

  const renderMonthGrid = (cells: CalendarCell[]) => (
    <View style={styles.monthPage}>
      <View style={styles.grid}>
        {cells.map((cell, idx) => {
          const selected = isSameDay(cell.date, selectedDate);
          const dateStr = toDateStr(cell.date);
          const taskCount = dateTaskCounts[dateStr] ?? 0;
          const isOtherMonth = cell.isOtherMonth ?? false;

          return (
            <AnimatedPressable
              key={idx}
              style={[
                styles.gridDayCell,
                isOtherMonth && !selected && styles.gridDayCellOtherMonth,
                !isOtherMonth && !selected && styles.gridDayCellNormal,
                selected && styles.gridDayCellSelected,
              ]}
              onPress={() => handleGridDayPress(cell)}
            >
              <Text
                style={[
                  styles.gridDayText,
                  selected && styles.gridDayTextSelected,
                  isOtherMonth && !selected && styles.gridDayTextOtherMonth,
                ]}
              >
                {cell.day}
              </Text>
              {taskCount > 0 && (
                <View style={styles.gridDotRow}>
                  {Array.from({ length: Math.min(taskCount, 3) }).map(
                    (_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.gridDot,
                          selected && styles.gridDotSelected,
                          isOtherMonth && !selected && styles.gridDotOtherMonth,
                        ]}
                      />
                    ),
                  )}
                </View>
              )}
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginHorizontal: 20,
          marginBottom: 16,
        },
        dragContainer: {
          overflow: "hidden",
        },
        collapsedSection: {
          justifyContent: "center",
        },
        expandedSection: {
          justifyContent: "flex-start",
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
        dotRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          marginTop: 4,
        },
        dot: {
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.accent,
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
          width: gridWidth,
          alignSelf: "center",
          gap: gridCellMargin,
        },
        weekdayCell: {
          width: gridCellSize,
          alignItems: "center",
          justifyContent: "center",
        },
        weekdayText: {
          fontSize: gridCellSize < 38 ? 12 : 14,
          fontWeight: "600",
          color: colors.textMuted,
        },
        grid: {
          maxHeight: "auto",
          width: gridWidth,
          alignSelf: "center",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: gridCellMargin,
        },
        gridDayCell: {
          width: gridCellSize,
          height: gridCellSize,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
        },
        gridDayCellOtherMonth: {
          opacity: 0.5,
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
        gridDayTextOtherMonth: {
          color: colors.textMuted,
          opacity: 0.5,
        },
        gridDotRow: {
          position: "absolute",
          bottom: 4,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        },
        gridDot: {
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: colors.accent,
        },
        gridDotSelected: {
          backgroundColor: colors.bg,
        },
        gridDotOtherMonth: {
          backgroundColor: colors.textMuted,
          opacity: 0.7,
        },
        monthPage: {
          width: containerWidth,
          paddingHorizontal: 0,
        },
        monthPagerRow: {
          flexDirection: "row",
        },
        monthPagerContainer: {
          width: containerWidth,
          overflow: "hidden",
        },
      }),
    [colors, gridWidth, gridCellSize, gridCellMargin, containerWidth],
  );

  const collapsedSection = (
    <View style={[styles.collapsedSection, { height: COLLAPSED_HEIGHT }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {horizontalDates.map((date, index) => {
          const selected = isSameDay(date, selectedDate);
          const dateStr = toDateStr(date);
          const taskCount = dateTaskCounts[dateStr] ?? 0;
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
            <AnimatedPressable
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
              <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>
                {date.getDate()}
              </Text>
              {taskCount > 0 && (
                <View style={styles.dotRow}>
                  {Array.from({ length: Math.min(taskCount, 3) }).map(
                    (_, i) => (
                      <View
                        key={i}
                        style={[styles.dot, selected && styles.dotSelected]}
                      />
                    ),
                  )}
                </View>
              )}
            </AnimatedPressable>
          );
        })}
      </ScrollView>
      <AnimatedPressable onPress={toggleExpand} style={styles.expandBtnBottom}>
        <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
      </AnimatedPressable>
    </View>
  );

  const monthSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-20, 20])
        .onEnd((e) => {
          "worklet";
          const SWIPE_THRESHOLD = 50;
          const VEL_THRESHOLD = 400;
          if (
            isMonthTransitioning.value === 1 ||
            (Math.abs(e.translationX) < SWIPE_THRESHOLD &&
              Math.abs(e.velocityX) < VEL_THRESHOLD)
          ) {
            return;
          }
          if (e.translationX > 0 || e.velocityX > 0) {
            runOnJS(prevMonth)();
          } else {
            runOnJS(nextMonth)();
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isMonthTransitioning is shared value
    [prevMonth, nextMonth],
  );

  const expandedSection = (
    <View style={[styles.expandedSection, { height: EXPANDED_HEIGHT }]}>
      <View style={styles.gridSection}>
        <View style={styles.gridHeader}>
          <AnimatedPressable onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </AnimatedPressable>
          <Text style={styles.monthYear}>{monthYearLabel}</Text>
          <AnimatedPressable onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </AnimatedPressable>
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

        <GestureDetector gesture={monthSwipeGesture}>
          <View style={styles.monthPagerContainer}>
            <Animated.View
              style={[styles.monthPagerRow, monthPagerAnimatedStyle]}
            >
              <View style={styles.monthPage}>
                {renderMonthGrid(prevMonthDays)}
              </View>
              <View style={styles.monthPage}>
                {renderMonthGrid(calendarDays)}
              </View>
              <View style={styles.monthPage}>
                {renderMonthGrid(nextMonthDays)}
              </View>
            </Animated.View>
          </View>
        </GestureDetector>

        <AnimatedPressable
          onPress={toggleExpand}
          style={styles.expandBtnBottom}
        >
          <Ionicons name="chevron-up" size={20} color={colors.textMuted} />
        </AnimatedPressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.dragContainer, containerAnimatedStyle]}
          collapsable={false}
        >
          <Animated.View style={contentAnimatedStyle}>
            {collapsedSection}
            {expandedSection}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
