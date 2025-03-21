import { ipcRenderer, contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
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
  createMarkdownFile: () => ipcRenderer.invoke("create-markdown-file"),
  loadExistingNotes: () => ipcRenderer.invoke("load-existing-notes"),
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
});
