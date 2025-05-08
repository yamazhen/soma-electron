import { app, BrowserWindow, shell, ipcMain } from "electron";
import "./config";
import { setupFileSystemListeners } from "./fileSystem";
import { setupLanguageListeners } from "./translation";
import { closeDatabase, initDatabase } from "./database/database";
import { setupQuizHandlers } from "./quiz";
import { setupCardHandlers } from "./card";
import { createMainWindow } from "./windows/mainWindow";
import { createSearchWindow } from "./windows/searchWindow";
import { windowManager } from "./windows/windowManager";
import { themeManager } from "./themeManager";
import { createSettingsWindow } from "./windows/settingsWindow";

async function init() {
  const mainWindow = createMainWindow(null, themeManager.getCurrentTheme());
  windowManager.setWindow("main", mainWindow);

  try {
    await initDatabase();
  } catch (e) {
    console.error("Failed to initialize database:", e);
  }

  if (mainWindow) {
    setupLanguageListeners(mainWindow);
    await setupFileSystemListeners(mainWindow);
    setupQuizHandlers();
    setupCardHandlers();
    themeManager.setupListeners();
  }
}

function setupIpcHandlers() {
  ipcMain.handle("open-external-link", async (_event, url) => {
    try {
      await shell.openExternal(url);
      return true;
    } catch (error) {
      console.error("Failed to open external link:", error);
      return false;
    }
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

  ipcMain.handle("close-settings", () => {
    windowManager.getWindow("settings")?.hide();
  });

  ipcMain.handle("hide-search-popup", () => {
    windowManager.getWindow("search")?.hide();
  });

  ipcMain.handle("expand-search-popup", (_event, expanded) => {
    const searchWindow = windowManager.getWindow("search");
    if (searchWindow) {
      searchWindow.setSize(600, expanded ? 400 : 50);
    }
  });
}

function setupAppHandlers() {
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const mainWindow = createMainWindow(null, themeManager.getCurrentTheme());
      windowManager.setWindow("main", mainWindow);
    }
  });

  app.on("will-quit", () => {
    closeDatabase();
  });
}

app.whenReady().then(async () => {
  setupAppHandlers();
  setupIpcHandlers();
  await init();
});
