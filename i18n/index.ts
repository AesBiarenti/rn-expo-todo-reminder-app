import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tr from "../locales/tr.json";
import en from "../locales/en.json";

export const LOCALE_KEY = "app-locale";

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

const deviceLang = Localization.getLocales()[0]?.languageCode ?? "en";
const initialLng = deviceLang.startsWith("tr") ? "tr" : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (l) => {
  AsyncStorage.setItem(LOCALE_KEY, l).catch(() => {});
});

export async function loadStoredLocale(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_KEY);
    if (stored && (stored === "tr" || stored === "en") && stored !== i18n.language) {
      await i18n.changeLanguage(stored);
    }
  } catch {
    // ignore
  }
}

export default i18n;
