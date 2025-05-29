import { ipcMain } from "electron";
import type { BrowserWindow } from "electron";

export function setupIpcHandlers(mainWindow?: BrowserWindow) {
	if (!mainWindow) {
		console.error("Main window is not defined");
		return;
	}
	ipcMain.on("user:logged-in", () => {
		if (mainWindow) {
			mainWindow.focus();
			mainWindow.webContents.send("user:update-from-offline");
		}
	});
}
