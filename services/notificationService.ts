import Constants from "expo-constants";
import { Platform } from "react-native";
import type { TodoModel } from "../types/todo";
import { isReminderPast } from "../utils/dateUtils";

const CHANNEL_ID = "reminders";

function getNotificationId(todoId: string): string {
  return `todo-${todoId}`;
}

function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

async function getNotifications() {
  if (isExpoGo()) return null;
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

export async function setup(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowList: true,
      shouldShowBanner: true,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Hatırlatıcılar",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#22C55E",
    });

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permission not granted");
    }
  }
}

export async function scheduleTodoReminder(
  todoId: string,
  text: string,
  date: Date,
): Promise<void> {
  if (isReminderPast(date)) return;

  const Notifications = await getNotifications();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    identifier: getNotificationId(todoId),
    content: {
      title: "Hatırlatıcı",
      body: text,
      data: { todoId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

export async function cancelTodoReminder(todoId: string): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await Notifications.cancelScheduledNotificationAsync(
    getNotificationId(todoId),
  );
}

export async function rescheduleAllReminders(
  todos: TodoModel[],
): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  const now = Date.now();
  for (const todo of todos) {
    if (todo.completed || !todo.reminderAt) continue;
    const date = new Date(todo.reminderAt);
    if (date.getTime() <= now) continue;
    await cancelTodoReminder(todo.id);
    await scheduleTodoReminder(todo.id, todo.text, date);
  }
}
