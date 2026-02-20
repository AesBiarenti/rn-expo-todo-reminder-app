import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { TodoModel } from "../../../types/todo";
import { COLORS } from "../../../constants/theme";
import { formatReminderDate } from "../../../../utils/dateUtils";

interface TodoEditModalProps {
  todo: TodoModel | null;
  visible: boolean;
  onSave: (text: string, reminderAt: string | null) => void;
  onClose: () => void;
}

export function TodoEditModal({
  todo,
  visible,
  onSave,
  onClose,
}: TodoEditModalProps) {
  const [text, setText] = useState(todo?.text ?? "");
  const [reminderAt, setReminderAt] = useState<string | null>(
    todo?.reminderAt ?? null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState(
    () => new Date(todo?.reminderAt ?? Date.now() + 3600000),
  );

  const resetState = () => {
    setText(todo?.text ?? "");
    setReminderAt(todo?.reminderAt ?? null);
    setTempDate(new Date(todo?.reminderAt ?? Date.now() + 3600000));
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(trimmed, reminderAt);
    handleClose();
  };

  const openDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: tempDate,
        mode: "datetime",
        minimumDate: new Date(),
        onChange: (_, date) => {
          if (date) {
            setTempDate(date);
            setReminderAt(date.toISOString());
          }
        },
      });
    } else {
      setPickerMode("date");
      setShowDatePicker(true);
    }
  };

  const handleDateChange = (_: unknown, date?: Date) => {
    if (Platform.OS === "android") return;
    if (date) {
      if (pickerMode === "date") {
        setTempDate(date);
        setPickerMode("time");
      } else {
        setTempDate(date);
        setReminderAt(date.toISOString());
        setShowDatePicker(false);
      }
    }
  };

  const handleRemoveReminder = () => {
    setReminderAt(null);
    setShowDatePicker(false);
    setTempDate(new Date(Date.now() + 3600000));
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
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Düzenle</Text>

          <TextInput
            style={styles.input}
            placeholder="Görev metni"
            placeholderTextColor={COLORS.textMuted}
            value={text}
            onChangeText={setText}
            autoFocus
          />

          <View style={styles.reminderSection}>
            <Text style={styles.label}>Hatırlatıcı</Text>
            {reminderAt ? (
              <View style={styles.reminderRow}>
                <Ionicons name="alarm-outline" size={20} color={COLORS.accent} />
                <Text style={styles.reminderText}>
                  {formatReminderDate(reminderAt)}
                </Text>
                <Pressable
                  onPress={openDatePicker}
                  style={styles.changeBtn}
                >
                  <Text style={styles.changeBtnText}>Değiştir</Text>
                </Pressable>
                <Pressable onPress={handleRemoveReminder} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={openDatePicker} style={styles.addReminderBtn}>
                <Ionicons name="alarm-outline" size={20} color={COLORS.textMuted} />
                <Text style={styles.addReminderText}>Hatırlatıcı ekle</Text>
              </Pressable>
            )}
          </View>

          {showDatePicker && Platform.OS === "ios" && (
            <DateTimePicker
              value={tempDate}
              mode={pickerMode}
              display="spinner"
              minimumDate={new Date()}
              onChange={handleDateChange}
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
  reminderSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reminderText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  changeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeBtnText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: "500",
  },
  removeBtn: {
    padding: 4,
  },
  addReminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addReminderText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
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
