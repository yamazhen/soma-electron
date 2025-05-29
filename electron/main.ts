import { app } from "electron";
import "./config";
import { setupFileSystemListeners } from "./fileSystem";
import { setupLanguageListeners } from "./translation";
import { initDatabase, resetDatabase } from "./database/database";
import { setupCardHandlers } from "./card";
import { createMainWindow } from "./windows/mainWindow";
import { windowManager } from "./windows/windowManager";
import { themeManager } from "./themeManager";
import { setupSecureStoreHandlers } from "./ipc/secureStoreHandlers";
import { setupAppHandlers } from "./ipc/appHandlers";
import { setupIpcHandlers } from "./ipc/ipcHandlers";
import { setupApiHandlers } from "./ipc/apiHandlers";
import { setupWindowHandlers } from "./ipc/windowHandlers";
import { setupUserHandlers } from "./ipc/userHandlers";
import { registerQuizHandlers } from "./ipc/quizHandlers";
import { setupOAuthHandlers } from "./ipc/oauthHandlers";

app.setAsDefaultProtocolClient("soma");

async function init() {
	const mainWindow = createMainWindow(null, themeManager.getCurrentTheme());
	windowManager.setWindow("main", mainWindow);
	try {
		await initDatabase();
	} catch (e) {
		console.error("Failed to initialize database:", e);
	}
}

app.whenReady().then(async () => {
	await Promise.all([
		setupAppHandlers(app),
		setupCardHandlers(),
		setupSecureStoreHandlers(),
		setupApiHandlers(),
		setupWindowHandlers(),
		setupUserHandlers(),
		registerQuizHandlers(),
		setupOAuthHandlers(),
	]);

	await init();
	const mainWindow = windowManager.getWindow("main");
	if (!mainWindow) {
		console.error("Main window not defined");
		return;
	}

	await Promise.all([
		themeManager.setupListeners(),
		setupIpcHandlers(mainWindow),
		setupLanguageListeners(mainWindow),
		setupFileSystemListeners(mainWindow),
	]);
});
