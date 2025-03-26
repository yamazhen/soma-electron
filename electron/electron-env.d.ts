/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    VITE_PUBLIC: string;
  }
}

interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

interface DirectoryItem extends FileItem {
  isDirectory: true;
  children: (DirectoryItem | MarkdownItem)[];
}

interface MarkdownItem extends FileItem {
  isDirectory: false;
  content?: string;
}

type DirectoryContents = (DirectoryItem | MarkdownItem)[];

interface Window {
  appConfig: {
    notesDir: string;
  };
  ipcRenderer: {
    on: (
      channel: string,
      listener: (...args: any[]) => void,
    ) => import("electron").IpcRenderer;
    off: (channel: string, ...args: any[]) => import("electron").IpcRenderer;
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;

    // Window controls
    maximize: () => void;
    minimize: () => void;
    close: () => void;

    // File operations
    createMarkdownFile: () => Promise<MarkdownItem | null>;
    loadExistingNotes: () => Promise<DirectoryContents>;
    createFolder: () => Promise<DirectoryItem | null>;
    readMarkdownFile: (path: string) => Promise<MarkdownItem | null>;
    writeMarkdownFile: (path: string, content: string) => Promise<boolean>;
    getFileOrder: (parentPath: string) => Promise<number[]>;
    onFileSystemChanged: (callback: () => void) => () => void;
    updateFileOrders: (
      orders: Array<{ path: string; parentPath: string; index: number }>,
    ) => Promise<void>;
    moveFile: (
      oldPath: string,
      newPath: string,
    ) => Promise<{ success: boolean; newPath?: string }>;
    getNotesDir: () => Promise<string>;
    renameFileOrFolder: (
      oldPath: string,
      newName: string,
    ) => Promise<{ success: boolean; newPath?: string }>;
  };
}
