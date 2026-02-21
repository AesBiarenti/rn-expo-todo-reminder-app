import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { CategoryId, Priority, TodoModel } from "../../../types/todo";
import { CATEGORIES } from "../../../constants/categories";
import { COLORS, PRIORITY_COLORS } from "../../../constants/theme";
import {
  combineDateAndTime,
  formatDateShort,
  formatReminderDate,
  formatTime,
} from "../../../utils/dateUtils";

const getDefaultDate = () => new Date(Date.now() + 3600000);
const getDefaultTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  return d;
};

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
];

interface TodoEditModalProps {
  todo: TodoModel | null;
  visible: boolean;
  onSave: (updates: {
    text: string;
    reminderAt: string | null;
    priority?: Priority;
    categoryId?: CategoryId;
  }) => void;
  onClose: () => void;
}

export function TodoEditModal({
  todo,
  visible,
  onSave,
  onClose,
}: TodoEditModalProps) {
  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Priority>("medium");
  const [categoryId, setCategoryId] = useState<CategoryId | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"date" | "time">("date");

  const hasReminder = selectedDate !== null && selectedTime !== null;
  const reminderAt = hasReminder
    ? combineDateAndTime(selectedDate, selectedTime).toISOString()
    : null;

  useEffect(() => {
    if (todo && visible) {
      setText(todo.text);
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
    }
  }, [todo, visible]);

  const resetState = () => {
    if (todo) {
      setText(todo.text);
      setSelectedDate(todo.reminderAt ? new Date(todo.reminderAt) : null);
      setSelectedTime(todo.reminderAt ? new Date(todo.reminderAt) : null);
      setPriority(todo.priority ?? "medium");
      setCategoryId(todo.categoryId);
    }
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave({
      text: trimmed,
      reminderAt: hasReminder ? reminderAt : null,
      priority,
      categoryId,
    });
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

  if (!todo) return null;

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
            <Text style={styles.title}>Düzenle</Text>

            <TextInput
              style={styles.input}
              placeholder="Görev metni"
              placeholderTextColor={COLORS.textMuted}
              value={text}
              onChangeText={setText}
              autoFocus
            />

            <View style={styles.section}>
              <Text style={styles.label}>Öncelik</Text>
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
                        styles.priorityLabel,
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

            <View style={styles.section}>
              <Text style={styles.label}>Kategori</Text>
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
                        categoryId === c.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Hatırlatıcı</Text>
              <Pressable onPress={openDatePicker} style={styles.pickerRow}>
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
              <Pressable onPress={openTimePicker} style={styles.pickerRow}>
                <Ionicons name="time-outline" size={20} color={COLORS.accent} />
                <Text style={styles.pickerLabel}>Saat</Text>
                <Text style={styles.pickerValue}>
                  {selectedTime
                    ? formatTime(selectedTime)
                    : "Saat seç"}
                </Text>
              </Pressable>
              {hasReminder && (
                <Text style={styles.reminderPreview}>
                  {formatReminderDate(reminderAt!)}
                </Text>
              )}
              {hasReminder && (
                <Pressable
                  onPress={handleRemoveReminder}
                  style={styles.removeReminderBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={COLORS.danger}
                  />
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
              <Pressable onPress={handleClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>İptal</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: "90%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
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
  priorityLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.text,
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
  reminderPreview: {
    fontSize: 13,
    color: COLORS.accent,
    marginTop: 4,
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
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.bg,
  },
});
