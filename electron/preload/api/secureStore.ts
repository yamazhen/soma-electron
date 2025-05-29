import { ipcRenderer } from "electron";

export const secureStoreApi = {
	set: (key: string, val: string) => ipcRenderer.invoke("secure:set", key, val),
	get: (key: string) => ipcRenderer.invoke("secure:get", key),
	delete: (key: string) => ipcRenderer.invoke("secure:delete", key),
};
