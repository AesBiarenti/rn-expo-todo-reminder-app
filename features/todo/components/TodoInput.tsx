import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Keyboard, StyleSheet, TextInput } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";
import { AnimatedPressable } from "../../../components/ui/AnimatedPressable";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../context/ThemeContext";
import { CustomDatePicker, CustomTimePicker } from "./DateTimePicker";
import { combineDateAndTime } from "../../../utils/dateUtils";

interface TodoInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onAdd: (reminderAt?: string) => void;
}

export function TodoInput({ value, onChangeText, onAdd }: TodoInputProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [reminderMode, setReminderMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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
      setShowDatePicker(true);
    } else {
      handleAdd();
    }
  };

  const handleDateSelect = (date: Date) => {
    setTempDate(date);
    setShowDatePicker(false);
    setShowTimePicker(true);
  };

  const handleTimeSelect = (time: Date) => {
    const combined = combineDateAndTime(tempDate, time);
    handleAdd(combined.toISOString());
    setShowTimePicker(false);
    setReminderMode(false);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        inputWrap: {
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: 20,
          marginBottom: 20,
        },
        input: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 20,
          paddingHorizontal: 18,
          paddingVertical: 14,
          fontSize: 16,
          color: colors.text,
        },
        bellBtn: {
          width: 52,
          height: 52,
          borderRadius: 18,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        bellBtnActive: {
          backgroundColor: colors.accentDim,
        },
        addBtn: {
          width: 52,
          height: 52,
          borderRadius: 18,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        addBtnPressed: { opacity: 0.85 },
        pressed: { opacity: 0.7 },
      }),
    [colors],
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(80).duration(400).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
      style={styles.inputWrap}
    >
      <TextInput
        style={styles.input}
        placeholder={t("addModal.placeholder")}
        placeholderTextColor={colors.textMuted}
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
      <AnimatedPressable
        onPress={() => setReminderMode(!reminderMode)}
        style={[styles.bellBtn, reminderMode && styles.bellBtnActive]}
      >
        <Ionicons
          name={reminderMode ? "alarm" : "alarm-outline"}
          size={22}
          color={reminderMode ? colors.accent : colors.textMuted}
        />
      </AnimatedPressable>
      <AnimatedPressable onPress={handleAddPress} style={styles.addBtn}>
        <Ionicons name="add" size={24} color={colors.bg} />
      </AnimatedPressable>
      {showDatePicker && (
        <CustomDatePicker
          visible={showDatePicker}
          value={tempDate}
          minimumDate={new Date()}
          onSelect={handleDateSelect}
          onClose={() => {
            setShowDatePicker(false);
          }}
        />
      )}
      {showTimePicker && (
        <CustomTimePicker
          visible={showTimePicker}
          value={tempDate}
          onSelect={handleTimeSelect}
          onClose={() => {
            setShowTimePicker(false);
          }}
        />
      )}
    </Animated.View>
  );
}
