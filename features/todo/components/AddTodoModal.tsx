import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, Text, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedCancelButton } from "../../../components/ui/AnimatedCancelButton";
import { AnimatedPrimaryButton } from "../../../components/ui/AnimatedPrimaryButton";
import { BottomSheetModal } from "../../../components/ui/BottomSheetModal";
import { useTheme } from "../../../context/ThemeContext";
import type { AddTodoParams } from "../../../store/todoStore";
import type { CategoryId, Priority } from "../../../types/todo";
import { combineDateAndTime, toDateStr } from "../../../utils/dateUtils";
import { SCHEDULE_TYPES } from "../constants";
import { useScheduleFormState } from "../hooks/useScheduleFormState";
import { createTodoModalStyles } from "../styles/todoModalStyles";
import { PriorityCategorySection, ScheduleTypeSelector } from "./schedule";
import { ScheduleFormFields } from "./ScheduleFormFields";

interface AddTodoModalProps {
  visible: boolean;
  onAdd: (params: AddTodoParams) => void;
  onClose: () => void;
}

export function AddTodoModal({ visible, onAdd, onClose }: AddTodoModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [categoryId, setCategoryId] = useState<CategoryId | undefined>();
  const form = useScheduleFormState(null, visible);
  const slideX = useSharedValue(0);
  const horizontalPadding = Math.max(24, insets.left, insets.right);
  const contentWidth = useMemo(
    () => Dimensions.get("window").width - horizontalPadding * 2,
    [horizontalPadding],
  );

  useEffect(() => {
    slideX.value = withSpring(-(step - 1) * contentWidth, {
      damping: 100,
      stiffness: 700,
    });
    // slideX is a stable ref from useSharedValue
  }, [step, contentWidth, slideX]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const resetState = () => {
    setStep(1);
    setText("");
    setPriority("medium");
    setCategoryId(undefined);
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
    form.scheduleType === "one_time"
      ? form.selectedDate !== null && form.selectedTime !== null
      : form.scheduleType === "multi_times_daily"
        ? form.startDate !== null && form.dailyTimes.length > 0
        : form.scheduleType === "ongoing"
          ? form.startDate !== null
          : form.scheduleType === "shopping_list"
            ? true
            : form.scheduleType === "recurring"
              ? form.recurrenceStartDate !== null &&
                (form.recurrenceType === "weekly" ||
                  (form.recurrenceType === "monthly" &&
                    form.recurrenceDayOfMonth >= 1) ||
                  (form.recurrenceType === "yearly" &&
                    form.recurrenceMonth >= 1 &&
                    form.recurrenceDayOfMonth >= 1))
              : form.scheduleType === "weekly_days"
                ? form.weekdays.length > 0 && form.weeklyStartDate !== null
                : false;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const params: AddTodoParams = {
      text: trimmed,
      scheduleType: form.scheduleType,
      priority,
      categoryId,
    };

    switch (form.scheduleType) {
      case "one_time":
        if (form.selectedDate && form.selectedTime) {
          params.reminderAt = combineDateAndTime(
            form.selectedDate,
            form.selectedTime,
          ).toISOString();
        }
        break;
      case "multi_times_daily":
        if (form.startDate) params.startDate = toDateStr(form.startDate);
        if (form.endDate) params.endDate = toDateStr(form.endDate);
        if (form.dailyTimes.length > 0) params.dailyTimes = form.dailyTimes;
        break;
      case "ongoing":
        if (form.startDate) params.startDate = toDateStr(form.startDate);
        if (form.dailyTimes.length > 0) params.dailyTimes = form.dailyTimes;
        break;
      case "shopping_list":
        params.checklistItems = form.checklistItems.map((i) => ({
          ...i,
          id: i.id || Date.now().toString() + Math.random(),
        }));
        break;
      case "recurring":
        params.recurrenceType = form.recurrenceType;
        params.recurrenceDayOfWeek = form.recurrenceDayOfWeek;
        params.recurrenceDayOfMonth = form.recurrenceDayOfMonth;
        params.recurrenceMonth = form.recurrenceMonth;
        params.recurrenceTime = form.recurrenceTime;
        if (form.recurrenceStartDate)
          params.recurrenceStartDate = toDateStr(form.recurrenceStartDate);
        if (form.recurrenceEndDate)
          params.recurrenceEndDate = toDateStr(form.recurrenceEndDate);
        break;
      case "weekly_days":
        params.weekdays = form.weekdays;
        if (form.weeklyTimes.length > 0) params.weeklyTimes = form.weeklyTimes;
        if (form.weeklyStartDate)
          params.weeklyStartDate = toDateStr(form.weeklyStartDate);
        if (form.weeklyEndDate)
          params.weeklyEndDate = toDateStr(form.weeklyEndDate);
        break;
    }

    if (
      (form.scheduleType === "one_time" && !params.reminderAt) ||
      (form.scheduleType === "multi_times_daily" &&
        (!params.startDate || !params.dailyTimes?.length)) ||
      (form.scheduleType === "ongoing" && !params.startDate) ||
      (form.scheduleType === "recurring" && !params.recurrenceStartDate) ||
      (form.scheduleType === "weekly_days" &&
        (!params.weekdays?.length || !params.weeklyStartDate))
    ) {
      return;
    }

    onAdd(params);
    handleClose();
  };

  const styles = useMemo(() => createTodoModalStyles(colors), [colors]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      keyboardAvoiding
      maxHeight={Math.min(Dimensions.get("window").height * 0.88, 700)}
      paddingHorizontal={horizontalPadding}
    >
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
              {step === 3 &&
                (() => {
                  const st = SCHEDULE_TYPES.find(
                    (s) => s.value === form.scheduleType,
                  );
                  return t("addModal.step3", {
                    label: st ? t(st.labelKey) : t("addModal.scheduling"),
                  });
                })()}
            </Text>

            <View style={[styles.scrollContent, { overflow: "hidden" }]}>
              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                scrollEnabled
              >
                <Animated.View
                  style={[
                    {
                      flexDirection: "row",
                      width: contentWidth * 3,
                    },
                    slideStyle,
                  ]}
                >
                  <View style={[styles.stepContent, { width: contentWidth }]}>
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

                  <View style={[styles.stepContent, { width: contentWidth }]}>
                    <ScheduleTypeSelector
                      value={form.scheduleType}
                      onChange={(v) => form.update("scheduleType", v)}
                    />
                  </View>

                  <View style={[styles.stepContent, { width: contentWidth }]}>
                    <ScheduleFormFields
                      form={form}
                      styles={styles}
                      colors={colors}
                    />
                  </View>
                </Animated.View>
              </ScrollView>
            </View>

            <View
              style={[styles.actionsBar, { paddingBottom: insets.bottom + 16 }]}
            >
              <AnimatedCancelButton
                onPress={step === 1 ? handleClose : handleBack}
                label={step === 1 ? "addModal.cancel" : "addModal.back"}
              />
              {step < 3 ? (
                <AnimatedPrimaryButton
                  onPress={handleNext}
                  label="addModal.next"
                  iconRight="arrow-forward"
                  disabled={step === 1 && !canProceedStep2}
                />
              ) : (
                <AnimatedPrimaryButton
                  onPress={handleSubmit}
                  label="addModal.add"
                  disabled={!canProceedStep3}
                />
              )}
            </View>
    </BottomSheetModal>
  );
}
