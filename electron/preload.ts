import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron";

const listeners = new Map<
	(filePath: string) => void,
	(event: IpcRendererEvent, filePath: string) => void
>();

contextBridge.exposeInMainWorld("quizIpc", {
	getAll: () => ipcRenderer.invoke("quiz:getAll"),
	get: (id: number) => ipcRenderer.invoke("quiz:get", id),
	create: (data: { title: string; questions: any[] }) =>
		ipcRenderer.invoke("quiz:create", data),
	update: (data: { id: number; title: string }) =>
		ipcRenderer.invoke("quiz:update", data),
	delete: (id: number) => ipcRenderer.invoke("quiz:delete", id),
	submitAttempt: (data: {
		quizId: number;
		answers: { questionId: number; answer: string }[];
	}) => ipcRenderer.invoke("quiz:submitAttempt", data),
	getAttemptHistory: (quizId: number) =>
		ipcRenderer.invoke("quiz:getAttemptHistory", quizId),
	getAttemptDetails: (attemptId: number) =>
		ipcRenderer.invoke("quiz:getAttemptDetails", attemptId),
});

contextBridge.exposeInMainWorld("oauthIpc", {
	initGoogleLogin: (options) =>
		ipcRenderer.invoke("oauth:google-init", options),

	onAuthSuccess: (callback) => {
		const subscription = (_, data) => {
			callback(data);
		};
		ipcRenderer.on("auth-callback-success", subscription);
		return () => {
			ipcRenderer.removeListener("auth-callback-success", subscription);
		};
	},

	onAuthError: (callback) => {
		const subscription = (_, error) => {
			callback(error);
		};
		ipcRenderer.on("auth-callback-error", subscription);
		return () => {
			ipcRenderer.removeListener("auth-callback-error", subscription);
		};
	},
});

contextBridge.exposeInMainWorld("questionIpc", {
	add: (data: { quizId: number; question: any }) =>
		ipcRenderer.invoke("question:add", data),
	update: (data: { id: number; question: any }) =>
		ipcRenderer.invoke("question:update", data),
	delete: (id: number) => ipcRenderer.invoke("question:delete", id),
	getScheduled: (id: number) => ipcRenderer.invoke("question:getScheduled", id),
	schedule: (id: number, scheduled: boolean) =>
		ipcRenderer.invoke("question:schedule", id, scheduled),
});

contextBridge.exposeInMainWorld("secureStore", {
	set: (key: string, val: string) => ipcRenderer.invoke("secure:set", key, val),
	get: (key: string) => ipcRenderer.invoke("secure:get", key),
	delete: (key: string) => ipcRenderer.invoke("secure:delete", key),
});

contextBridge.exposeInMainWorld("userData", {
	loadOffline: () => ipcRenderer.invoke("user:load-offline"),
	set: (user: UserStore) => ipcRenderer.invoke("user:set", user),
	loadOnline: () => ipcRenderer.invoke("user:load-online"),
	logout: () => ipcRenderer.invoke("user:logout"),
});

contextBridge.exposeInMainWorld("serverApi", {
	get: (endpoint: string) => ipcRenderer.invoke("api:get", endpoint),
	post: (endpoint: string, data: any) =>
		ipcRenderer.invoke("api:post", endpoint, data),
	put: (endpoint: string, data: any) =>
		ipcRenderer.invoke("api:put", endpoint, data),
	delete: (endpoint: string) => ipcRenderer.invoke("api:delete", endpoint),
});

