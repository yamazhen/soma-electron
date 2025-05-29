import { app } from "electron";
import type { BrowserWindow } from "electron";
import { setupAppHandlers } from "./appHandlers";
import { setupSecureStoreHandlers } from "./secureStoreHandlers";
import { setupApiHandlers } from "./apiHandlers";
import { setupWindowHandlers } from "./windowHandlers";
import { setupUserHandlers } from "./userHandlers";
import { registerQuizHandlers } from "./quizHandlers";
import { setupOAuthHandlers } from "./oauthHandlers";
import { setupIpcHandlers } from "./ipcHandlers";
import { setupFileSystemHandlers } from "./fileSystemHandlers";
import { setupLanguageHandlers } from "./languageHandlers";
import { setupDeckHandlers } from "./deckHandlers";
import { setupLinkHandlers } from "./linkHandlers";

export async function setupAllHandlers(
	mainWindow: BrowserWindow,
): Promise<void> {
	await Promise.all([
		setupAppHandlers(app),
		setupDeckHandlers(),
		setupSecureStoreHandlers(),
		setupApiHandlers(),
		setupWindowHandlers(),
		setupUserHandlers(),
		registerQuizHandlers(),
		setupOAuthHandlers(),
		setupLinkHandlers(),
	]);

	await Promise.all([
		setupIpcHandlers(mainWindow),
		setupFileSystemHandlers(mainWindow),
		setupLanguageHandlers(mainWindow),
	]);
}
