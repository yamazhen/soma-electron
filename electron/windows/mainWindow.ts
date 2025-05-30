import { BrowserWindow, shell } from "electron";
import path from "node:path";
import { env } from "../config/config";

export function createMainWindow(
	existingWindow: BrowserWindow | null,
	themeColor: ElectronThemeColor,
) {
	if (existingWindow && !existingWindow.isDestroyed()) {
		existingWindow.focus();
		return existingWindow;
	}

	const mainWindow = new BrowserWindow({
		icon: path.join(env.public, "electron-vite.svg"),
		webPreferences: {
			preload: env.preload,
			contextIsolation: true,
			nodeIntegration: false,
		},
		frame: false,
		titleBarStyle: "hiddenInset",
		trafficLightPosition: { x: 20, y: 20 },
		backgroundColor: themeColor.main,
		minHeight: 480,
		minWidth: 480,
		show: false,
	});

	mainWindow.setTitle("Soma");

	mainWindow.on("enter-full-screen", () => {
		mainWindow.webContents.send("window-state-change", {
			isFullScreen: true,
			isMacOS: process.platform === "darwin",
		});
	});

	mainWindow.on("leave-full-screen", () => {
		mainWindow.webContents.send("window-state-change", {
			isFullScreen: false,
			isMacOS: process.platform === "darwin",
		});
	});

	// handle external links
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: "deny" };
	});
	// prevent navigation to external links from inside the app
	mainWindow.webContents.on("will-navigate", (e, url) => {
		if (mainWindow === null) return;
		if (url !== mainWindow.webContents.getURL()) {
			e.preventDefault();
			shell.openExternal(url);
		}
	});

	mainWindow.once("ready-to-show", () => {
		mainWindow.show();
		mainWindow.webContents.send("window-state-change", {
			isFullScreen: mainWindow.isFullScreen(),
			isMacOS: process.platform === "darwin",
		});
	});

	// load frontend
	if (env.viteDevServerUrl && env.nodeEnv === "development") {
		mainWindow.loadURL(env.viteDevServerUrl);
	} else {
		mainWindow.loadFile(env.indexPath);
	}
	return mainWindow;
}
