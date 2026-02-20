import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
  rescheduleAllReminders,
  setup as setupNotifications,
} from "../services/notificationService";
import { useTodoStore } from "../store/todoStore";

export default function RootLayout() {
  const todos = useTodoStore((s) => s.todos);
  const hasRescheduled = useRef(false);

  useEffect(() => {
    setupNotifications();
  }, []);

  useEffect(() => {
    if (hasRescheduled.current) return;
    const timer = setTimeout(() => {
      rescheduleAllReminders(todos);
      hasRescheduled.current = true;
    }, 800);
    return () => clearTimeout(timer);
  }, [todos]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
