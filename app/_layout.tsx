import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { loadStoredLocale } from "../i18n";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  rescheduleAllReminders,
  setup as setupNotifications,
} from "../services/notificationService";
import { useTodoStore } from "../store/todoStore";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const router = useRouter();

  useEffect(() => {
    setupNotifications();
  }, []);

  useEffect(() => {
    (async () => {
      await loadStoredLocale();
      await SplashScreen.hideAsync();
    })();
  }, []);

  useEffect(() => {
    const handleNotificationResponse = (
      response: Notifications.NotificationResponse,
    ) => {
      if (response.notification.request.content.data?.todoId) {
        router.replace("/(tabs)");
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification) {
        handleNotificationResponse(response);
      }
    });

    const sub = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const todos = useTodoStore.getState().todos;
      rescheduleAllReminders(todos);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const { colorScheme } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
