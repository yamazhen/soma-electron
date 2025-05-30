import { QuizAttemptDAL, DeckDAL } from "../database/dal";

export class DashboardService {
	private quizAttemptDAL = new QuizAttemptDAL();
	private deckDAL = new DeckDAL();

	getDashboardAnalytics(): DashboardAnalytics {
		try {
			// Study streak from quiz attempts
			const studyStreak = this.calculateStudyStreak();

			// Notes count (from file system)
			const totalNotes = this.getTotalNotesCount();

			// Quiz metrics
			const totalQuizzes = this.getTotalQuizzesCount();
			const quizzesCompletedThisWeek = this.getQuizzesCompletedThisWeek();
			const averageQuizScore = this.getAverageQuizScore();

			// Flashcard metrics
			const totalFlashcards = this.getTotalFlashcardsCount();
			const flashcardsReviewedThisWeek = this.getFlashcardsReviewedThisWeek();

			// Notes created this week
			const notesCreatedThisWeek = this.getNotesCreatedThisWeek();

			return {
				studyStreak,
				totalNotes,
				totalQuizzes,
				totalFlashcards,
				quizzesCompletedThisWeek,
				flashcardsReviewedThisWeek,
				averageQuizScore,
				notesCreatedThisWeek,
			};
		} catch (error) {
			console.error("Error getting dashboard analytics:", error);
			return {
				studyStreak: 0,
				totalNotes: 0,
				totalQuizzes: 0,
				totalFlashcards: 0,
				quizzesCompletedThisWeek: 0,
				flashcardsReviewedThisWeek: 0,
				averageQuizScore: 0,
				notesCreatedThisWeek: 0,
			};
		}
	}

	getRecentActivity(): RecentActivity[] {
		try {
			const activities: RecentActivity[] = [];

			// Recent quiz attempts (last 5)
			const recentQuizzes = this.quizAttemptDAL.db
				.prepare(`
          SELECT qa.*, q.title as quiz_title
          FROM quiz_attempts qa
          JOIN quiz q ON qa.quiz_id = q.id
          ORDER BY qa.created_at DESC
          LIMIT 5
        `)
				.all();

			for (const quiz of recentQuizzes) {
				activities.push({
					id: `quiz-${quiz.id}`,
					type: "quiz",
					title: quiz.quiz_title,
					subtitle: `Score: ${Math.round(quiz.percentage)}%`,
					timestamp: new Date(quiz.created_at),
					icon: "Brain",
					color: "accent2",
				});
			}

			// Note: We'll get recent notes and flashcard reviews from other sources
			// since we don't have activity tracking for those yet

			// Sort by timestamp and return latest 6
			return activities
				.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
				.slice(0, 6);
		} catch (error) {
			console.error("Error getting recent activity:", error);
			return [];
		}
	}

	private calculateStudyStreak(): number {
		try {
			const attempts = this.quizAttemptDAL.db
				.prepare(`
          SELECT DISTINCT date(created_at) as study_date 
          FROM quiz_attempts 
          ORDER BY study_date DESC
        `)
				.all() as { study_date: string }[];

			if (attempts.length === 0) return 0;

			let streak = 0;
			const today = new Date().toISOString().split("T")[0];
			let currentDate = new Date();

			for (const attempt of attempts) {
				const studyDate = attempt.study_date;
				const expectedDate = currentDate.toISOString().split("T")[0];

				if (studyDate === expectedDate) {
					streak++;
					currentDate.setDate(currentDate.getDate() - 1);
				} else if (studyDate === today && streak === 0) {
					streak = 1;
					currentDate.setDate(currentDate.getDate() - 1);
				} else {
					break;
				}
			}

			return streak;
		} catch (error) {
			console.error("Error calculating study streak:", error);
			return 0;
		}
	}

	private getTotalNotesCount(): number {
		// This would need to be implemented by counting files in notes directory
		// For now, return 0 as it will be calculated from the frontend
		return 0;
	}

	private getTotalQuizzesCount(): number {
		try {
			return (
				this.quizAttemptDAL.db
					.prepare("SELECT COUNT(DISTINCT quiz_id) as count FROM quiz_attempts")
					.get()?.count || 0
			);
		} catch (error) {
			return 0;
		}
	}

	private getQuizzesCompletedThisWeek(): number {
		try {
			return (
				this.quizAttemptDAL.db
					.prepare(`
          SELECT COUNT(*) as count 
          FROM quiz_attempts 
          WHERE date(created_at) >= date('now', '-7 days')
        `)
					.get()?.count || 0
			);
		} catch (error) {
			return 0;
		}
	}

	private getAverageQuizScore(): number {
		try {
			return Math.round(
				this.quizAttemptDAL.db
					.prepare("SELECT AVG(percentage) as avg FROM quiz_attempts")
					.get()?.avg || 0,
			);
		} catch (error) {
			return 0;
		}
	}

	private getTotalFlashcardsCount(): number {
		try {
			return (
				this.deckDAL.db.prepare("SELECT COUNT(*) as count FROM cards").get()
					?.count || 0
			);
		} catch (error) {
			return 0;
		}
	}

	private getFlashcardsReviewedThisWeek(): number {
		// TODO: Implement flashcard review tracking
		// For now return 0 as we don't have review tracking yet
		return 0;
	}

	private getNotesCreatedThisWeek(): number {
		// TODO: Implement by checking file creation dates
		// For now return 0 as it will be calculated from frontend
		return 0;
	}
}
