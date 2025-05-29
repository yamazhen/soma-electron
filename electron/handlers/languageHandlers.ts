import { ipcMain } from "electron";
import type { BrowserWindow } from "electron";
import { languageService } from "../service";

export function setupLanguageHandlers(mainWindow: BrowserWindow) {
	languageService.setMainWindow(mainWindow);

	const currentLanguage = languageService.getCurrentLanguage();

	ipcMain.handle("get-language", () => {
		return languageService.getCurrentLanguage();
	});

	ipcMain.handle("set-language", (_event: any, language: string) => {
		languageService.changeLanguage(language);
		return currentLanguage;
	});

	ipcMain.handle("get-translations", (_event: any, language: string) => {
		return languageService.getTranslation(language);
	});

	ipcMain.handle("get-available-languages", () => {
		return languageService.getAvailableLanguages();
	});
}
