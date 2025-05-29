import { ipcRenderer } from "electron";

export const serverApi = {
	get: (endpoint: string) => ipcRenderer.invoke("api:get", endpoint),
	post: (endpoint: string, data: any) =>
		ipcRenderer.invoke("api:post", endpoint, data),
	put: (endpoint: string, data: any) =>
		ipcRenderer.invoke("api:put", endpoint, data),
	delete: (endpoint: string) => ipcRenderer.invoke("api:delete", endpoint),
};
