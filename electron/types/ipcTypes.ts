interface Window {
	appConfig: {
		notesDir: string;
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
		getLanguage: () => Promise<string>;
		setLanguage: (language: string) => Promise<void>;
		getTranslations: (language: string) => Promise<any>;
		getAvailableLanguages: () => Promise<string[]>;
		onLanguageChanged: (callback: (language: string) => void) => () => void;
		deckSave: (
			deckData: Deck,
		) => Promise<{ success: boolean; deckId?: number; error?: string }>;
		deckFindById: (
			deckId: number,
		) => Promise<{ success: boolean; deck?: Deck; error?: string }>;
		deckFindAll: () => Promise<{
			success: boolean;
			decks?: Deck[];
			error?: string;
		}>;
		openExternalLink: (url: string) => Promise<void>;
		openSearchPopup: () => Promise<void>;
		hideSearchPopup: () => Promise<void>;
		expandSearchPopup: (expand: boolean) => Promise<void>;
		onSearchOpenNote: (cb: (filePath: string) => void) => void;
		offSearchOpenNote: (cb: (filePath: string) => void) => void;
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
