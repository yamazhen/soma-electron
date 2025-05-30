import { ipcRenderer } from "electron";

export const dashboardApi = {
	getAnalytics: () => ipcRenderer.invoke("dashboard:getAnalytics"),
	getRecentActivity: () => ipcRenderer.invoke("dashboard:getRecentActivity"),
};
