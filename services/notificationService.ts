import { Platform } from "react-native";
import i18n from "../i18n";
import { getNotificationsEnabled } from "../store/profileStore";
import type { TodoModel } from "../types/todo";
import { getNotificationDates } from "../utils/scheduleUtils";

const CHANNEL_ID = "reminders";
const MAX_SCHEDULED = 100;

function getNotificationId(todoId: string, index?: number): string {
  return index !== undefined ? `todo-${todoId}-${index}` : `todo-${todoId}`;
}

async function getNotifications() {
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

export async function setup(): Promise<void> {
  try {
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
      name: i18n.t("notifications.channelName"),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#22C55E",
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    return;
  }
  } catch {
    // expo-notifications not supported in Expo Go (SDK 53+)
  }
}

export async function cancelTodoReminders(todoId: string): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  const ids: string[] = [getNotificationId(todoId)];
  for (let i = 0; i < MAX_SCHEDULED; i++) {
    ids.push(getNotificationId(todoId, i));
  }
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}

export async function scheduleRemindersForTodo(
  todo: TodoModel,
): Promise<void> {
  if (
    todo.completed &&
    (todo.scheduleType === "one_time" || todo.scheduleType === "recurring")
  )
    return;
  if (!(await getNotificationsEnabled())) return;
  await cancelTodoReminders(todo.id);

  const Notifications = await getNotifications();
  if (!Notifications) return;

  const dates = getNotificationDates(todo, MAX_SCHEDULED);
  const now = Date.now();

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (date.getTime() <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: dates.length > 1 ? getNotificationId(todo.id, i) : getNotificationId(todo.id),
      content: {
        title: i18n.t("notifications.reminderTitle"),
        body: todo.text,
        data: { todoId: todo.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
      },
    });
  }
}

export async function cancelTodoReminder(todoId: string): Promise<void> {
  await cancelTodoReminders(todoId);
}

export async function cancelAllTodoReminders(
  todoIds: string[],
): Promise<void> {
  await Promise.all(todoIds.map((id) => cancelTodoReminders(id)));
}

export async function rescheduleAllReminders(
  todos: TodoModel[],
): Promise<void> {
  if (!(await getNotificationsEnabled())) return;
  for (const todo of todos) {
    const dates = getNotificationDates(todo, 1);
    if (dates.length === 0) continue;
    await scheduleRemindersForTodo(todo);
  }
}

export function setupNotificationListeners(
  onResponse: (todoId: string) => void,
): () => void {
  let sub: { remove: () => void } | null = null;
  getNotifications()
    .then((Notifications) => {
      if (!Notifications) return;

      Notifications.getLastNotificationResponseAsync().then((response) => {
        const data = response?.notification?.request?.content?.data as
          | { todoId?: string }
          | undefined;
        if (data?.todoId) onResponse(data.todoId);
      });

      sub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data as {
            todoId?: string;
          };
          if (data?.todoId) onResponse(data.todoId);
        },
      );
    })
    .catch(() => {});

  return () => {
    sub?.remove();
  };
}
