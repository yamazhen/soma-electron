import React, { useState, useEffect } from "react";
import {
  Brain,
  Calendar,
  Flame,
  NotebookText,
  WalletCards,
  Clock,
  ChevronRight,
  Plus,
  BookOpen,
} from "lucide-react";
import { useCurrentDate } from "../../utils/DateUpdater";
import { useAppContext } from "../../context/AppContext";

const Home: React.FC = () => {
  const currentDate = useCurrentDate();
  const {
    getMessage,
    currentLang,
    getAllNotesOnly,
    setActivePage,
    setNoteView,
    setQuizView,
    setCardView,
    handleCreateNote,
    lastActivityUpdate,
    getTodayStudyTime,
  } = useAppContext();

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real analytics data - KEEP ONLY THIS ONE
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);

        // Get dashboard analytics
        const analyticsResult = await window.dashboardApi.getAnalytics();
        if (analyticsResult.success && analyticsResult.data) {
          setAnalytics(analyticsResult.data);
        }

        // Get recent activity
        const activityResult = await window.dashboardApi.getRecentActivity();
        if (activityResult.success && activityResult.data) {
          setRecentActivity(activityResult.data);
        }
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [lastActivityUpdate]);

  const allNotes = getAllNotesOnly();
  const displayStudyTime = getTodayStudyTime();

  // Calculate stats with real data
  const stats = {
    streak: analytics?.studyStreak || 0,
    totalNotes: allNotes.length,
    totalQuizzes: analytics?.totalQuizzes || 0,
    totalFlashcards: analytics?.totalFlashcards || 0,
    weeklyActivity:
      (analytics?.quizzesCompletedThisWeek || 0) +
      (analytics?.flashcardsReviewedThisWeek || 0),
    averageScore: analytics?.averageQuizScore || 0,
  };

  function getTimeAgo(timestamp: string | Date): string {
    const now = new Date();
    const date =
      typeof timestamp === "string" ? new Date(timestamp) : timestamp;

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Unknown time";
    }

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  }

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case "Brain":
        return Brain;
      case "WalletCards":
        return WalletCards;
      case "NotebookText":
        return NotebookText;
      default:
        return NotebookText;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "note":
        handleCreateNote();
        setActivePage("notes");
        setNoteView("note");
        break;
      case "quiz":
        setActivePage("quiz");
        setQuizView("create");
        break;
      case "flashcard":
        setActivePage("flashcard");
        setCardView("create");
        break;
    }
  };

  if (loading) {
    return (
      <section className="w-full min-h-screen bg-soma-darkest overflow-auto p-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soma-accent1"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-h-screen bg-soma-darkest overflow-auto p-10">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-soma-text-primary mb-3">
            {getMessage("home.welcome")}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-soma-text-secondary">
            <div className="flex items-center gap-2">
              <Calendar className="text-soma-accent1" size={20} />
              <span>
                {currentDate.toLocaleDateString(currentLang, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-soma-accent3" size={20} />
              <span>
                {/* Fix: Use proper hours and minutes calculation */}
                {Math.floor(displayStudyTime / 60)}h {displayStudyTime % 60}m
                today
              </span>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-warning/20 rounded-xl">
                <Flame className="text-soma-warning" size={28} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Study Streak
              </span>
            </div>
            <p className="text-4xl font-bold text-soma-text-primary">
              {stats.streak} days
            </p>
            <p className="text-sm text-soma-lightest mt-2">
              {stats.streak > 0 ? "Keep it going!" : "Start your streak today!"}
            </p>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-accent1/20 rounded-xl">
                <BookOpen className="text-soma-accent1" size={28} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Total Notes
              </span>
            </div>
            <p className="text-4xl font-bold text-soma-text-primary">
              {stats.totalNotes}
            </p>
            <p className="text-sm text-soma-lightest mt-2">
              {stats.totalNotes > 0 ? "Great collection!" : "Start writing!"}
            </p>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-accent2/20 rounded-xl">
                <Brain className="text-soma-accent2" size={28} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Quiz Average
              </span>
            </div>
            <p className="text-4xl font-bold text-soma-text-primary">
              {stats.averageScore}%
            </p>
            <div className="w-full bg-soma-medium rounded-full h-3 mt-4">
              <div
                className="bg-soma-accent2 rounded-full h-3 transition-all duration-500"
                style={{ width: `${stats.averageScore}%` }}
              />
            </div>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-accent3/20 rounded-xl">
                <WalletCards className="text-soma-accent3" size={28} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Flashcards
              </span>
            </div>
            <p className="text-4xl font-bold text-soma-text-primary">
              {stats.totalFlashcards}
            </p>
            <p className="text-sm text-soma-lightest mt-2">
              {stats.totalFlashcards > 0
                ? "Ready to review!"
                : "Create some cards!"}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="xl:col-span-2">
            <div className="bg-soma-dark rounded-2xl p-6 h-full">
              <h2 className="text-2xl font-bold text-soma-text-primary mb-6 flex items-center gap-3">
                <Clock className="text-soma-accent1" size={26} />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const IconComponent = getActivityIcon(activity.icon);
                    return (
                      <div
                        key={activity.id}
                        className="bg-soma-medium p-5 rounded-xl hover:bg-soma-light transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-xl ${
                                activity.color === "accent1"
                                  ? "bg-soma-accent1/20"
                                  : activity.color === "accent2"
                                    ? "bg-soma-accent2/20"
                                    : "bg-soma-accent3/20"
                              }`}
                            >
                              <IconComponent
                                className={`${
                                  activity.color === "accent1"
                                    ? "text-soma-accent1"
                                    : activity.color === "accent2"
                                      ? "text-soma-accent2"
                                      : "text-soma-accent3"
                                }`}
                                size={24}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold text-soma-text-primary text-lg">
                                {activity.title}
                              </h3>
                              <p className="text-soma-text-secondary">
                                {activity.subtitle}
                              </p>
                              <p className="text-sm text-soma-lightest mt-1">
                                {getTimeAgo(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            className="text-soma-lightest group-hover:text-soma-text-primary transition-colors"
                            size={24}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    {/* Animated icon stack */}
                    <div className="relative mb-6 flex justify-center">
                      <div className="relative">
                        {/* Background circles with subtle animation */}
                        <div className="absolute inset-0 w-20 h-20 bg-soma-accent1/10 rounded-full animate-pulse"></div>
                        <div className="absolute inset-2 w-16 h-16 bg-soma-accent2/10 rounded-full animate-pulse delay-75"></div>
                        <div className="absolute inset-4 w-12 h-12 bg-soma-accent3/10 rounded-full animate-pulse delay-150"></div>

                        {/* Main icon */}
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <Clock
                            size={32}
                            className="text-soma-text-secondary opacity-60"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Main message */}
                    <h3 className="text-xl font-semibold text-soma-text-primary mb-3">
                      No recent activity yet
                    </h3>

                    {/* Description */}
                    <p className="text-soma-text-secondary mb-6 max-w-sm mx-auto leading-relaxed">
                      Your study activities will appear here. Start creating
                      notes, taking quizzes, or reviewing flashcards to see your
                      progress!
                    </p>

                    {/* Action suggestions */}
                    <div className="flex flex-wrap justify-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-soma-accent1/10 rounded-full cursor-pointer">
                        <NotebookText size={16} className="text-soma-accent1" />
                        <span className="text-sm text-soma-accent1 font-medium">
                          Create a note
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-soma-accent2/10 rounded-full cursor-pointer">
                        <Brain size={16} className="text-soma-accent2" />
                        <span className="text-sm text-soma-accent2 font-medium">
                          Take a quiz
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-soma-accent3/10 rounded-full cursor-pointer">
                        <WalletCards size={16} className="text-soma-accent3" />
                        <span className="text-sm text-soma-accent3 font-medium">
                          Review cards
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="bg-soma-dark rounded-2xl p-6 h-full">
              <h2 className="text-2xl font-bold text-soma-text-primary mb-6">
                Quick Actions
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => handleQuickAction("note")}
                  className="w-full p-5 bg-soma-accent1/20 rounded-xl hover:bg-soma-accent1/30 transition-all flex items-center justify-center gap-3 text-lg font-medium cursor-pointer text-soma-accent1"
                >
                  <Plus size={24} />
                  Create Note
                </button>
                <button
                  onClick={() => handleQuickAction("quiz")}
                  className="w-full p-5 bg-soma-accent2/20 rounded-xl hover:bg-soma-accent2/30 transition-all flex items-center justify-center gap-3 text-lg font-medium cursor-pointer text-soma-accent2"
                >
                  <Brain size={24} />
                  Create Quiz
                </button>
                <button
                  onClick={() => handleQuickAction("flashcard")}
                  className="w-full p-5 bg-soma-accent3/20 rounded-xl hover:bg-soma-accent3/30 transition-all flex items-center justify-center gap-3 text-lg font-medium cursor-pointer text-soma-accent3"
                >
                  <WalletCards size={24} />
                  Create Flashcards
                </button>
              </div>

              {/* Weekly Summary */}
              <div className="mt-6 pt-6 border-t border-soma-light/20">
                <h3 className="text-lg font-semibold text-soma-text-primary mb-4">
                  This Week
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-soma-text-secondary">
                      Quizzes Completed
                    </span>
                    <span className="text-soma-accent2 font-semibold">
                      {analytics?.quizzesCompletedThisWeek || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-soma-text-secondary">
                      Cards Reviewed
                    </span>
                    <span className="text-soma-accent3 font-semibold">
                      {analytics?.flashcardsReviewedThisWeek || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-soma-text-secondary">
                      Notes Created
                    </span>
                    <span className="text-soma-accent1 font-semibold">
                      {analytics?.notesCreatedThisWeek || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
