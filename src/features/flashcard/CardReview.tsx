import {
  Lightbulb,
  Brain,
  Calendar,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  WalletCards,
  Zap,
  Award,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "sonner";

type ReviewFilter = "all" | "due-today" | "overdue" | "upcoming";

const CardReview: React.FC = () => {
  const { getMessage, decks, setCardView, setDeckInView } = useAppContext();
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [analytics, setAnalytics] = useState({
    totalCards: 0,
    scheduledCards: 0,
    masteredCards: 0,
    learningCards: 0,
    dueToday: 0,
    overdue: 0,
    upcoming: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get card analytics
      const analyticsResult = await window.deckIpc.getAnalytics();
      const cardAnalytics = analyticsResult.success
        ? analyticsResult.data
        : {
            totalCards: 0,
            scheduledCards: 0,
            masteredCards: 0,
            learningCards: 0,
          };

      // Get due cards count
      const dueCountResult = await window.deckIpc.getDueCardsCount();
      const dueCounts = dueCountResult.success
        ? dueCountResult.data
        : {
            today: 0,
            overdue: 0,
            upcoming: 0,
          };

      setAnalytics({
        ...cardAnalytics,
        dueToday: dueCounts.today,
        overdue: dueCounts.overdue,
        upcoming: dueCounts.upcoming,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const scheduledDecks =
    decks?.map((deck) => ({
      ...deck,
      dueCards: Math.floor(Math.random() * 15) + 1, // TODO: Get real due cards per deck
      overdueCards: Math.floor(Math.random() * 5),
      newCards: Math.floor(Math.random() * 10),
      lastReviewed: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      ),
      accuracy: Math.floor(Math.random() * 30) + 70,
      difficulty: Math.random() * 5,
    })) || [];

  const filterDecks = () => {
    switch (filter) {
      case "due-today":
        return scheduledDecks.filter((deck) => deck.dueCards > 0);
      case "overdue":
        return scheduledDecks.filter((deck) => deck.overdueCards > 0);
      case "upcoming":
        return scheduledDecks.filter((deck) => deck.newCards > 0);
      default:
        return scheduledDecks;
    }
  };

  const filteredDecks = filterDecks();

  const startGeneralReview = async () => {
    try {
      const result = await window.deckIpc.getMixedReview(30);
      if (result.success && result.data && result.data.length > 0) {
        setCardView("inReview");
      } else {
        if (analytics.dueToday === 0 && analytics.overdue === 0) {
          toast.error(
            "No cards are scheduled for review. Please schedule some cards first!",
          );
        } else {
          toast.error("No cards are due for review right now!");
        }
      }
    } catch (error) {
      toast.error("Failed to start general review");
    }
  };

  const startWeakCardsReview = async () => {
    try {
      const result = await window.deckIpc.getWeakCards(20);
      if (result.success && result.data && result.data.length > 0) {
        // Schedule weak cards for immediate review
        await window.deckIpc.scheduleAllCards();
        setCardView("inReview");
      } else {
        toast.error("No weak cards found for review!");
      }
    } catch (error) {
      toast.error("Failed to start weak cards review");
    }
  };

  const startReview = (deckId: number) => {
    const deck = decks?.find((d) => d.id === deckId);
    if (deck) {
      setDeckInView(deck);
      setCardView("inReview"); // Use the mixed review for individual decks too
    }
  };

  if (loading) {
    return (
      <section className="w-full min-h-screen bg-soma-darkest overflow-auto p-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soma-accent3"></div>
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
            {getMessage("flashcard.review")}
          </h1>
          <p className="text-soma-text-secondary">
            Track your progress and review scheduled flashcards
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-soma-dark p-5 rounded-xl mb-8 flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/20 rounded-lg flex-shrink-0">
            <Lightbulb className="text-soma-warning" size={20} />
          </div>
          <p className="text-soma-text-primary text-sm leading-relaxed">
            Soma Review uses spaced repetition to help you learn and retain
            information effectively. Cards will appear based on how well you
            remember them.
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
                <div className="p-3 bg-soma-accent2/20 rounded-xl">
                  <Sparkles className="text-soma-accent2" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-soma-text-primary">
                    Start General Review
                  </h3>
                  <p className="text-soma-text-secondary text-sm mt-1">
                    Review all due cards across all decks
                  </p>
                </div>
              </div>
              <Play
                className="text-soma-accent2 group-hover:translate-x-1 transition-transform"
                size={24}
              />
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-soma-lightest" />
                <span className="text-soma-text-secondary">
                  {analytics.dueToday} due today
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-soma-error" />
                <span className="text-soma-text-secondary">
                  {analytics.overdue} overdue
                </span>
              </div>
            </div>
          </div>

          <div
            className="bg-soma-dark rounded-2xl p-6 hover:bg-soma-medium transition-all group cursor-pointer"
            onClick={startWeakCardsReview}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-soma-warning/20 rounded-xl">
                  <Target className="text-soma-warning" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-soma-text-primary">
                    Review Weak Cards
                  </h3>
                  <p className="text-soma-text-secondary text-sm mt-1">
                    Focus on cards with low accuracy
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
                  Based on performance
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              {analytics.dueToday}
            </p>
            <p className="text-sm text-soma-lightest mt-2">Ready for review</p>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-accent1/20 rounded-xl">
                <Target className="text-soma-accent1" size={24} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Total Cards
              </span>
            </div>
            <p className="text-3xl font-bold text-soma-text-primary">
              {analytics.totalCards}
            </p>
            <p className="text-sm text-soma-lightest mt-2">
              In your collection
            </p>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-accent3/20 rounded-xl">
                <Award className="text-soma-accent3" size={24} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Mastered Cards
              </span>
            </div>
            <p className="text-3xl font-bold text-soma-text-primary">
              {analytics.masteredCards}
            </p>
            <p className="text-sm text-soma-lightest mt-2">Well done!</p>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-accent2/20 rounded-xl">
                <Brain className="text-soma-accent2" size={24} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Learning
              </span>
            </div>
            <p className="text-3xl font-bold text-soma-text-primary">
              {analytics.learningCards}
            </p>
            <p className="text-sm text-soma-lightest mt-2">In progress</p>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="bg-soma-dark rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-soma-text-primary mb-4 flex items-center gap-3">
            <Clock className="text-soma-accent2" size={24} />
            Today's Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-soma-medium/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-soma-text-secondary">Due Today</span>
                <span className="px-2 py-1 bg-soma-accent1/20 text-soma-accent1 rounded-lg text-sm font-medium">
                  {analytics.dueToday}
                </span>
              </div>
              <p className="text-sm text-soma-lightest">
                Cards scheduled for today
              </p>
            </div>
            <div className="bg-soma-medium/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-soma-text-secondary">Overdue</span>
                <span className="px-2 py-1 bg-soma-error/20 text-soma-error rounded-lg text-sm font-medium">
                  {analytics.overdue}
                </span>
              </div>
              <p className="text-sm text-soma-lightest">
                Cards waiting for review
              </p>
            </div>
            <div className="bg-soma-medium/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-soma-text-secondary">Upcoming</span>
                <span className="px-2 py-1 bg-soma-success/20 text-soma-success rounded-lg text-sm font-medium">
                  {analytics.upcoming}
                </span>
              </div>
              <p className="text-sm text-soma-lightest">Future reviews</p>
            </div>
          </div>
        </div>

        {/* Deck List with Filters */}
        <div className="bg-soma-dark rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-soma-text-primary flex items-center gap-3">
              <WalletCards className="text-soma-accent2" size={24} />
              Review by Deck
            </h2>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {(["all", "due-today", "overdue", "upcoming"] as const).map(
                (filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filter === filterType
                        ? "bg-soma-accent2 text-white"
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
            {filteredDecks.length > 0 ? (
              filteredDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="bg-soma-medium/50 rounded-xl p-5 hover:bg-soma-medium transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-soma-text-primary">
                          {deck.title}
                        </h3>
                        <span className="text-sm text-soma-text-secondary">
                          {deck.cards.length} cards
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Zap size={14} className="text-soma-warning" />
                          <span className="text-soma-text-secondary">
                            {deck.dueCards} due
                          </span>
                        </div>
                        {deck.overdueCards > 0 && (
                          <div className="flex items-center gap-1.5">
                            <XCircle size={14} className="text-soma-error" />
                            <span className="text-soma-text-secondary">
                              {deck.overdueCards} overdue
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <CheckCircle
                            size={14}
                            className="text-soma-success"
                          />
                          <span className="text-soma-text-secondary">
                            {deck.accuracy}% accuracy
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-soma-accent3" />
                          <span className="text-soma-text-secondary">
                            {deck.difficulty.toFixed(1)} difficulty
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deck.id && startReview(deck.id)}
                      className="px-4 py-2.5 bg-soma-accent2 text-white rounded-lg hover:bg-soma-accent2/90 transition-all flex items-center gap-2 font-medium"
                    >
                      <Play size={18} />
                      Start Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-soma-medium/30 rounded-full">
                    <WalletCards
                      size={32}
                      className="text-soma-text-secondary"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-soma-text-primary mb-2">
                      {filter === "all"
                        ? "No decks available"
                        : "No decks in this category"}
                    </h3>
                    <p className="text-soma-text-secondary">
                      {filter === "all"
                        ? "Create and schedule decks to see them here"
                        : "Try changing the filter to see more decks"}
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

export default CardReview;
