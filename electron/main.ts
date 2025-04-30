import { app, BrowserWindow, shell, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { setupFileSystemListeners } from "./fileSystem";
import { setupLanguageListeners } from "./translation";
import { closeDatabase, initDatabase } from "./database/database";
import { setupQuizHandlers } from "./quiz";
import { setupCardHandlers } from "./card";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
    frame: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 13 },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (win === null) return;
    if (url !== win.webContents.getURL()) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL && process.env.NODE_ENV === "development") {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("open-external-link", async (_event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (error) {
    console.error("Failed to open external link:", error);
    return false;
  }
});

app.whenReady().then(async () => {
  createWindow();
  const dbConnection = await initDatabase();
  if (!dbConnection) console.error("Failed to initialize database connection.");
  setupLanguageListeners(win!);
  await setupFileSystemListeners(win!);
  setupQuizHandlers();
  setupCardHandlers();
});

app.on("will-quit", () => {
  closeDatabase();
});
