import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  rescheduleAllReminders,
  setup as setupNotifications,
} from "../services/notificationService";
import { useTodoStore } from "../store/todoStore";

export default function RootLayout() {
  const router = useRouter();
  const todos = useTodoStore((s) => s.todos);
  const hasRescheduled = useRef(false);

  useEffect(() => {
    setupNotifications();
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
    if (hasRescheduled.current) return;
    const timer = setTimeout(() => {
      rescheduleAllReminders(todos);
      hasRescheduled.current = true;
    }, 800);
    return () => clearTimeout(timer);
  }, [todos]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
