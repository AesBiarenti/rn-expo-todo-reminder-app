import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS } from "../../../constants/theme";

interface TodoInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onAdd: (reminderAt?: string) => void;
}

export function TodoInput({ value, onChangeText, onAdd }: TodoInputProps) {
  const [reminderMode, setReminderMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(
    () => new Date(Date.now() + 3600000),
  );

  const handleAdd = (reminderAt?: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(reminderAt);
    Keyboard.dismiss();
  };

  const handleAddPress = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (reminderMode) {
      if (Platform.OS === "android") {
        DateTimePickerAndroid.open({
          value: tempDate,
          mode: "date",
          minimumDate: new Date(),
          onChange: (_, date) => {
            if (date) {
              handleAdd(date.toISOString());
              setReminderMode(false);
            }
          },
        });
      } else {
        setShowDatePicker(true);
      }
    } else {
      handleAdd();
    }
  };

  const handleDateChange = (_: unknown, date?: Date) => {
    if (Platform.OS === "android") return;
    if (date) {
      handleAdd(date.toISOString());
      setShowDatePicker(false);
      setReminderMode(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(80).duration(350)}
      style={styles.inputWrap}
    >
      <TextInput
        style={styles.input}
        placeholder="What needs to be done?"
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => {
          if (reminderMode) {
            handleAddPress();
          } else {
            handleAdd();
          }
        }}
        returnKeyType="done"
      />
      <Pressable
        onPress={() => setReminderMode(!reminderMode)}
        style={({ pressed }) => [
          styles.bellBtn,
          reminderMode && styles.bellBtnActive,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name={reminderMode ? "alarm" : "alarm-outline"}
          size={22}
          color={reminderMode ? COLORS.accent : COLORS.textMuted}
        />
      </Pressable>
      <Pressable
        onPress={handleAddPress}
        style={({ pressed }) => [
          styles.addBtn,
          pressed && styles.addBtnPressed,
        ]}
      >
        <Ionicons name="add" size={24} color={COLORS.bg} />
      </Pressable>
      {showDatePicker && Platform.OS === "ios" && (
        <DateTimePicker
          value={tempDate}
          mode="datetime"
          display="spinner"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  bellBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBtnActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnPressed: {
    opacity: 0.8,
  },
  pressed: {
    opacity: 0.6,
  },
});
