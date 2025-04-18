import { useCallback, useEffect, useState } from "react";

interface Translations {
  [key: string]: any;
}

export const useLanguageState = () => {
  const [currentLang, setCurrentLang] = useState<string>("en-US");
  const [translations, setTranslations] = useState<Translations>({});
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([
    "en-US",
  ]);
  const [languageLoading, setLanguageLoading] = useState<boolean>(true);

  useEffect(() => {
    const initLanguage = async () => {
      try {
        setLanguageLoading(true);

        const language = await window.ipcRenderer.getLanguage();
        setCurrentLang(language);
        console.log("Current language:", language);

        const availableLangs = await window.ipcRenderer.getAvailableLanguages();
        setAvailableLanguages(availableLangs);

        const data = await window.ipcRenderer.getTranslations(language);
        setTranslations(data);
      } catch (error) {
        console.error("Error initializing language:", error);
      } finally {
        setLanguageLoading(false);
      }
    };
    initLanguage();
    const unsubscribe = window.ipcRenderer.onLanguageChanged(
      (language: string) => {
        setLanguageLoading(true);
        setCurrentLang(language);
        window.ipcRenderer
          .getTranslations(language)
          .then((data: Translations) => {
            setTranslations(data);
            setLanguageLoading(false);
          })
          .catch((err: Error) => {
            console.error(`Failed to load translations for ${language}:`, err);
            setLanguageLoading(false);
          });
      },
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const changeLanguage = useCallback(async (language: string) => {
    try {
      await window.ipcRenderer.setLanguage(language);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  }, []);

  const getMessage = useCallback(
    (messageKey: string): string => {
      if (!messageKey || languageLoading) return messageKey;
      const keys = messageKey.split(".");
      let result: any = translations;

      for (const key of keys) {
        if (!result || typeof result !== "object") {
          return messageKey;
        }
        result = result[key];
      }

      return typeof result === "string" ? result : messageKey;
    },
    [translations, languageLoading],
  );

  return {
    currentLang,
    translations,
    availableLanguages,
    languageLoading,
    changeLanguage,
    getMessage,
  };
};
