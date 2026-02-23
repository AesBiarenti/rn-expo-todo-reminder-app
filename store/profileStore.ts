import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEY_NOTIFICATIONS = "profile-notifications-enabled";

export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY_NOTIFICATIONS);
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
}
