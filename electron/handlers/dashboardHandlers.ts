import { ipcMain } from "electron";
import { DashboardService } from "../service/dashboardService";

export function setupDashboardHandlers() {
  const dashboardService = new DashboardService();

  ipcMain.handle("dashboard:getAnalytics", async () => {
    return await dashboardService.getAnalytics();
  });

  ipcMain.handle("dashboard:getRecentActivity", async () => {
    return await dashboardService.getRecentActivity();
  });

  ipcMain.handle(
    "dashboard:logActivity",
    async (
      _,
      type: ActivityType,
      title: string,
      entity_id: string,
      metadata?: any,
    ) => {
      return await dashboardService.logActivity(
        type,
        title,
        entity_id,
        metadata,
      );
    },
  );
}
