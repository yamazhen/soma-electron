import { app } from "electron/main";
import type { BrowserWindow } from "electron/main";
import path from "node:path";

export class LanguageService {
	private localesPath: string;
	private mainWindow: BrowserWindow | null = null;

	constructor() {
		this.localesPath = path.resolve(app.getAppPath(), "src/i18n/locales");
	}
}
