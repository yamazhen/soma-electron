import { closeDatabase } from "../database/database";
import { BrowserWindow } from "electron";
import { themeManager } from "../config/themeManager";
import { createMainWindow } from "../windows/mainWindow";
import { windowManager } from "../windows/windowManager";

export function setupAppHandlers(electronApp: Electron.App): Promise<void> {
  return new Promise((resolve) => {
    electronApp.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        electronApp.quit();
      }
    });

    electronApp.on("open-url", (event, url) => {
      event.preventDefault();
      handleAuthUrl(url);
    });

    electronApp.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        const mainWindow = createMainWindow(
          null,
          themeManager.getCurrentTheme(),
        );
        windowManager.setWindow("main", mainWindow);
      }
    });

    electronApp.on("will-quit", () => {
      closeDatabase();
    });

    resolve();
  });
}

function handleAuthUrl(url: string) {
  if (!url || !url.startsWith("soma://auth/callback")) {
    console.warn("Invalid auth URL format:", url);
    return;
  }

  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    const mainWindow = windowManager.getWindow("main");
    const authWindow = windowManager.getWindow("auth");

    if (!mainWindow) {
      console.error("Main window not found");
      return;
    }

    const targetWindows = [mainWindow];
    if (authWindow) targetWindows.push(authWindow);

    if (searchParams.has("data")) {
      const dataStr = searchParams.get("data") || "{}";
      try {
        const data = JSON.parse(decodeURIComponent(dataStr));

        for (const window of targetWindows) {
          if (window.webContents.isLoading()) {
            window.webContents.once("did-finish-load", () => {
              window.webContents.send("auth-callback-success", data);
            });
          } else {
            window.webContents.send("auth-callback-success", data);
          }
        }
      } catch (jsonError) {
        console.error(
          "Error parsing JSON data:",
          jsonError,
          "Raw data:",
          dataStr,
        );
        for (const window of targetWindows) {
          window.webContents.send("auth-callback-error", "Invalid data format");
        }
      }
    } else if (searchParams.has("error")) {
      const error = searchParams.get("error");
      console.error("Auth callback error:", error);
      for (const window of targetWindows) {
        window.webContents.send("auth-callback-error", error);
      }
    } else {
      console.warn("Auth callback with no data or error parameters");
      for (const window of targetWindows) {
        window.webContents.send(
          "auth-callback-error",
          "No data or error in callback",
        );
      }
    }
  } catch (error) {
    console.error("Error handling auth URL:", error);
    const mainWindow = windowManager.getWindow("main");
    const authWindow = windowManager.getWindow("auth");

    if (mainWindow) {
      mainWindow.webContents.send("auth-callback-error", "Invalid URL format");
    }

    if (authWindow) {
      authWindow.webContents.send("auth-callback-error", "Invalid URL format");
    }
  }
}
