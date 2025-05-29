import { BrowserWindow } from "electron";
import { env } from "../config";

export function createAuthWindow(
  existingWindow: BrowserWindow | null,
  parentWindow: BrowserWindow | null,
  themeColor: ElectronThemeColor,
) {
  if (existingWindow && !existingWindow.isDestroyed()) {
    if (!existingWindow.isVisible()) {
      existingWindow.show();
    }
    existingWindow.focus();
    return existingWindow;
  }

  const newWindow = new BrowserWindow({
    parent: parentWindow || undefined,
    title: "Settings",
    frame: false,
    modal: true,
    movable: false,
    fullscreenable: false,
    maximizable: false,
    show: false,
    height: 670,
    width: 480,
    resizable: false,
    backgroundColor: themeColor.main,
    webPreferences: {
      preload: env.preload,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  newWindow.setTitle("Authentication");

  newWindow.once("ready-to-show", () => {
    newWindow.show();
    newWindow.focus();
  });

  if (env.viteDevServerUrl && env.nodeEnv === "development") {
    newWindow.loadURL(`${env.viteDevServerUrl}/#/auth`);
  } else {
    newWindow.loadFile(env.indexPath);
  }

  return newWindow;
}
