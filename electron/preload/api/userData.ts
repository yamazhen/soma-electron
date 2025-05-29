import { ipcRenderer } from "electron";

export const userDataApi = {
	loadOffline: () => ipcRenderer.invoke("user:load-offline"),
	set: (user: UserStore) => ipcRenderer.invoke("user:set", user),
	loadOnline: () => ipcRenderer.invoke("user:load-online"),
	logout: () => ipcRenderer.invoke("user:logout"),
};
