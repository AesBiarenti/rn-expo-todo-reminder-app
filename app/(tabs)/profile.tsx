import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTodoStore } from "../../store/todoStore";
import { COLORS } from "../../constants/theme";

const MENU_ITEMS = [
  { icon: "notifications-outline", label: "Notifications", key: "notifications" },
  { icon: "moon-outline", label: "Dark mode", key: "theme" },
  { icon: "language-outline", label: "Language", key: "language" },
  { icon: "help-circle-outline", label: "Help", key: "help" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const todos = useTodoStore((s) => s.todos);
  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={styles.header}
      >
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={styles.avatarWrap}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>K</Text>
          </View>
        </Animated.View>
        <Animated.Text
          entering={FadeInUp.delay(300).duration(400)}
          style={styles.name}
        >
          Kullanıcı
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(350).duration(400)}
          style={styles.email}
        >
          user@example.com
        </Animated.Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        style={styles.statsRow}
      >
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>Tamamlanan</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(500).duration(400)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Ayarlar</Text>
        {MENU_ITEMS.map((item, index) => (
          <Animated.View
            key={item.key}
            entering={FadeInDown.delay(550 + index * 50).duration(300)}
          >
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={COLORS.textMuted}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textMuted}
              />
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarWrap: {
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.bg,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  email: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.accent,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 14,
  },
});
