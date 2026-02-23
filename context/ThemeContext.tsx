import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from "../constants/theme";

export type ThemePreference = "light" | "dark" | "system";

const THEME_KEY = "profile-theme";

interface ThemeContextValue {
  colors: ThemeColors;
  colorScheme: "light" | "dark";
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") {
        setThemePreferenceState(v);
      }
    });
  }, []);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    await AsyncStorage.setItem(THEME_KEY, pref);
  }, []);

  const colorScheme: "light" | "dark" =
    themePreference === "system"
      ? systemScheme ?? "dark"
      : themePreference;

  const colors = useMemo(
    () => (colorScheme === "light" ? LIGHT_COLORS : DARK_COLORS),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colors,
      colorScheme,
      themePreference,
      setThemePreference,
    }),
    [colors, colorScheme, themePreference, setThemePreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
