import { ipcMain } from "electron";
import type { BrowserWindow } from "electron";
import { FileSystemService } from "../service/fileSystemService";
import { watch } from "node:fs";

let fileWatcher: ReturnType<typeof watch> | null = null;
let fileSystemService: FileSystemService;

export async function setupFileSystemHandlers(mainWindow: BrowserWindow) {
	fileSystemService = new FileSystemService();

	startFileWatcher(mainWindow);

	ipcMain.handle("create-markdown-file", async (_, customFileName?: string) => {
		return await fileSystemService.createMarkdownFile(customFileName);
	});

	ipcMain.handle(
		"load-existing-notes",
		async (_, sortMethod: SortMethod, folderCheck: boolean = true) => {
			return await fileSystemService.loadExistingNotes(sortMethod, folderCheck);
		},
	);

	ipcMain.handle("create-folder", async () => {
		return await fileSystemService.createFolder();
	});

	ipcMain.handle("read-markdown-file", async (_, filePath: string) => {
		return await fileSystemService.readMarkdownFile(filePath);
	});

	ipcMain.handle(
		"write-markdown-file",
		async (_, filePath: string, content: string) => {
			return await fileSystemService.writeMarkdownFile(filePath, content);
		},
	);

	ipcMain.handle(
		"update-file-orders",
		async (
			_,
			orders: Array<{ path: string; parentPath: string; index: number }>,
		) => {
			return fileSystemService.updateFileOrders(orders);
		},
	);

	ipcMain.handle("get-file-order", async (_, parentPath: string) => {
		return fileSystemService.getFileOrder(parentPath);
	});

	ipcMain.handle("move-file", async (_, oldPath: string, newPath: string) => {
		return fileSystemService.moveFile(oldPath, newPath);
	});

	ipcMain.handle("get-notes-dir", () => {
		return fileSystemService.getNotesDir();
	});

	ipcMain.handle(
		"rename-file-or-folder",
		async (_, oldPath: string, newName: string) => {
			return fileSystemService.renameFileOrFolder(oldPath, newName);
		},
	);

	ipcMain.handle("delete-file-or-folder", async (_, filePath: string) => {
		return fileSystemService.deleteFileOrFolder(filePath);
	});

	ipcMain.on("search-open-note", (_event, filePath) => {
		mainWindow.webContents.send("search-open-note", filePath);
	});
}

function startFileWatcher(mainWindow: BrowserWindow) {
	const notesDir = fileSystemService.getNotesDir();

	if (fileWatcher) {
		fileWatcher.close();
	}

	fileWatcher = watch(notesDir, { recursive: true }, () => {
		if (mainWindow && !mainWindow.isDestroyed()) {
			mainWindow.webContents.send("file-system-changed");
		}
	});
}
