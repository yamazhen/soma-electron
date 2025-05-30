// electron/handlers/dashboardHandlers.ts
import { ipcMain } from "electron";
import { DashboardService } from "../service/dashboardService";

export function setupDashboardHandlers() {
	const dashboardService = new DashboardService();

	// Existing handlers...

	// Add new handler for logging activities
	ipcMain.handle(
		"dashboard:logActivity",
		(_, type: string, title: string, entity_id: string, metadata?: any) => {
			try {
				dashboardService.logActivity(type as any, title, entity_id, metadata);
				return { success: true };
			} catch (error: any) {
				console.error("Error logging activity:", error);
				return { success: false, error: error.message };
			}
		},
	);
}
