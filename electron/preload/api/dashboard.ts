// electron/preload/api/dashboard.ts
import { ipcRenderer } from "electron";

export const dashboardApi = {
	getAnalytics: () => ipcRenderer.invoke("dashboard:getAnalytics"),
	getRecentActivity: () => ipcRenderer.invoke("dashboard:getRecentActivity"),
	logActivity: (
		type: string,
		title: string,
		entityId: string,
		metadata?: any,
	) =>
		ipcRenderer.invoke(
			"dashboard:logActivity",
			type,
			title,
			entityId,
			metadata,
		),
};
