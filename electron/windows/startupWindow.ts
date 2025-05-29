import { BrowserWindow } from "electron";
import { env } from "../config/config";

export function createStartupWindow(
	existingWindow: BrowserWindow | null,
	themeColor: ElectronThemeColor,
) {
	if (existingWindow && !existingWindow.isDestroyed()) {
		if (!existingWindow.isVisible()) {
			existingWindow.show();
		}
		existingWindow.focus();
		return existingWindow;
	}

	const startupWin = new BrowserWindow({
		width: 400,
		height: 400,
		resizable: false,
		movable: true,
		maximizable: false,
		modal: true,
		frame: false,
		fullscreenable: false,
		backgroundColor: themeColor.main,
		show: false,
		webPreferences: {
			preload: env.preload,
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	startupWin.setTitle("Soma");

	startupWin.once("ready-to-show", () => {
		startupWin.show();
		startupWin.focus();
	});

	if (env.viteDevServerUrl && env.nodeEnv === "development") {
		startupWin.loadURL(`${env.viteDevServerUrl}/#/settings`);
	} else {
		startupWin.loadFile(env.indexPath);
	}

	return startupWin;
}
