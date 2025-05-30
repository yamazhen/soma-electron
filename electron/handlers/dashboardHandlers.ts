import { ipcMain } from "electron";
import { DashboardService } from "../service/dashboardService";

export function setupDashboardHandlers() {
	const dashboardService = new DashboardService();

	ipcMain.handle("dashboard:getAnalytics", () => {
		try {
			const analytics = dashboardService.getDashboardAnalytics();
			return { success: true, analytics };
		} catch (error: any) {
			console.error("Error getting dashboard analytics:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("dashboard:getRecentActivity", () => {
		try {
			const activity = dashboardService.getRecentActivity();
			return { success: true, activity };
		} catch (error: any) {
			console.error("Error getting recent activity:", error);
			return { success: false, error: error.message };
		}
	});
}
