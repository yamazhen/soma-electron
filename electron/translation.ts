import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { getSetting, updateSetting } from "./userSettings";

const localesPath = path.resolve(app.getAppPath(), "src/i18n/locales");

export function loadLanguagePreference(): string {
  const defaultLocale = app.getLocale() || "en-US";
  const language = getSetting("language", defaultLocale);

  if (!fs.existsSync(path.join(localesPath, `${language}.json`))) {
    return "en-US";
  }
  return language;
}

export function getTranslation(language: string): any {
  try {
    const translationsPath = path.join(localesPath, `${language}.json`);
    return JSON.parse(fs.readFileSync(translationsPath, "utf-8"));
  } catch (error) {
    console.error("Error loading translation:", error);
    return {};
  }
}

export function getAvailableLanguage(): string[] {
  try {
    const files = fs.readdirSync(localesPath);
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));
  } catch (error) {
    console.error("Error loading available languages:", error);
    return ["en-US"];
  }
}

export function changeLanguage(
  language: string,
  mainWindow: BrowserWindow | null,
) {
  updateSetting("language", language);
  if (mainWindow) {
    mainWindow.webContents.send("language-changed", language);
  }
}

export function setupLanguageListeners(mainWindow: BrowserWindow) {
  // use loadLanguagePreference
  // when debug just set to the language you want
  const currentLanguage = loadLanguagePreference();
  ipcMain.handle("get-language", () => {
    return loadLanguagePreference();
  });
  ipcMain.handle("set-language", (_event: any, language: string) => {
    changeLanguage(language, mainWindow);
    return currentLanguage;
  });
  ipcMain.handle("get-translations", (_event: any, language: string) => {
    return getTranslation(language);
  });
  ipcMain.handle("get-available-languages", () => {
    return getAvailableLanguage();
  });
}
