import { initDatabase } from "../database/database";
import { createMainWindow } from "../windows/mainWindow";
import { windowManager } from "../windows/windowManager";
import { themeManager } from "../config/themeManager";
import { setupAllHandlers } from "../handlers";

export async function initializeApp(): Promise<void> {
  try {
    await initializeCoreServices();

    const mainWindow = createMainWindow(null, themeManager.getCurrentTheme());
    windowManager.setWindow("main", mainWindow);

    await setupAllHandlers(mainWindow);

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
}

async function initializeCoreServices(): Promise<void> {
  await Promise.all([initDatabase(), themeManager.setupListeners()]);
}
