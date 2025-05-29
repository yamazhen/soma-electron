import { BrowserWindow } from "electron";
import { env } from "../config/config";

export function createSearchWindow(
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

	const searchWin = new BrowserWindow({
		parent: parentWindow || undefined,
		width: 600,
		height: 60,
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

	searchWin.setTitle("Search Files");

	searchWin.once("ready-to-show", () => {
		searchWin.show();
		searchWin.focus();
		searchWin.webContents.send("search-focus-input");
	});

	searchWin.on("blur", () => {
		if (!searchWin.webContents.isDevToolsOpened()) {
			searchWin.hide();
		}
	});

	if (env.viteDevServerUrl && env.nodeEnv === "development") {
		searchWin.loadURL(`${env.viteDevServerUrl}/#/search`);
	} else {
		searchWin.loadFile(env.indexPath);
	}

	return searchWin;
}
