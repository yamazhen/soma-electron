// electron/service/dashboardService.ts
import { QuizAttemptDAL, DeckDAL, ActivityDAL } from "../database/dal";

export class DashboardService {
	private quizAttemptDAL = new QuizAttemptDAL();
	private deckDAL = new DeckDAL();
	private activityDAL = new ActivityDAL();

	getAnalytics(): DashboardAnalytics {
		try {
			const quizAnalytics = this.quizAttemptDAL.getAnalytics();
			const allDecks = this.deckDAL.findAll();

			// Get notes count from file system
			const totalNotes = this.getAllNotesCount();

			// Calculate recent activity counts
			const recentActivities = this.activityDAL.getRecentActivities(50);
			const oneWeekAgo = new Date();
			oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

			const weeklyActivities = recentActivities.filter(
				(activity) => new Date(activity.timestamp) >= oneWeekAgo,
			);

			const quizzesCompletedThisWeek = weeklyActivities.filter(
				(a) => a.type === "quiz",
			).length;
			const flashcardsReviewedThisWeek = weeklyActivities.filter(
				(a) => a.type === "flashcard",
			).length;
			const notesCreatedThisWeek = weeklyActivities.filter(
				(a) => a.type === "note",
			).length;

			return {
				studyStreak: quizAnalytics.studyStreak,
				totalNotes,
				totalQuizzes: this.quizAttemptDAL.getAll().length,
				totalFlashcards: allDecks.reduce(
					(total, deck) => total + deck.cards.length,
					0,
				),
				quizzesCompletedThisWeek,
				flashcardsReviewedThisWeek,
				averageQuizScore: quizAnalytics.averageScore,
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
			const activities = this.activityDAL.getRecentActivities(8);

			return activities.map((activity) => ({
				id: `${activity.type}-${activity.id}`,
				type: activity.type,
				title: activity.title,
				subtitle: activity.subtitle || "No description",
				timestamp: new Date(activity.timestamp),
				icon: this.getIconForType(activity.type),
				color: this.getColorForType(activity.type),
			}));
		} catch (error) {
			console.error("Error getting recent activity:", error);
			return [];
		}
	}

	private getAllNotesCount(): number {
		try {
			// This would need to be implemented to get actual notes count
			// For now, return a placeholder
			return 0;
		} catch (error) {
			console.error("Error getting notes count:", error);
			return 0;
		}
	}

	private getIconForType(type: string): string {
		switch (type) {
			case "quiz":
				return "Brain";
			case "flashcard":
				return "WalletCards";
			case "note":
				return "NotebookText";
			default:
				return "Circle";
		}
	}

	private getColorForType(type: string): string {
		switch (type) {
			case "quiz":
				return "accent2";
			case "flashcard":
				return "accent3";
			case "note":
				return "accent1";
			default:
				return "accent1";
		}
	}

	logActivity(
		type: "note" | "quiz" | "flashcard",
		title: string,
		entity_id: string,
		metadata?: any,
	): void {
		try {
			this.activityDAL.logActivity({
				type,
				title,
				entity_id,
				subtitle: this.generateSubtitle(type, metadata),
				metadata: metadata ? JSON.stringify(metadata) : undefined,
			});
		} catch (error) {
			console.error("Error logging activity:", error);
		}
	}

	private generateSubtitle(type: string, metadata?: any): string {
		switch (type) {
			case "quiz":
				return metadata?.score ? `Score: ${metadata.score}%` : "Quiz completed";
			case "flashcard":
				return metadata?.cardCount
					? `${metadata.cardCount} cards`
					: "Deck reviewed";
			case "note":
				return "Note modified";
			default:
				return "Activity completed";
		}
	}
}
