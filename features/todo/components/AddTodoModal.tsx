import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CategoryId, Priority } from "../../../types/todo";
import { CATEGORIES } from "../../../constants/categories";
import { COLORS, PRIORITY_COLORS } from "../../../constants/theme";
import {
  combineDateAndTime,
  formatDateShort,
  formatTime,
} from "../../../utils/dateUtils";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
];

interface AddTodoModalProps {
  visible: boolean;
  onAdd: (
    text: string,
    reminderAt?: string,
    priority?: Priority,
    categoryId?: CategoryId,
  ) => void;
  onClose: () => void;
}

const getDefaultDate = () => new Date(Date.now() + 3600000);
const getDefaultTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  return d;
};

export function AddTodoModal({
  visible,
  onAdd,
  onClose,
}: AddTodoModalProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [categoryId, setCategoryId] = useState<CategoryId | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"date" | "time">("date");

  const hasReminder = selectedDate !== null && selectedTime !== null;
  const reminderAt = hasReminder
    ? combineDateAndTime(selectedDate, selectedTime).toISOString()
    : null;

  const resetState = () => {
    setStep(1);
    setText("");
    setPriority("medium");
    setCategoryId(undefined);
    setSelectedDate(null);
    setSelectedTime(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNext = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleAddWithReminder = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!hasReminder) return;
    onAdd(trimmed, reminderAt ?? undefined, priority, categoryId);
    handleClose();
  };

  const handleSkip = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, undefined, priority, categoryId);
    handleClose();
  };

  const openDatePicker = () => {
    const value = selectedDate ?? getDefaultDate();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value,
        mode: "date",
        minimumDate: new Date(),
        onChange: (_, date) => {
          if (date) setSelectedDate(date);
        },
      });
    } else {
      setPickerTarget("date");
      setShowDatePicker(true);
    }
  };

  const openTimePicker = () => {
    const value = selectedTime ?? getDefaultTime();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value,
        mode: "time",
        onChange: (_, date) => {
          if (date) setSelectedTime(date);
        },
      });
    } else {
      setPickerTarget("time");
      setShowTimePicker(true);
    }
  };

  const handlePickerChange = (_: unknown, date?: Date) => {
    if (Platform.OS === "android") return;
    if (date) {
      if (pickerTarget === "date") {
        setSelectedDate(date);
        setShowDatePicker(false);
      } else {
        setSelectedTime(date);
        setShowTimePicker(false);
      }
    }
  };

  const handleRemoveReminder = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

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
              { paddingBottom: insets.bottom + 24 },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            <View style={styles.stepIndicator}>
              {[1, 2].map((s) => (
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
              {step === 1 ? "Adım 1: Görev" : "Adım 2: Hatırlatıcı"}
            </Text>

            {step === 1 && (
              <View style={styles.stepContent}>
                <TextInput
                  style={styles.input}
                  placeholder="What needs to be done?"
                  placeholderTextColor={COLORS.textMuted}
                  value={text}
                  onChangeText={setText}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={handleNext}
                />
                <View style={styles.prioritySection}>
                  <Text style={styles.priorityLabel}>Öncelik</Text>
                  <View style={styles.priorityRow}>
                    {PRIORITIES.map((p) => (
                      <Pressable
                        key={p.value}
                        onPress={() => setPriority(p.value)}
                        style={[
                          styles.priorityBtn,
                          priority === p.value && {
                            backgroundColor: PRIORITY_COLORS[p.value] + "30",
                            borderColor: PRIORITY_COLORS[p.value],
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.priorityDot,
                            { backgroundColor: PRIORITY_COLORS[p.value] },
                          ]}
                        />
                        <Text
                          style={[
                            styles.priorityBtnText,
                            priority === p.value && {
                              color: PRIORITY_COLORS[p.value],
                            },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.categorySection}>
                  <Text style={styles.categoryLabel}>Kategori</Text>
                  <View style={styles.categoryRow}>
                    {CATEGORIES.map((c) => (
                      <Pressable
                        key={c.id}
                        onPress={() =>
                          setCategoryId(categoryId === c.id ? undefined : c.id)
                        }
                        style={[
                          styles.categoryChip,
                          categoryId === c.id && styles.categoryChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            categoryId === c.id &&
                              styles.categoryChipTextActive,
                          ]}
                        >
                          {c.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Pressable
                  onPress={handleNext}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.pressed,
                    !text.trim() && styles.primaryBtnDisabled,
                  ]}
                  disabled={!text.trim()}
                >
                  <Text style={styles.primaryBtnText}>İleri</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.bg} />
                </Pressable>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <View style={styles.reminderSection}>
                  <Text style={styles.reminderHint}>
                    Hatırlatıcı eklemek için tarih ve saat seçin (ikisi zorunlu)
                  </Text>

                  <Pressable
                    onPress={openDatePicker}
                    style={styles.pickerRow}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={COLORS.accent}
                    />
                    <Text style={styles.pickerLabel}>Tarih</Text>
                    <Text style={styles.pickerValue}>
                      {selectedDate
                        ? formatDateShort(selectedDate)
                        : "Tarih seç"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={openTimePicker}
                    style={styles.pickerRow}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={COLORS.accent}
                    />
                    <Text style={styles.pickerLabel}>Saat</Text>
                    <Text style={styles.pickerValue}>
                      {selectedTime
                        ? formatTime(selectedTime)
                        : "Saat seç"}
                    </Text>
                  </Pressable>

                  {hasReminder && (
                    <Pressable
                      onPress={handleRemoveReminder}
                      style={styles.removeReminderBtn}
                    >
                      <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                      <Text style={styles.removeReminderText}>
                        Hatırlatıcıyı kaldır
                      </Text>
                    </Pressable>
                  )}
                </View>

                {(showDatePicker || showTimePicker) && Platform.OS === "ios" && (
                  <DateTimePicker
                    value={
                      pickerTarget === "date"
                        ? selectedDate ?? getDefaultDate()
                        : selectedTime ?? getDefaultTime()
                    }
                    mode={pickerTarget}
                    display="spinner"
                    minimumDate={pickerTarget === "date" ? new Date() : undefined}
                    onChange={handlePickerChange}
                  />
                )}

                <View style={styles.actions}>
                  <Pressable
                    onPress={handleBack}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons name="arrow-back" size={18} color={COLORS.text} />
                    <Text style={styles.secondaryBtnText}>Geri</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSkip}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.secondaryBtnText}>Atla</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddWithReminder}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      pressed && styles.pressed,
                      !hasReminder && styles.primaryBtnDisabled,
                    ]}
                    disabled={!hasReminder}
                  >
                    <Text style={styles.primaryBtnText}>Ekle</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    width: "100%",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  stepDotActive: {
    backgroundColor: COLORS.accent,
    width: 24,
  },
  stepDotDone: {
    backgroundColor: COLORS.accent,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 20,
    textAlign: "center",
  },
  stepContent: {
    gap: 16,
  },
  prioritySection: {
    marginBottom: 4,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.text,
  },
  categorySection: {
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  categoryChipTextActive: {
    color: COLORS.accent,
    fontWeight: "600",
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  reminderSection: {
    marginBottom: 8,
  },
  reminderHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
    width: 50,
  },
  pickerValue: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textMuted,
  },
  removeReminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  removeReminderText: {
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.bg,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  pressed: {
    opacity: 0.8,
  },
});
