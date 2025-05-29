import { ipcRenderer } from "electron";

export const linksApi = {
	updateNoteLinks: (sourcePath: string, content: string) =>
		ipcRenderer.invoke("links:update-note-links", sourcePath, content),

	resolveTarget: (targetName: string) =>
		ipcRenderer.invoke("links:resolve-target", targetName),

	getBacklinks: (notePath: string) =>
		ipcRenderer.invoke("links:get-backlinks", notePath),

	getOutgoingLinks: (sourcePath: string) =>
		ipcRenderer.invoke("links:get-outgoing-links", sourcePath),

	getAllLinks: () => ipcRenderer.invoke("links:get-all-links"),

	getSuggestions: (partialText: string, limit?: number) =>
		ipcRenderer.invoke("links:get-suggestions", partialText, limit),

	getAllNames: () => ipcRenderer.invoke("links:get-all-names"),
};
