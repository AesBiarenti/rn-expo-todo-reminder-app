import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const KEY_USER_NAME = "profile-user-name";
const KEY_USER_EMAIL = "profile-user-email";
const KEY_NOTIFICATIONS = "profile-notifications-enabled";

export function useProfileSettings() {
  const [userName, setUserNameState] = useState<string>("");
  const [userEmail, setUserEmailState] = useState<string>("");
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [name, email, notif] = await Promise.all([
          AsyncStorage.getItem(KEY_USER_NAME),
          AsyncStorage.getItem(KEY_USER_EMAIL),
          AsyncStorage.getItem(KEY_NOTIFICATIONS),
        ]);
        if (name !== null) setUserNameState(name);
        if (email !== null) setUserEmailState(email);
        if (notif !== null) setNotificationsEnabledState(notif === "true");
      } catch {
        // ignore
      }
      setLoaded(true);
    })();
  }, []);

  const setUserName = useCallback(async (name: string) => {
    setUserNameState(name);
    try {
      await AsyncStorage.setItem(KEY_USER_NAME, name);
    } catch {
      // ignore
    }
  }, []);

  const setUserEmail = useCallback(async (email: string) => {
    setUserEmailState(email);
    try {
      await AsyncStorage.setItem(KEY_USER_EMAIL, email);
    } catch {
      // ignore
    }
  }, []);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    try {
      await AsyncStorage.setItem(KEY_NOTIFICATIONS, String(enabled));
    } catch {
      // ignore
    }
  }, []);

  return {
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    notificationsEnabled,
    setNotificationsEnabled,
    loaded,
  };
}
