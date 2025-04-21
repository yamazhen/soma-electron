/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    VITE_PUBLIC: string;
  }
}

type SortMethod = "asc" | "desc" | "custom";

interface QuizOption {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: number;
  text: string;
  type: "multiple-choice" | "fill-in-blank" | "true-false" | "short-answer";
  options?: QuizOption[];
  answers?: string[];
  possibleAnswers?: string[];
  correctAnswer?: boolean;
  scheduled?: boolean;
}

interface QuizData {
  id?: number;
  title: string;
  questions: QuizQuestion[];
}

interface DocumentState {
  filePath: string;
  content: string;
  timestamp: number;
}

interface QuizReview {
  id?: number;
  quizId: number;
  correct_questions: number[];
  wrong_questions: number[];
  score: number;
  createdAt?: Date;
}

interface QuizSubmission {
  quizId: number;
  answers: {
    questionId: number;
    answer: string;
  }[];
}

type TiptapEditorRef = {
  undo: () => void;
  redo: () => void;
};

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
    createMarkdownFile: (
      customFileName?: string,
    ) => Promise<MarkdownItem | null>;
    loadExistingNotes: (
      sortMethod: SortMethod,
      folderCheck?: boolean,
    ) => Promise<DirectoryContents>;
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
    deleteFileOrFolder: (path: string) => Promise<{ success: boolean }>;
    openExternalLink: (url: string) => Promise<void>;
    getLanguage: () => Promise<string>;
    setLanguage: (language: string) => Promise<void>;
    getTranslations: (language: string) => Promise<any>;
    getAvailableLanguages: () => Promise<string[]>;
    onLanguageChanged: (callback: (language: string) => void) => () => void;
    quizSave: (
      quizData: QuizData,
    ) => Promise<{ success: boolean; quizId?: number; error?: string }>;
    quizFindById: (
      quizId: number,
    ) => Promise<{ success: boolean; quizData?: QuizData; error?: string }>;
    quizFindAll: () => Promise<{
      success: boolean;
      quizData?: QuizData[];
      error?: string;
    }>;
    quizSubmitReview: (submission: QuizSubmission) => Promise<{
      success: boolean;
      reviewId?: number;
      review?: QuizReview;
      error?: string;
    }>;
    quizFindReviewById: (
      reviewId: number,
    ) => Promise<{ success: boolean; error?: string; review?: QuizReview }>;
    quizFindReviewsByQuizId: (
      quizId: number,
    ) => Promise<{ success: boolean; error?: string; reviews?: QuizReview[] }>;
  };
}
