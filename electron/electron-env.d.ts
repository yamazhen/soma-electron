/// <reference types="vite-plugin-electron/electron-env" />

declare global {
  interface Database {
    exec(sql: string): void;
    prepare(sql: string): Statement;
    transaction<T>(fn: () => T): () => T;
    close(): void;
  }

  export type AuthMode =
    | "login"
    | "register"
    | "forgot"
    | "verify"
    | "verify-login";

  interface Statement {
    run(...params: any[]): {
      changes: number;
      lastInsertRowid: number | bigint;
    };
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }

  interface WindowState {
    isFullScreen: boolean;
    isMacOS: boolean;
  }

  interface ElectronThemeColor {
    main: string;
    search: string;
  }

  type SortMethod = "asc" | "desc" | "custom";

  interface Card {
    id?: number;
    deckId?: number;
    front: string;
    back: string;
  }

  interface Deck {
    id?: number;
    title: string;
    cards: Card[];
  }

  interface DocumentState {
    filePath: string;
    content: string;
    timestamp: number;
  }

  interface CursorProps {
    top: number;
    left: number;
  }

  interface MovedItem {
    oldPath: string;
    newPath: string | undefined;
  }

  interface TreeNode {
    id: string;
    name: string;
    isFolder: boolean;
    children?: TreeNode[];
    data: DirectoryItem | MarkdownItem;
  }

  interface FileTreeProps {
    treeData: TreeNode[];
  }

  interface FileTreeHandle {
    expandAllFolders: () => void;
    collapseAllFolders: () => void;
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

  interface NewUserResponse {
    username: string;
    email: string;
    display_name?;
  }

  interface UserCreationResponse {
    username: string;
    password: string;
    displayName: string;
    rateLimited?: boolean;
  }

  interface LoginInitResponse {
    requiresVerification: true;
    email: string;
  }

  interface LoginCompleteResponse {
    requiresVerification: false;
    user: {
      id: number;
      username: string;
      email: string;
      display_name: string;
      profile_picture?: string;
      last_login?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  }

  type LoginResponse = LoginInitResponse | LoginCompleteResponse;

  interface UserStore {
    id: number;
    username: string;
    email: string;
    display_name: string;
    profile_picture?: string;
    /*
     * the data below is not stored in the db
     * but is used in the app
     */
    last_sync_timestamp?: string;
    last_opened: string;
    study_streak: number;
  }

  interface ServerSuccessResponse<T> {
    success: true;
    data?: T;
    message?: string;
    meta?: any;
  }

  interface ServerErrorResponse {
    success: false;
    error: string;
  }

  type ServerResponse<T = never> = {
    statusCode: number;
    body: ServerSuccessResponse<T> | ServerErrorResponse;
  };
}

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    VITE_PUBLIC: string;
  }
}

export {};
