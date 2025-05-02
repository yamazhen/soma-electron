import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron";

const listeners = new Map<
  (filePath: string) => void,
  (event: IpcRendererEvent, filePath: string) => void
>();

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
  // quiz
  quizSave: (quizData: QuizData) => ipcRenderer.invoke("quiz-save", quizData),
  quizFindAll: () => ipcRenderer.invoke("quiz-find-all"),
  quizFindById: (quizId: number) =>
    ipcRenderer.invoke("quiz-find-by-id", quizId),
  // quiz reviews
  reviewSubmit: (submission: QuizSubmission) =>
    ipcRenderer.invoke("review-submit", submission),
  reviewFindById: (reviewId: number) =>
    ipcRenderer.invoke("review-find-by-id", reviewId),
  reviewFindByQuizId: (quizId: number) =>
    ipcRenderer.invoke("review-find-by-quiz-id", quizId),

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
});
