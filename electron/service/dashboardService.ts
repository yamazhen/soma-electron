// electron/service/dashboardService.ts
import { QuizAttemptDAL, DeckDAL, ActivityDAL } from "../database/dal";

export class DashboardService {
	private quizAttemptDAL = new QuizAttemptDAL();
	private deckDAL = new DeckDAL();
	private activityDAL = new ActivityDAL(); // Add this

	// Remove the old getRecentActivity method and replace with:
	getRecentActivity(): RecentActivity[] {
		try {
			const activities = this.activityDAL.getRecentActivities(8);

			return activities.map((activity) => ({
				id: `${activity.type}-${activity.id}`,
				type: activity.type,
				title: activity.title,
				subtitle: activity.subtitle || "No description",
				timestamp: new Date(activity.timestamp), // Proper Date conversion
				icon: this.getIconForType(activity.type),
				color: this.getColorForType(activity.type),
			}));
		} catch (error) {
			console.error("Error getting recent activity:", error);
			return [];
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

	// Add method to log activities
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
				return "Note updated";
			default:
				return "Activity completed";
		}
	}
}
