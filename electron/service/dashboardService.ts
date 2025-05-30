import {
  handleServiceCall,
  handleServiceOperation,
} from "../utils/serviceHelper";
import { QuizAttemptDAL, DeckDAL, ActivityDAL } from "../database/dal";

export class DashboardService {
  private quizAttemptDAL = new QuizAttemptDAL();
  private deckDAL = new DeckDAL();
  private activityDAL = new ActivityDAL();

  async getAnalytics(): Promise<IpcResponseData<DashboardAnalytics>> {
    return await handleServiceCall(() => {
      const quizAnalytics = this.quizAttemptDAL.getAnalytics();
      const allDecks = this.deckDAL.findAll();

      const totalNotes = this.getAllNotesCount();

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
    }, "Failed to retrive dashboard analytics");
  }

  private getAllNotesCount(): number {
    try {
      // using another method to get total notes count
      // right now, this is a placeholder
      // ideally, this should query the database or file system
      return 0;
    } catch (error) {
      console.error("Error getting notes count:", error);
      return 0;
    }
  }

  async getRecentActivity(): Promise<IpcResponseData<RecentActivity[]>> {
    return await handleServiceCall(() => {
      const activities = this.activityDAL.getRecentActivities(4);
      return activities.map((activity) => ({
        id: `${activity.type}-${activity.id}`,
        type: activity.type,
        title: activity.title,
        subtitle: activity.subtitle || "No description",
        timestamp: new Date(`${activity.timestamp}Z`),
        icon: this.getIconForType(activity.type),
        color: this.getColorForType(activity.type),
      }));
    });
  }

  private getIconForType(type: string): string {
    switch (type) {
      case "quiz":
        return "Brain";
      case "flashcard":
        return "WalletCards";
      case "note":
        return "NotebookText";
      case "note-edit":
        return "Edit3";
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

  async logActivity(
    type: ActivityType,
    title: string,
    entity_id: string,
    metadata?: any,
  ): Promise<IpcResponse> {
    return await handleServiceOperation(() => {
      this.activityDAL.logActivity({
        type,
        title,
        entity_id,
        subtitle: this.generateSubtitle(type, metadata),
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      });
    }, "Failed to log activity");
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
        return "Note created";
      case "note-edit":
        return "Note modified";
      default:
        return "Activity completed";
    }
  }
}
