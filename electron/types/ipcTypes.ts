interface IpcResponse {
  success: boolean;
  error?: string;
}

interface IpcResponseData<T> extends IpcResponse {
  data?: T;
}

interface Window {
  appConfig: {
    notesDir: string;
  };

  linksApi: {
    updateNoteLinks: (sourcePath: string, content: string) => Promise<{}>;

    resolveTarget: (targetName: string) => Promise<IpcResponseData<any[]>>;

    getBacklinks: (notePath: string) => Promise<IpcResponseData<any[]>>;

    getOutgoingLinks: (sourcePath: string) => Promise<IpcResponseData<any[]>>;

    getSuggestions: (
      partialText: string,
      limit?: number,
    ) => Promise<IpcResponseData<any[]>>;

    getAllNames: () => Promise<IpcResponseData<string[]>>;
  };

  dashboardApi: {
    getAnalytics: () => Promise<IpcResponseData<DashboardAnalytics>>;
    getRecentActivity: () => Promise<IpcResponseData<RecentActivity[]>>;
    logActivity: (
      type: string,
      title: string,
      entityId: string,
      metadata?: any,
    ) => Promise<IpcResponse>;
  };

  deckIpc: {
    deckSave: (deckData: Deck) => Promise<IpcResponseData<{ deckId: number }>>;
    deckFindById: (deckId: number) => Promise<IpcResponseData<Deck>>;
    deckFindAll: () => Promise<IpcResponseData<Deck[]>>;
  };

  fileSystem: {
    onFileSystemChanged: (callback: () => void) => () => void;
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
    updateFileOrders: (
      orders: Array<{ path: string; parentPath: string; index: number }>,
    ) => Promise<void>;
    getFileOrder: (parentPath: string) => Promise<number[]>;
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
    onSearchOpenNote: (cb: (filePath: string) => void) => void;
    offSearchOpenNote: (cb: (filePath: string) => void) => void;
  };

  oauthIpc: {
    initGoogleLogin: (options: {
      apiUrl: string;
      clientType?: string;
    }) => Promise<{ success: boolean; authUrl?: string; error?: string }>;
    onAuthSuccess: (callback: (data: any) => void) => () => void;
    onAuthError: (callback: (error: string) => void) => () => void;
  };

  userData: {
    store: (user: UserStore) => Promise<void>;
    loadOffline: () => Promise<UserStore | null>;
    loadOnline: () => Promise<UserStore | null>;
    logout: () => Promise<void>;
  };

  secureStore: {
    set: (key: string, value: string) => Promise<void>;
    get: (key: string) => Promise<string | null>;
    remove: (key: string) => Promise<void>;
  };

  serverApi: {
    get: (url: string) => Promise<any>;
    post: (url: string, data: any) => Promise<any>;
    put: (url: string, data: any) => Promise<any>;
  };
  quizIpc: {
    getAll: () => Promise<{
      success: boolean;
      error?: string;
      quizzes?: QuizDetails[];
    }>;
    get: (id: number) => Promise<{
      success: boolean;
      error?: string;
      quiz?: QuizDetails;
    }>;
    create: (data: {
      title: string;
      questions: any[];
    }) => Promise<{ success: boolean; quizId?: number; error?: string }>;
    update: (data: {
      id: number;
      title: string;
    }) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
    submitAttempt: (data: {
      quizId: number;
      answers: { questionId: number; answer: string }[];
    }) => Promise<{ success: boolean; review?: QuizReview; error?: string }>;
    getAttemptHistory: (
      quizId: number,
    ) => Promise<{ success: boolean; history?: QuizAttemptSummary }>;
    getAttemptDetails: (attemptId: number) => Promise<any>;
    getAnalytics: () => Promise<IpcResponseData<QuizAnalytics>>;
    getDailyActivity: () => Promise<IpcResponseData<DailyActivity[]>>;
    getSubjectPerformance: () => Promise<IpcResponseData<SubjectPerformance[]>>;
    submitAttemptWithScheduling: (data: {
      quizId: number;
      answers: { questionId: number; answer: string; responseTime?: number }[];
    }) => Promise<{ success: boolean; review?: QuizReview; error?: string }>;
    getScheduledQuestions: (
      limit?: number,
    ) => Promise<{
      success: boolean;
      questions?: QuestionWithDetails[];
      error?: string;
    }>;
    getDueQuestionsCount: () => Promise<{
      success: boolean;
      counts?: { today: number; overdue: number; upcoming: number };
      error?: string;
    }>;
    getQuestionsByScheduleStatus: (
      status: string,
    ) => Promise<{
      success: boolean;
      questions?: QuestionWithDetails[];
      error?: string;
    }>;
  };
  questionIpc: {
    add: (data: { quizId: number; question: any }) => Promise<number>;
    update: (data: { id: number; question: any }) => Promise<boolean>;
    delete: (id: number) => Promise<boolean>;
    getScheduled: (id: number) => Promise<any>;
    schedule: (id: number, scheduled: boolean) => Promise<boolean>;
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

    getLanguage: () => Promise<string>;
    setLanguage: (language: string) => Promise<void>;
    getTranslations: (language: string) => Promise<any>;
    getAvailableLanguages: () => Promise<string[]>;
    onLanguageChanged: (callback: (language: string) => void) => () => void;
    openExternalLink: (url: string) => Promise<void>;
    openSearchPopup: () => Promise<void>;
    hideSearchPopup: () => Promise<void>;
    expandSearchPopup: (expand: boolean) => Promise<void>;
    changeTheme: (theme: string) => Promise<void>;
    getTheme: () => Promise<string>;
    openSettings: () => Promise<void>;
    closeSettings: () => Promise<void>;
    openAuthWindow: () => Promise<void>;
    closeAuthWindow: () => Promise<void>;
    resizeAuthWindow: (height: number) => Promise<void>;
    onWindowStateChange: (
      callback: (state: { isFullScreen: boolean; isMacOS: boolean }) => void,
    ) => () => void;
  };
}
