import { useEffect, useRef } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  keyboardAvoiding?: boolean;
  maxHeight?: number;
  paddingHorizontal?: number;
}

export function BottomSheetModal({
  visible,
  onClose,
  children,
  keyboardAvoiding = true,
  maxHeight = Math.min(Dimensions.get("window").height * 0.88, 700),
  paddingHorizontal,
}: BottomSheetModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardJustHiddenAt = useRef(0);
  const horizontalPadding =
    paddingHorizontal ?? Math.max(24, insets.left, insets.right);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      keyboardJustHiddenAt.current = Date.now();
    });
    return () => sub.remove();
  }, []);

  const handleBackdropPress = () => {
    if (Date.now() - keyboardJustHiddenAt.current < 250) return;
    onClose();
  };

  const overlayStyle = {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)" as const,
    justifyContent: "flex-end" as const,
  };

  const sheetStyle = {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 0,
    height: maxHeight,
    maxHeight,
    flexShrink: 1,
    paddingHorizontal: horizontalPadding,
  };


  const handleStyle = {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center" as const,
    marginBottom: 20,
  };

  const keyboardView = {
    flex: 1,
    width: "100%" as const,
    justifyContent: "flex-end" as const,
  };

  const sheetContent = (
    <Pressable style={sheetStyle} onPress={(e) => e.stopPropagation()}>
      <View style={handleStyle} />
      {children}
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={overlayStyle}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleBackdropPress}
        />
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            behavior="padding"
            style={keyboardView}
          >
            {sheetContent}
          </KeyboardAvoidingView>
        ) : (
          sheetContent
        )}
      </View>
    </Modal>
  );
}
