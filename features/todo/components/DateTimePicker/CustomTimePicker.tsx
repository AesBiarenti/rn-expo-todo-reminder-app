import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AnimatedCancelButton } from "../../../../components/ui/AnimatedCancelButton";
import { AnimatedSaveButton } from "../../../../components/ui/AnimatedSaveButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../../context/ThemeContext";

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING_VERTICAL = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const HOUR_SNAP_OFFSETS = HOURS.map((_, i) => i * ITEM_HEIGHT);
const MINUTE_SNAP_OFFSETS = MINUTES.map((_, i) => i * ITEM_HEIGHT);

interface CustomTimePickerProps {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export function CustomTimePicker({
  visible,
  value,
  onSelect,
  onClose,
}: CustomTimePickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(
    Math.floor(value.getMinutes() / 5) * 5,
  );

  const hourListRef = useRef<FlatList<number>>(null);
  const minuteListRef = useRef<FlatList<number>>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (visible) {
      setHour(value.getHours());
      setMinute(Math.floor(value.getMinutes() / 5) * 5);
      isInitialMount.current = true;
    }
  }, [visible, value]);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => {
        if (isInitialMount.current) {
          isInitialMount.current = false;
          hourListRef.current?.scrollToOffset({
            offset: hour * ITEM_HEIGHT,
            animated: false,
          });
          minuteListRef.current?.scrollToOffset({
            offset: (minute / 5) * ITEM_HEIGHT,
            animated: false,
          });
        }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [visible, hour, minute]);

  const handleScrollEnd = (
    type: "hour" | "minute",
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex =
      type === "hour"
        ? Math.min(Math.max(0, index), 23)
        : Math.min(Math.max(0, index), 11);
    const exactOffset = clampedIndex * ITEM_HEIGHT;

    if (type === "hour") {
      setHour(clampedIndex);
      hourListRef.current?.scrollToOffset({ offset: exactOffset, animated: false });
    } else {
      setMinute(clampedIndex * 5);
      minuteListRef.current?.scrollToOffset({
        offset: exactOffset,
        animated: false,
      });
    }
  };

  const getItemLayout = (_: unknown, index: number) => ({
    length: ITEM_HEIGHT,
    offset: PADDING_VERTICAL + index * ITEM_HEIGHT,
    index,
  });

  const handleConfirm = () => {
    const date = new Date(value);
    date.setHours(hour, minute, 0, 0);
    onSelect(date);
    onClose();
  };

  const formatHour = (h: number) => h.toString().padStart(2, "0");
  const formatMinute = (m: number) => m.toString().padStart(2, "0");

  const styles = StyleSheet.create({
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
      minHeight: Math.min(Dimensions.get("window").height * 0.48, 420),
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 20,
      textAlign: "center",
    },
    pickerRow: {
      flexDirection: "row",
      minHeight: PICKER_HEIGHT + 28,
      marginBottom: 24,
    },
    pickerColumn: {
      flex: 1,
    },
    scrollView: {
      height: PICKER_HEIGHT,
    },
    listContent: {
      paddingVertical: PADDING_VERTICAL,
    },
    item: {
      height: ITEM_HEIGHT,
      justifyContent: "center",
      alignItems: "center",
    },
    itemText: {
      fontSize: 18,
      color: colors.textMuted,
      fontWeight: "500",
    },
    itemTextSelected: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 20,
    },
    highlight: {
      position: "absolute" as const,
      left: 8,
      right: 8,
      top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
      height: ITEM_HEIGHT,
      borderRadius: 14,
      backgroundColor: colors.surfaceHover,
      opacity: 0.8,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      paddingBottom: 24,
    },
    columnLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textMuted,
      textAlign: "center" as const,
      marginBottom: 8,
    },
  });

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
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t("addModal.time")}</Text>

          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Text style={styles.columnLabel}>{t("datePicker.hour")}</Text>
              <View style={{ height: PICKER_HEIGHT, position: "relative" as const }}>
                <View style={styles.highlight} pointerEvents="none" />
                <FlatList
                  ref={hourListRef}
                  data={HOURS}
                  keyExtractor={(h) => h.toString()}
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={Platform.OS === "android"}
                  bounces={false}
                  overScrollMode="never"
                  snapToOffsets={HOUR_SNAP_OFFSETS}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentContainerStyle={styles.listContent}
                  getItemLayout={getItemLayout}
                  onMomentumScrollEnd={(e) => handleScrollEnd("hour", e)}
                  onScrollEndDrag={(e) => handleScrollEnd("hour", e)}
                  renderItem={({ item: h }) => (
                    <View style={styles.item}>
                      <Text
                        style={[
                          styles.itemText,
                          h === hour && styles.itemTextSelected,
                        ]}
                      >
                        {formatHour(h)}
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>
            <View style={styles.pickerColumn}>
              <Text style={styles.columnLabel}>{t("datePicker.minute")}</Text>
              <View style={{ height: PICKER_HEIGHT, position: "relative" as const }}>
                <View style={styles.highlight} pointerEvents="none" />
                <FlatList
                  ref={minuteListRef}
                  data={MINUTES}
                  initialScrollIndex={minute / 5}
                  keyExtractor={(m) => m.toString()}
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={Platform.OS === "android"}
                  bounces={false}
                  overScrollMode="never"
                  snapToOffsets={MINUTE_SNAP_OFFSETS}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentContainerStyle={styles.listContent}
                  getItemLayout={getItemLayout}
                  onMomentumScrollEnd={(e) => handleScrollEnd("minute", e)}
                  onScrollEndDrag={(e) => handleScrollEnd("minute", e)}
                  renderItem={({ item: m }) => (
                    <View style={styles.item}>
                      <Text
                        style={[
                          styles.itemText,
                          m === minute && styles.itemTextSelected,
                        ]}
                      >
                        {formatMinute(m)}
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <AnimatedCancelButton onPress={onClose} flex />
            <AnimatedSaveButton onPress={handleConfirm} flex />
          </View>
        </View>
      </View>
    </Modal>
  );
}
