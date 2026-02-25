import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
// Force HMR refresh
import { th } from "@/i18n/th";
import { en } from "@/i18n/en";

type Locale = "th" | "en";

const dictionaries: Record<Locale, Record<string, string>> = { th, en };

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return (localStorage.getItem("locale") as Locale) || "th";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }, []);

  const t = useCallback(
    (key: string) => dictionaries[locale][key] || key,
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

const fallbackContext: LanguageContextType = {
  locale: "th",
  setLocale: () => {},
  t: (key: string) => dictionaries["th"][key] || key,
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx ?? fallbackContext;
}
