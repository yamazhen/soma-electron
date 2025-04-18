import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";

let currentLanguage = "en-US";

const userDataPath = app.getPath("userData");
const prefsPath = path.join(userDataPath, "appConfig.json");
const localesPath = path.resolve(app.getAppPath(), "src/i18n/locales");

export function loadLanguagePreference(): string {
  try {
    if (fs.existsSync(prefsPath)) {
      const data = JSON.parse(fs.readFileSync(prefsPath, "utf-8"));
      let language = data.language || app.getLocale() || "en-US";

      if (!fs.existsSync(path.join(localesPath, `${language}.json`))) {
        language = "en-US";
      }

      return language;
    } else {
      return app.getLocale() || "en-US";
    }
  } catch (error) {
    return "en-US";
  }
}

export function saveLanguagePreference(language: string): void {
  try {
    fs.writeFileSync(prefsPath, JSON.stringify({ language }));
  } catch (error) {
    console.error("Error saving language preference:", error);
  }
}

export function getTranslation(language: string): any {
  try {
    const translationsPath = path.resolve(
      app.getAppPath(),
      "src/i18n/locales",
      `${language}.json`,
    );
    return JSON.parse(fs.readFileSync(translationsPath, "utf-8"));
  } catch (error) {
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
    return ["en-US"];
  }
}

export function changeLanguage(
  language: string,
  mainWindow: BrowserWindow | null,
) {
  currentLanguage = language;
  saveLanguagePreference(language);

  if (mainWindow) {
    mainWindow.webContents.send("language-changed", language);
  }
}

export function setupLanguageListeners(mainWindow: BrowserWindow) {
  // use loadLanguagePreference
  // when debug just set to the language you want
  currentLanguage = loadLanguagePreference();
  ipcMain.handle("get-language", () => {
    return currentLanguage;
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
