import { app } from "electron";
import fs from "fs";
import path from "path";

export const settingsPath = path.join(app.getPath("userData"), "settings.json");

export function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return { theme: "system", language: "en-US" };
}

export function saveSettings(settings: any) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
}

export function updateSetting(key: any, value: any) {
  const settings = loadSettings();
  settings[key] = value;
  return saveSettings(settings);
}

export function getSetting(key: any, defaultValue: any) {
  const settings = loadSettings();
  return settings[key] !== undefined ? settings[key] : defaultValue;
}
