import { ipcMain } from "electron";
import { DashboardService } from "../service/dashboardService";

export function setupDashboardHandlers() {
  const dashboardService = new DashboardService();

  ipcMain.handle("dashboard:getAnalytics", () => {
    try {
      const analytics = dashboardService.getAnalytics();
      return { success: true, analytics };
    } catch (error: any) {
      console.error("Error getting analytics:", error);
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
