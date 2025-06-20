import { BrowserWindow, ipcMain, shell } from "electron";
import { themeManager } from "../config/themeManager";
import { createAuthWindow } from "../windows/authWindow";
import { createSearchWindow } from "../windows/searchWindow";
import { createSettingsWindow } from "../windows/settingsWindow";
import { windowManager } from "../windows/windowManager";
import { createGenNoteWindow } from "../windows/genNoteWindow";

export function setupWindowHandlers() {
  ipcMain.handle("open-external-link", async (_event, url) => {
    try {
      await shell.openExternal(url);
      return true;
    } catch (error) {
      console.error("Failed to open external link:", error);
      return false;
    }
  });

  ipcMain.handle("open-auth-win", () => {
    const authWindow = windowManager.getWindow("auth");
    const mainWindow = windowManager.getWindow("main");

    const newAuthWindow = createAuthWindow(
      authWindow,
      mainWindow,
      themeManager.getCurrentTheme(),
    );

    windowManager.setWindow("auth", newAuthWindow);
  });

  ipcMain.handle("open-settings", () => {
    const settingsWindow = windowManager.getWindow("settings");

    const newSettingWin = createSettingsWindow(
      settingsWindow,
      themeManager.getCurrentTheme(),
    );

    windowManager.setWindow("settings", newSettingWin);
  });

  ipcMain.handle("open-search-popup", () => {
    const mainWindow = windowManager.getWindow("main");
    const searchWindow = windowManager.getWindow("search");

    const newSearchWindow = createSearchWindow(
      searchWindow,
      mainWindow,
      themeManager.getCurrentTheme(),
    );

    windowManager.setWindow("search", newSearchWindow);
  });

  ipcMain.handle("open-generate-note-popup", () => {
    const mainWindow = windowManager.getWindow("main");
    const generateNoteWindow = windowManager.getWindow("generateNote");

    const newGenNoteWindow = createGenNoteWindow(
      generateNoteWindow,
      mainWindow,
      themeManager.getCurrentTheme(),
    );

    windowManager.setWindow("generateNote", newGenNoteWindow);
  });

  ipcMain.handle("close-generate-note-popup", () => {
    windowManager.getWindow("generateNote")?.close();
  });

  ipcMain.handle("close-settings", () => {
    windowManager.getWindow("settings")?.close();
  });

  ipcMain.handle("close-auth-window", () => {
    windowManager.getWindow("auth")?.close();
  });

  ipcMain.handle("hide-search-popup", () => {
    windowManager.getWindow("search")?.hide();
  });

  ipcMain.handle("resize-auth-window", (event, height) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      const [width] = window.getSize();
      window.setSize(width, height, true);
    }
  });

  ipcMain.handle("expand-search-popup", (_event, expanded) => {
    const searchWindow = windowManager.getWindow("search");
    if (searchWindow) {
      searchWindow.setSize(600, expanded ? 400 : 50);
    }
  });
}
