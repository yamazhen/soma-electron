import { BrowserWindow } from "electron";
import { env } from "../config/config";
export function createSettingsWindow(
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

	const newSettingWin = new BrowserWindow({
		title: "Settings",
		frame: false,
		modal: true,
		movable: true,
		fullscreenable: false,
		maximizable: false,
		show: false,
		minHeight: 300,
		minWidth: 300,
		height: 600,
		width: 800,
		backgroundColor: themeColor.main,
		webPreferences: {
			preload: env.preload,
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	newSettingWin.setTitle("Settings");

	newSettingWin.once("ready-to-show", () => {
		newSettingWin.show();
		newSettingWin.focus();
	});

	if (env.viteDevServerUrl && env.nodeEnv === "development") {
		newSettingWin.loadURL(`${env.viteDevServerUrl}/#/settings`);
	} else {
		newSettingWin.loadFile(env.indexPath);
	}

	return newSettingWin;
}
