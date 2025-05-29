import { app } from "electron";
import type { BrowserWindow } from "electron";
import path from "node:path";
import fs from "node:fs";
import { getSetting, updateSetting } from "../config/userSettings";

export class LanguageService {
	private localesPath: string;
	private mainWindow: BrowserWindow | null = null;

	constructor() {
		this.localesPath = path.resolve(app.getAppPath(), "src/i18n/locales");
	}

	setMainWindow(mainWindow: BrowserWindow) {
		this.mainWindow = mainWindow;
	}

	loadLanguagePreference(): string {
		const defaultLocale = app.getLocale() || "en-US";
		const language = getSetting("language", defaultLocale);

		if (!fs.existsSync(path.join(this.localesPath, `${language}.json`))) {
			return "en-US";
		}
		return language;
	}

	getTranslation(language: string): any {
		try {
			const translationsPath = path.join(this.localesPath, `${language}.json`);
			return JSON.parse(fs.readFileSync(translationsPath, "utf-8"));
		} catch (error) {
			console.error("Error loading translation:", error);
			return {};
		}
	}

	getAvailableLanguages(): string[] {
		try {
			const files = fs.readdirSync(this.localesPath);
			return files
				.filter((file) => file.endsWith(".json"))
				.map((file) => file.replace(".json", ""));
		} catch (error) {
			console.error("Error loading available languages:", error);
			return ["en-US"];
		}
	}

	changeLanguage(language: string): void {
		updateSetting("language", language);
		if (this.mainWindow) {
			this.mainWindow.webContents.send("language-changed", language);
		}
	}

	getCurrentLanguage(): string {
		return this.loadLanguagePreference();
	}
}
