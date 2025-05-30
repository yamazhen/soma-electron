interface QuizAnalytics {
	totalAttempts: number;
	averageScore: number;
	recentAttempts: number;
	studyStreak: number;
	questionsToday: number;
	accuracy: number;
}

interface DailyActivity {
	date: string;
	attempts: number;
	avg_score: number;
}

interface SubjectPerformance {
	subject: string;
	attempts: number;
	avg_score: number;
	last_attempt: string;
}

interface DashboardAnalytics {
	studyStreak: number;
	totalNotes: number;
	totalQuizzes: number;
	totalFlashcards: number;
	quizzesCompletedThisWeek: number;
	flashcardsReviewedThisWeek: number;
	averageQuizScore: number;
	notesCreatedThisWeek: number;
}

interface RecentActivity {
	id: string;
	type: "note" | "quiz" | "flashcard" | "note-edit";
	title: string;
	subtitle: string;
	timestamp: Date;
	icon: string;
	color: string;
}
