import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { AnimatedCancelButton } from "../../components/ui/AnimatedCancelButton";
import { AnimatedPressable } from "../../components/ui/AnimatedPressable";
import { MenuItem } from "../../components/ui/MenuItem";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  cancelAllTodoReminders,
  rescheduleAllReminders,
} from "../../services/notificationService";
import { useTodoStore } from "../../store/todoStore";
import { useProfileSettings } from "../../features/profile/hooks/useProfileSettings";
import { useTheme } from "../../context/ThemeContext";

const MENU_KEYS = [
  { icon: "notifications-outline", labelKey: "profile.menuItems.notifications", key: "notifications", hasSwitch: true },
  { icon: "moon-outline", labelKey: "profile.menuItems.darkMode", key: "theme", hasSwitch: false },
  { icon: "language-outline", labelKey: "profile.menuItems.language", key: "language", hasSwitch: false },
  { icon: "help-circle-outline", labelKey: "profile.menuItems.help", key: "help", hasSwitch: false },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, themePreference, setThemePreference } = useTheme();
  const insets = useSafeAreaInsets();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  const todos = useTodoStore((s) => s.todos);
  const clearCompleted = useTodoStore((s) => s.clearCompleted);

  const { notificationsEnabled, setNotificationsEnabled } = useProfileSettings();

  const completedCount = todos.filter((todo) => todo.completed).length;

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (!value) {
      await cancelAllTodoReminders(todos.map((todo) => todo.id));
    } else {
      await rescheduleAllReminders(todos);
    }
  };

  const handleClearCompleted = () => {
    if (completedCount === 0) return;
    Alert.alert(
      t("profile.clearCompleted"),
      t("profile.clearCompletedConfirm", { count: completedCount }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            clearCompleted();
          },
        },
      ],
    );
  };

  const handleMenuPress = (key: string) => {
    if (key === "language") setLanguageModalVisible(true);
    if (key === "theme") setThemeModalVisible(true);
    if (key === "help") setHelpModalVisible(true);
  };

  const themeLabel =
    themePreference === "system"
      ? t("profile.themeSystem")
      : themePreference === "light"
        ? t("profile.themeLight")
        : t("profile.themeDark");

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        pageTitle: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
          paddingHorizontal: Math.max(24, insets.left),
          paddingTop: 16,
          paddingBottom: 24,
        },
        section: {
          paddingHorizontal: Math.max(24, insets.left, insets.right),
          marginBottom: 24,
        },
        sectionTitle: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textMuted,
          marginBottom: 12,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        menuItem: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          padding: 16,
          borderRadius: 16,
          marginBottom: 8,
        },
        menuItemPressed: { opacity: 0.7 },
        menuItemDisabled: { opacity: 0.6 },
        menuItemContent: {
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginLeft: 14,
          paddingRight: 8,
        },
        menuLabel: {
          fontSize: 16,
          color: colors.text,
          flex: 1,
          minWidth: 0,
        },
        menuLabelDisabled: { color: colors.textMuted },
        menuSubtext: {
          fontSize: 14,
          color: colors.textMuted,
          flexShrink: 0,
          minWidth: 56,
          marginLeft: 8,
        },
        badge: { backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
        badgeText: { fontSize: 12, fontWeight: "600", color: colors.bg },
        modalOverlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 24,
        },
        modalContent: { backgroundColor: colors.surface, borderRadius: 20, padding: 24 },
        helpModalContent: { maxHeight: "80%" },
        modalTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 16,
          textAlign: "center",
        },
        aboutRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        aboutLabel: { fontSize: 14, color: colors.textMuted },
        aboutValue: { fontSize: 14, fontWeight: "600", color: colors.text },
        tipsTitle: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 12 },
        tipText: { fontSize: 14, color: colors.textMuted, marginBottom: 8, lineHeight: 22 },
        langOption: {
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 16,
          backgroundColor: colors.surfaceHover,
          marginBottom: 8,
        },
        langOptionActive: {
          backgroundColor: colors.accentDim,
          borderWidth: 1,
          borderColor: colors.accent,
        },
        langOptionText: { fontSize: 16, color: colors.text },
        langOptionTextActive: { color: colors.accent, fontWeight: "600" },
        modalCloseBtn: {
          marginTop: 12,
          paddingVertical: 12,
          paddingHorizontal: 20,
          alignItems: "center",
          alignSelf: "stretch",
          flexShrink: 0,
        },
        modalCloseText: {
          fontSize: 16,
          color: colors.textMuted,
          flexShrink: 0,
        },
      }),
    [colors, insets.left, insets.right],
  );

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.Text
        entering={FadeIn.duration(400).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
        style={styles.pageTitle}
      >
        {t("profile.settings")}
      </Animated.Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.settings")}</Text>
        {MENU_KEYS.map((item, index) => (
          <Animated.View
            key={item.key}
            entering={FadeIn.delay(index * 60).duration(380).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
          >
            <MenuItem
              icon={item.icon as keyof typeof Ionicons.glyphMap}
              label={item.labelKey}
              onPress={item.hasSwitch ? undefined : () => handleMenuPress(item.key)}
              rightContent={
                item.key === "notifications" ? (
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleNotificationsToggle}
                    trackColor={{ false: colors.border, true: colors.accentDim }}
                    thumbColor={notificationsEnabled ? colors.accent : colors.textMuted}
                  />
                ) : item.key === "theme" ? (
                  <Text style={styles.menuSubtext}>{themeLabel}</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                )
              }
            />
          </Animated.View>
        ))}
      </View>

      <Animated.View
        style={styles.section}
        entering={FadeIn.delay(240).duration(380).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
      >
        <Text style={styles.sectionTitle}>{t("profile.data")}</Text>
        <MenuItem
          icon="trash-outline"
          label="profile.clearCompleted"
          onPress={handleClearCompleted}
          disabled={completedCount === 0}
          rightContent={
            completedCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{completedCount}</Text>
              </View>
            ) : undefined
          }
        />
      </Animated.View>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLanguageModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t("profile.languageModal.title")}</Text>
            <AnimatedPressable
              style={[styles.langOption, i18n.language === "tr" && styles.langOptionActive]}
              onPress={() => {
                i18n.changeLanguage("tr");
                setLanguageModalVisible(false);
              }}
            >
              <Text style={[styles.langOptionText, i18n.language === "tr" && styles.langOptionTextActive]}>
                {t("profile.languageModal.turkish")}
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.langOption, i18n.language === "en" && styles.langOptionActive]}
              onPress={() => {
                i18n.changeLanguage("en");
                setLanguageModalVisible(false);
              }}
            >
              <Text style={[styles.langOptionText, i18n.language === "en" && styles.langOptionTextActive]}>
                {t("profile.languageModal.english")}
              </Text>
            </AnimatedPressable>
            <AnimatedCancelButton
              onPress={() => setLanguageModalVisible(false)}
              style={styles.modalCloseBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={helpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setHelpModalVisible(false)}
        >
          <Pressable style={[styles.modalContent, styles.helpModalContent]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t("profile.helpModal.title")}</Text>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>{t("profile.version")}</Text>
              <Text style={styles.aboutValue}>{appVersion}</Text>
            </View>
            <Text style={styles.tipsTitle}>{t("profile.tips")}</Text>
            <Text style={styles.tipText}>{t("profile.tip1")}</Text>
            <Text style={styles.tipText}>{t("profile.tip2")}</Text>
            <Text style={styles.tipText}>{t("profile.tip3")}</Text>
            <Text style={styles.tipText}>{t("profile.tip4")}</Text>
            <AnimatedCancelButton
              onPress={() => setHelpModalVisible(false)}
              style={styles.modalCloseBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setThemeModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t("profile.themeModal.title")}</Text>
            {(["system", "light", "dark"] as const).map((pref) => (
              <AnimatedPressable
                key={pref}
                style={[styles.langOption, themePreference === pref && styles.langOptionActive]}
                onPress={() => {
                  setThemePreference(pref);
                  setThemeModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.langOptionText,
                    themePreference === pref && styles.langOptionTextActive,
                  ]}
                >
                  {pref === "system"
                    ? t("profile.themeSystem")
                    : pref === "light"
                      ? t("profile.themeLight")
                      : t("profile.themeDark")}
                </Text>
              </AnimatedPressable>
            ))}
            <AnimatedCancelButton
              onPress={() => setThemeModalVisible(false)}
              style={styles.modalCloseBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
