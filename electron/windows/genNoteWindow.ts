import { BrowserWindow } from "electron";
import { env } from "../config/config";

export function createGenNoteWindow(
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
    width: 400,
    height: 500,
    resizable: false,
    movable: true,
    modal: true,
    maximizable: false,
    frame: false,
    alwaysOnTop: true,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: themeColor.search,
    webPreferences: {
      preload: env.preload,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  newWindow.setTitle("Search Files");

  newWindow.once("ready-to-show", () => {
    newWindow.show();
    newWindow.focus();
  });

  if (env.viteDevServerUrl && env.nodeEnv === "development") {
    newWindow.loadURL(`${env.viteDevServerUrl}/#/generate-note`);
  } else {
    newWindow.loadFile(env.indexPath);
  }

  return newWindow;
}
