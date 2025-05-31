import { ipcRenderer } from "electron";

export const windowApi = {
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

  getAppStartTime: () => ipcRenderer.invoke("get-app-start-time"),

  // my apis
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

  openSearchPopup: () => ipcRenderer.invoke("open-search-popup"),
  hideSearchPopup: () => ipcRenderer.invoke("hide-search-popup"),
  expandSearchPopup: (expanded: boolean) =>
    ipcRenderer.invoke("expand-search-popup", expanded),

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
    const handler = (
      _: Electron.IpcRendererEvent,
      state: { isFullScreen: boolean; isMacOS: boolean },
    ) => callback(state);
    ipcRenderer.on("window-state-changed", handler);

    return () => {
      ipcRenderer.removeListener("window-state-changed", handler);
    };
  },
};