contextBridge.exposeInMainWorld("ipcRenderer", {
	on(...args: Parameters<typeof ipcRenderer.on>) {
		const [channel, listener] = args;
		return ipcRenderer.on(channel, (event, ...args) =>
			listener(event, ...args),
		);
	},
	off(...args: Parameters<typeof ipcRenderer.off>) {
		const [channel, ...omit] = args;
		return ipcRenderer.off(channel, ...omit);
	},
	send(...args: Parameters<typeof ipcRenderer.send>) {
		const [channel, ...omit] = args;
		return ipcRenderer.send(channel, ...omit);
	},
	invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
		const [channel, ...omit] = args;
		return ipcRenderer.invoke(channel, ...omit);
	},
	maximize: () => ipcRenderer.send("maximize"),
	minimize: () => ipcRenderer.send("minimize"),
	close: () => ipcRenderer.send("close"),

	// You can expose other APTs you need here.
	// ...
	createMarkdownFile: (customFileName?: string) =>
		ipcRenderer.invoke("create-markdown-file", customFileName),
	loadExistingNotes: (sortMethod: SortMethod, folderCheck: boolean = true) =>
		ipcRenderer.invoke("load-existing-notes", sortMethod, folderCheck),
	createFolder: () => ipcRenderer.invoke("create-folder"),
	onFileSystemChanged: (callback: () => void) => {
		const subscription = (_event: any) => callback();
		ipcRenderer.on("file-system-changed", subscription);

		return () => {
			ipcRenderer.removeListener("file-system-changed", subscription);
		};
	},
	readMarkdownFile: (path: string) =>
		ipcRenderer.invoke("read-markdown-file", path),
	writeMarkdownFile: (path: string, content: string) =>
		ipcRenderer.invoke("write-markdown-file", path, content),
	getFileOrder: (parentPath: string) =>
		ipcRenderer.invoke("get-file-order", parentPath),
	updateFileOrders: (
		orders: Array<{ path: string; parentPath: string; index: number }>,
	) => ipcRenderer.invoke("update-file-orders", orders),
	moveFile: (oldPath: string, newPath: string) =>
		ipcRenderer.invoke("move-file", oldPath, newPath),
	getNotesDir: () => ipcRenderer.invoke("get-notes-dir"),
	renameFileOrFolder: (oldPath: string, newName: string) =>
		ipcRenderer.invoke("rename-file-or-folder", oldPath, newName),
	deleteFileOrFolder: (path: string) =>
		ipcRenderer.invoke("delete-file-or-folder", path),
	openExternalLink: (url: string) =>
		ipcRenderer.invoke("open-external-link", url),
	getLanguage: () => ipcRenderer.invoke("get-language"),
	setLanguage: (language: string) =>
		ipcRenderer.invoke("set-language", language),
	getTranslations: (language: string) =>
		ipcRenderer.invoke("get-translations", language),
	getAvailableLanguages: () => ipcRenderer.invoke("get-available-languages"),
	onLanguageChanged: (callback: (language: string) => void) => {
		ipcRenderer.on("language-changed", (_event, language) =>
			callback(language),
		);
		return () => {
			ipcRenderer.removeAllListeners("language-changed");
		};
	},

	// deck
	deckSave: (deckData: Deck) => ipcRenderer.invoke("deck-save", deckData),
	deckFindById: (deckId: number) =>
		ipcRenderer.invoke("deck-find-by-id", deckId),
	deckFindAll: () => ipcRenderer.invoke("deck-find-all"),
	openSearchPopup: () => ipcRenderer.invoke("open-search-popup"),
	hideSearchPopup: () => ipcRenderer.invoke("hide-search-popup"),
	expandSearchPopup: (expanded: boolean) =>
		ipcRenderer.invoke("expand-search-popup", expanded),
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
	// theme
	changeTheme: (theme: string) => ipcRenderer.invoke("change-theme", theme),
	getTheme: () => ipcRenderer.invoke("get-theme"),
	// settings
	openSettings: () => ipcRenderer.invoke("open-settings"),
	closeSettings: () => ipcRenderer.invoke("close-settings"),
	// auth window
	openAuthWindow: () => ipcRenderer.invoke("open-auth-win"),
	closeAuthWindow: () => ipcRenderer.invoke("close-auth-window"),
	resizeAuthWindow: (height: number) =>
		ipcRenderer.invoke("resize-auth-window", height),
	// window state
	onWindowStateChange: (
		callback: (state: { isFullScreen: boolean; isMacOS: boolean }) => void,
	) => {
		ipcRenderer.on(
			"window-state-change",
			(
				_event: Electron.IpcRendererEvent,
				state: { isFullScreen: boolean; isMacOS: boolean },
			) => callback(state),
		);
	},
});
