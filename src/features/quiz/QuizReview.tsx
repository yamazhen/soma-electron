import {
  Lightbulb,
  TrendingUp,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  Play,
  Sparkles,
  AlertCircle,
  Calendar,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "sonner";

type ReviewFilter = "all" | "due-today" | "overdue" | "upcoming";

interface Props {
  setQuizInReview: (quiz: QuizDetails) => void;
}

const QuizReview: React.FC<Props> = ({ setQuizInReview }) => {
  const { quizzes, setQuizView, loadingAnalytics } = useAppContext();
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [schedulingData, setSchedulingData] = useState({
    dueCounts: { today: 0, overdue: 0, upcoming: 0 },
    scheduledQuizzes: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  const loadSchedulingData = async () => {
    try {
      setLoading(true);
      const countsResult = await window.quizIpc.getDueQuestionsCount();
      const dueCounts = countsResult.success
        ? countsResult.counts!
        : { today: 0, overdue: 0, upcoming: 0 };

      console.log("Global due counts:", dueCounts); // Debug log

      const scheduledQuizzes = await Promise.all(
        (quizzes || []).map(async (quiz) => {
          try {
            // Get due questions count for this specific quiz
            const dueQuestionsResult = await window.quizIpc.getQuizDueQuestions(
              quiz.id!,
            );

            console.log(
              `Quiz "${quiz.title}" due questions:`,
              dueQuestionsResult,
            ); // Debug log

            const dueQuestionsCount =
              dueQuestionsResult.success && dueQuestionsResult.questions
                ? dueQuestionsResult.questions.length
                : 0;

            console.log(`Quiz "${quiz.title}" due count: ${dueQuestionsCount}`); // Debug log

            const questionsResult = await window.quizIpc.get(quiz.id!);
            if (!questionsResult.success) return null;

            const scheduledQuestions = questionsResult.quiz!.questions.filter(
              (q) => q.scheduled,
            );
            if (scheduledQuestions.length === 0) return null;

            // Let's also log the scheduled questions to see their review dates
            console.log(
              `Quiz "${quiz.title}" scheduled questions:`,
              scheduledQuestions.map((q) => ({
                id: q.id,
                text: q.text.substring(0, 50),
                next_review_date: q.next_review_date,
                scheduled: q.scheduled,
              })),
            );

            // ... rest of your code
            const nextReviewDates = scheduledQuestions
              .map((q) => q.next_review_date)
              .filter((date) => date)
              .sort();

            const nextReviewDate =
              nextReviewDates.length > 0
                ? new Date(nextReviewDates[0])
                : new Date(Date.now() + 24 * 60 * 60 * 1000);

            const historyResult = await window.quizIpc.getAttemptHistory(
              quiz.id!,
            );
            const accuracy =
              historyResult.success && historyResult.history
                ? Math.round(
                    historyResult.history.reduce(
                      (sum: number, attempt: any) => sum + attempt.percentage,
                      0,
                    ) / historyResult.history.length,
                  )
                : 75;

            const result = {
              ...quiz,
              dueDate: nextReviewDate,
              scheduledQuestionsCount: scheduledQuestions.length,
              accuracy: accuracy,
              dueQuestionsCount: dueQuestionsCount,
              lastReviewed:
                scheduledQuestions
                  .map((q) => q.last_reviewed)
                  .filter((date) => date)
                  .sort()
                  .pop() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            };

            console.log(`Final quiz data for "${quiz.title}":`, {
              dueQuestionsCount: result.dueQuestionsCount,
              scheduledQuestionsCount: result.scheduledQuestionsCount,
              dueDate: result.dueDate,
            });

            return result;
          } catch (error) {
            console.error(`Error processing quiz ${quiz.title}:`, error);
            return null;
          }
        }),
      );

      setSchedulingData({
        dueCounts,
        scheduledQuizzes: scheduledQuizzes.filter((quiz) => quiz !== null),
      });
    } catch (error) {
      console.error("Error in loadSchedulingData:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizzes && quizzes.length > 0) {
      loadSchedulingData();
    } else {
      setLoading(false);
    }
  }, [quizzes]);

  const filterQuizzes = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case "due-today":
        return schedulingData.scheduledQuizzes.filter(
          (quiz) => quiz.dueDate.toDateString() === today.toDateString(),
        );
      case "overdue":
        return schedulingData.scheduledQuizzes.filter(
          (quiz) => quiz.dueDate < now,
        );
      case "upcoming":
        return schedulingData.scheduledQuizzes.filter(
          (quiz) => quiz.dueDate > now,
        );
      default:
        return schedulingData.scheduledQuizzes;
    }
  };

  const filteredQuizzes = filterQuizzes();

  const startGeneralReview = async () => {
    try {
      await loadSchedulingData();

      const result = await window.quizIpc.getMixedReview(30);
      if (result.success && result.questions && result.questions.length > 0) {
        const generalQuiz: QuizDetails = {
          id: -1,
          title: "Mixed Review Session",
          questions: result.questions,
          count: result.questions.length,
          created_at: new Date().toISOString(),
        };
        setQuizInReview(generalQuiz);
        setQuizView("inReview");
      } else {
        const dueCountResult = await window.quizIpc.getDueQuestionsCount();
        if (dueCountResult.success && dueCountResult.counts) {
          const totalDue =
            dueCountResult.counts.today + dueCountResult.counts.overdue;
          if (totalDue === 0) {
            toast.error(
              "No questions are scheduled for review. Please schedule some questions first!",
            );
          } else {
            toast.error(
              `Found ${totalDue} due questions but unable to start review. Please try again.`,
            );
          }
        } else {
          toast.error("No questions are due for review right now!");
        }
      }
    } catch (error) {
      toast.error("Failed to start general review");
    }
  };

  const startWeakQuestionsReview = async () => {
    try {
      const scheduleResult = await window.quizIpc.scheduleTopFailedQuestions();
      if (!scheduleResult.success) {
        toast.error("No questions need extra practice right now!");
        return;
      }

      await loadSchedulingData();

      const result = await window.quizIpc.getMixedReview(20);
      if (result.success && result.questions && result.questions.length > 0) {
        const weakQuestionsQuiz: QuizDetails = {
          id: -2,
          title: "Weak Questions Practice",
          questions: result.questions,
          count: result.questions.length,
          created_at: new Date().toISOString(),
        };
        setQuizInReview(weakQuestionsQuiz);
        setQuizView("inReview");
      } else {
        toast.error("No weak questions found for review!");
      }
    } catch (error) {
      toast.error("Failed to start weak questions review");
    }
  };

  const startReview = async (quizId: number) => {
    try {
      const dueQuestionsResult = await window.quizIpc.getQuizDueQuestions(
        quizId,
        1,
      );

      if (
        dueQuestionsResult.success &&
        dueQuestionsResult.questions &&
        dueQuestionsResult.questions.length > 0
      ) {
        const quiz = quizzes?.find((q) => q.id === quizId);
        if (quiz) {
          setQuizInReview(quiz);
          setQuizView("inReview");
        }
      } else {
        toast.error("No questions are due for review in this quiz!");
      }
    } catch (error) {
      console.error("Error starting quiz review:", error);
      toast.error("Failed to start quiz review");
    }
  };

  if (loading || loadingAnalytics) {
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
      <div className="max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-soma-text-primary mb-3">
            Quiz Reviews
          </h1>
          <p className="text-soma-text-secondary">
            Track your progress and review scheduled quizzes
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-soma-dark p-5 rounded-xl mb-8 flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/20 rounded-lg flex-shrink-0">
            <Lightbulb className="text-soma-warning" size={20} />
          </div>
          <p className="text-soma-text-primary text-sm leading-relaxed">
            Soma Review uses spaced repetition to help you learn and retain
            information effectively. New questions are automatically scheduled
            for review when created.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div
            className="bg-soma-dark rounded-2xl p-6 hover:bg-soma-medium transition-all group cursor-pointer"
            onClick={startGeneralReview}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-soma-accent1/20 rounded-xl">
                  <Sparkles className="text-soma-accent1" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-soma-text-primary">
                    Start General Review
                  </h3>
                  <p className="text-soma-text-secondary text-sm mt-1">
                    Review all due questions across all quizzes
                  </p>
                </div>
              </div>
              <Play
                className="text-soma-accent1 group-hover:translate-x-1 transition-transform"
                size={24}
              />
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-soma-lightest" />
                <span className="text-soma-text-secondary">
                  {schedulingData.dueCounts.today} due today
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-soma-error" />
                <span className="text-soma-text-secondary">
                  {schedulingData.dueCounts.overdue} overdue
                </span>
              </div>
            </div>
          </div>

          <div
            className="bg-soma-dark rounded-2xl p-6 hover:bg-soma-medium transition-all group cursor-pointer"
            onClick={startWeakQuestionsReview}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-soma-warning/20 rounded-xl">
                  <Target className="text-soma-warning" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-soma-text-primary">
                    Review Weak Questions
                  </h3>
                  <p className="text-soma-text-secondary text-sm mt-1">
                    Focus on questions with low accuracy
                  </p>
                </div>
              </div>
              <Play
                className="text-soma-warning group-hover:translate-x-1 transition-transform"
                size={24}
              />
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-soma-warning" />
                <span className="text-soma-text-secondary">
                  Based on recent performance
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards using real data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-warning/20 rounded-xl">
                <Calendar className="text-soma-warning" size={24} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Due Today
              </span>
            </div>
            <p className="text-3xl font-bold text-soma-text-primary">
              {schedulingData.dueCounts.today}
            </p>
            <p className="text-sm text-soma-lightest mt-2">Ready for review</p>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-warning/20 rounded-xl">
                <AlertCircle className="text-soma-warning" size={24} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Overdue Questions
              </span>
            </div>
            <p className="text-3xl font-bold text-soma-text-primary">
              {schedulingData.dueCounts.overdue}
            </p>
            <p className="text-sm text-soma-lightest mt-2">Need attention</p>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-success/20 rounded-xl">
                <TrendingUp className="text-soma-success" size={24} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Scheduled Questions
              </span>
            </div>
            <p className="text-3xl font-bold text-soma-text-primary">
              {schedulingData.scheduledQuizzes.reduce(
                (total, quiz) => total + (quiz.scheduledQuestionsCount || 0),
                0,
              )}
            </p>
            <p className="text-sm text-soma-lightest mt-2">In rotation</p>
          </div>
        </div>

        {/* Review Summary using real data */}
        <div className="bg-soma-dark rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-soma-text-primary mb-4 flex items-center gap-3">
            <Clock className="text-soma-accent2" size={24} />
            Today's Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-soma-medium/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-soma-text-secondary">Due Today</span>
                <span className="px-2 py-1 bg-soma-accent1/20 text-soma-accent1 rounded-lg text-sm font-medium">
                  {schedulingData.dueCounts.today}
                </span>
              </div>
              <p className="text-sm text-soma-lightest">
                Questions scheduled for today
              </p>
            </div>
            <div className="bg-soma-medium/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-soma-text-secondary">Overdue</span>
                <span className="px-2 py-1 bg-soma-error/20 text-soma-error rounded-lg text-sm font-medium">
                  {schedulingData.dueCounts.overdue}
                </span>
              </div>
              <p className="text-sm text-soma-lightest">
                Questions waiting for review
              </p>
            </div>
            <div className="bg-soma-medium/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-soma-text-secondary">Upcoming</span>
                <span className="px-2 py-1 bg-soma-success/20 text-soma-success rounded-lg text-sm font-medium">
                  {schedulingData.dueCounts.upcoming}
                </span>
              </div>
              <p className="text-sm text-soma-lightest">Future reviews</p>
            </div>
          </div>
        </div>

        {/* Quiz List with Filters using real data */}
        <div className="bg-soma-dark rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-soma-text-primary flex items-center gap-3">
              <BarChart3 className="text-soma-accent2" size={24} />
              Review by Quiz Set
            </h2>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {(["all", "due-today", "overdue", "upcoming"] as const).map(
                (filterType) => (
                  <button
                    type="button"
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filter === filterType
                        ? "bg-soma-accent1 text-white"
                        : "bg-soma-medium text-soma-text-secondary hover:bg-soma-light"
                    }`}
                  >
                    {filterType.charAt(0).toUpperCase() +
                      filterType.slice(1).replace("-", " ")}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredQuizzes.length > 0 ? (
              filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-soma-medium/50 rounded-xl p-5 hover:bg-soma-medium transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-soma-text-primary truncate min-w-0 max-w-sm">
                          {quiz.title}
                        </h3>
                        <span className="text-sm text-soma-text-secondary">
                          {quiz.scheduledQuestionsCount || 0} scheduled
                          questions
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-soma-lightest" />
                          <span className="text-soma-text-secondary">
                            Due {quiz.dueDate.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle
                            size={14}
                            className="text-soma-success"
                          />
                          <span className="text-soma-text-secondary">
                            {`${Number.isFinite(quiz.accuracy) ? quiz.accuracy : 0}% accuracy`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-soma-accent3" />
                          <span className="text-soma-text-secondary">
                            Last:{" "}
                            {new Date(quiz.lastReviewed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => quiz.id && startReview(quiz.id)}
                      className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all ${
                        quiz.dueQuestionsCount > 0
                          ? "bg-soma-accent2 text-white hover:bg-soma-accent2/90"
                          : "bg-soma-medium text-soma-text-secondary cursor-not-allowed"
                      }`}
                    >
                      <Play size={18} />
                      {quiz.dueQuestionsCount > 0
                        ? "Start Review"
                        : "No Questions Due"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-soma-medium/30 rounded-full">
                    <CheckCircle
                      size={32}
                      className="text-soma-text-secondary"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-soma-text-primary mb-2">
                      {filter === "all"
                        ? "No scheduled quizzes"
                        : "No quizzes in this category"}
                    </h3>
                    <p className="text-soma-text-secondary">
                      {filter === "all"
                        ? "Schedule some quiz questions to see them here"
                        : "Try changing the filter to see more quizzes"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuizReview;
