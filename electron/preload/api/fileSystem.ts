import { ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

const listeners = new Map<
	(filePath: string) => void,
	(event: IpcRendererEvent, filePath: string) => void
>();

export const fileSystemApi = {
	onFileSystemChanged: (callback: () => void) => {
		const subscription = (_event: any) => callback();
		ipcRenderer.on("file-system-changed", subscription);

		return () => {
			ipcRenderer.removeListener("file-system-changed", subscription);
		};
	},

	createMarkdownFile: (customFileName?: string) =>
		ipcRenderer.invoke("create-markdown-file", customFileName),

	loadExistingNotes: (sortMethod: SortMethod, folderCheck: boolean = true) =>
		ipcRenderer.invoke("load-existing-notes", sortMethod, folderCheck),

	createFolder: () => ipcRenderer.invoke("create-folder"),

	readMarkdownFile: (path: string) =>
		ipcRenderer.invoke("read-markdown-file", path),

	writeMarkdownFile: (path: string, content: string) =>
		ipcRenderer.invoke("write-markdown-file", path, content),

	updateFileOrders: (
		orders: Array<{ path: string; parentPath: string; index: number }>,
	) => ipcRenderer.invoke("update-file-orders", orders),

	getFileOrder: (parentPath: string) =>
		ipcRenderer.invoke("get-file-order", parentPath),

	moveFile: (oldPath: string, newPath: string) =>
		ipcRenderer.invoke("move-file", oldPath, newPath),

	getNotesDir: () => ipcRenderer.invoke("get-notes-dir"),

	renameFileOrFolder: (oldPath: string, newName: string) =>
		ipcRenderer.invoke("rename-file-or-folder", oldPath, newName),

	deleteFileOrFolder: (path: string) =>
		ipcRenderer.invoke("delete-file-or-folder", path),

	onSearchOpenNote: (callback: (filePath: string) => void) => {
		const wrapped = (_: IpcRendererEvent, filePath: string) =>
			callback(filePath);
		listeners.set(callback, wrapped);
		ipcRenderer.on("search-open-note", wrapped);
	},

	offSearchOpenNote: (callback: (filePath: string) => void) => {
		const wrapped = listeners.get(callback);
		if (wrapped) {
			ipcRenderer.removeListener("search-open-note", wrapped);
			listeners.delete(callback);
		}
	},
};
