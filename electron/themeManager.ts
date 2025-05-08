import path from "path";
import fs from "fs";
import { getSetting, updateSetting } from "./userSettings";
import { BrowserWindow, ipcMain, nativeTheme } from "electron";
import { env } from "./config";

class ThemeManager {
  private themeColors: ElectronThemeColor = {
    main: "#ffffff",
    search: "#ffffff",
  };
  private themeCssPath: string | null = null;

  constructor() {
    this.loadThemeColor();
  }

  private getThemeCssPath() {
    if (!this.themeCssPath && env.appRoot) {
      this.themeCssPath = path.join(env.appRoot, "src", "styles", "theme.css");
    }
    return this.themeCssPath;
  }

  loadThemeColor() {
    try {
      const cssPath = this.getThemeCssPath();
      if (!cssPath || !fs.existsSync(cssPath)) {
        return this.themeColors;
      }

      const cssContent = fs.readFileSync(cssPath, "utf8");
      let themePreference = getSetting("theme", "system");
      let isDarkMode =
        themePreference === "system"
          ? nativeTheme.shouldUseDarkColors
          : themePreference === "dark";

      if (isDarkMode) {
        const darkMainMatch = cssContent.match(
          /--color-soma-darkest:\s*(#[0-9a-fA-F]{6});/,
        );
        const darkSearchMatch = cssContent.match(
          /--color-soma-light:\s*(#[0-9a-fA-F]{6});/,
        );

        if (darkMainMatch && darkMainMatch[1])
          this.themeColors.main = darkMainMatch[1];
        if (darkSearchMatch && darkSearchMatch[1])
          this.themeColors.search = darkSearchMatch[1];
      } else {
        const lightMainMatch = cssContent.match(
          /\[data-theme="light"\][^}]*--color-soma-dark:\s*(#[0-9a-fA-F]{6});/,
        );
        const lightSearchMatch = cssContent.match(
          /\[data-theme="light"\][^}]*--color-soma-light:\s*(#[0-9a-fA-F]{6});/,
        );

        if (lightMainMatch && lightMainMatch[1])
          this.themeColors.main = lightMainMatch[1];
        if (lightSearchMatch && lightSearchMatch[1])
          this.themeColors.search = lightSearchMatch[1];
      }

      return this.themeColors;
    } catch (error) {
      console.error("Error loading theme colors:", error);
      return this.themeColors;
    }
  }

  getTheme(): string {
    const themePreference = getSetting("theme", "system");
    if (themePreference === "system") {
      return nativeTheme.shouldUseDarkColors ? "dark" : "light";
    }
    return themePreference;
  }

  getCurrentTheme(): ElectronThemeColor {
    return this.themeColors;
  }

  applyTheme(window: BrowserWindow, type: keyof ElectronThemeColor): void {
    if (window && !window.isDestroyed()) {
      window.setBackgroundColor(this.themeColors[type]);
    }
  }

  updateTheme(): void {
    this.loadThemeColor();
    const theme = this.getTheme();

    const allWindows = BrowserWindow.getAllWindows();
    for (const win of allWindows) {
      win.webContents.send("theme-updated", theme);
      const isSearchWindow = win.getTitle() === "Search Files";
      this.applyTheme(win, isSearchWindow ? "search" : "main");
    }
  }

  setupListeners(): void {
    nativeTheme.on("updated", () => {
      if (getSetting("theme", "system") === "system") {
        this.updateTheme();
      }
    });

    ipcMain.handle("change-theme", (_event: any, theme: string) => {
      updateSetting("theme", theme);
      this.updateTheme();
      return { success: true };
    });

    ipcMain.handle("get-theme", () => {
      return this.getTheme();
    });
  }
}

export const themeManager = new ThemeManager();
