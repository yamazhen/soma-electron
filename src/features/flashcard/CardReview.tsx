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
  Settings,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "sonner";

type ReviewFilter = "all" | "due-today" | "overdue" | "upcoming";

interface DeckWithStats {
  id?: number;
  title: string;
  cards: any[];
  dueCards: number;
  overdueCards: number;
  upcomingCards: number;
  lastReviewed: Date;
  accuracy: number;
  difficulty: number;
  totalReviews: number;
  scheduledCards: number;
  hasUnscheduledCards: boolean;
}

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
  const [decksWithStats, setDecksWithStats] = useState<DeckWithStats[]>([]);

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

      // Load deck stats with real data
      if (decks && decks.length > 0) {
        const decksWithStatsData = await Promise.all(
          decks
            .filter((deck) => deck.id && deck.id > 0) // ✅ Filter out special deck IDs
            .map(async (deck) => {
              try {
                const [
                  dueCountResult,
                  accuracyResult,
                  difficultyResult,
                  reviewStatsResult,
                  unscheduledResult,
                ] = await Promise.all([
                  window.deckIpc.getDueCardsCountByDeck(deck.id!),
                  window.deckIpc.getDeckAccuracy(deck.id!),
                  window.deckIpc.getDeckDifficulty(deck.id!),
                  window.deckIpc.getDeckReviewStats(deck.id!),
                  window.deckIpc.hasUnscheduledCards(deck.id!),
                ]);

                // ... rest of the mapping logic stays the same
                const dueCounts = dueCountResult.success
                  ? dueCountResult.data
                  : { today: 0, overdue: 0, upcoming: 0 };

                const accuracy = accuracyResult.success
                  ? accuracyResult.data || 0
                  : 0;
                const difficulty = difficultyResult.success
                  ? difficultyResult.data || 2.5
                  : 2.5;
                const reviewStats = reviewStatsResult.success
                  ? reviewStatsResult.data
                  : { lastReviewed: new Date().toISOString(), totalReviews: 0 };
                const hasUnscheduled = unscheduledResult.success
                  ? unscheduledResult.data || false
                  : false;

                const scheduledCards = deck.cards.filter(
                  (card) => card.scheduled === 1,
                ).length;

                return {
                  ...deck,
                  dueCards: dueCounts.today,
                  overdueCards: dueCounts.overdue,
                  upcomingCards: dueCounts.upcoming,
                  lastReviewed: new Date(reviewStats.lastReviewed),
                  accuracy: accuracy,
                  difficulty: difficulty,
                  totalReviews: reviewStats.totalReviews,
                  scheduledCards: scheduledCards,
                  hasUnscheduledCards: hasUnscheduled,
                };
              } catch (error) {
                console.error(
                  `Error loading stats for deck ${deck.id}:`,
                  error,
                );
                return {
                  ...deck,
                  dueCards: 0,
                  overdueCards: 0,
                  upcomingCards: 0,
                  lastReviewed: new Date(),
                  accuracy: 0,
                  difficulty: 0,
                  totalReviews: 0,
                  scheduledCards: 0,
                  hasUnscheduledCards: false,
                };
              }
            }),
        );
        setDecksWithStats(decksWithStatsData);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [decks]);

  const filterDecks = () => {
    switch (filter) {
      case "due-today":
        return decksWithStats.filter((deck) => deck.dueCards > 0);
      case "overdue":
        return decksWithStats.filter((deck) => deck.overdueCards > 0);
      case "upcoming":
        return decksWithStats.filter((deck) => deck.upcomingCards > 0);
      default:
        return decksWithStats;
    }
  };

  const filteredDecks = filterDecks();

  const startGeneralReview = async () => {
    try {
      // First check if we have any due cards
      const dueCountResult = await window.deckIpc.getDueCardsCount();
      const dueCounts = dueCountResult.success
        ? dueCountResult.data
        : { today: 0, overdue: 0, upcoming: 0 };

      if (dueCounts.today === 0 && dueCounts.overdue === 0) {
        // Check if we have unscheduled cards across all decks
        const hasAnyUnscheduled = decksWithStats.some(
          (deck) => deck.hasUnscheduledCards,
        );

        if (hasAnyUnscheduled) {
          const shouldSchedule = confirm(
            "No cards are scheduled for review. Would you like to schedule all your cards for spaced repetition?",
          );

          if (shouldSchedule) {
            try {
              const result = await window.deckIpc.scheduleAllCards();
              if (result.success) {
                toast.success("All cards have been scheduled!");
                await loadAnalytics();
                // Try starting review again after scheduling
                setTimeout(() => startGeneralReview(), 1000);
                return;
              } else {
                toast.error("Failed to schedule cards");
                return;
              }
            } catch (error) {
              toast.error("Error scheduling cards");
              return;
            }
          } else {
            return; // User chose not to schedule
          }
        } else {
          toast.error(
            "No cards are due for review and no unscheduled cards found!",
          );
          return;
        }
      }

      // Try to get due cards for review
      const result = await window.deckIpc.getMixedReview(30);
      if (result.success && result.data && result.data.length > 0) {
        setCardView("inReview");
      } else {
        toast.error("No cards are available for review right now!");
      }
    } catch (error) {
      console.error("Error starting general review:", error);
      toast.error("Failed to start general review");
    }
  };

  const startWeakCardsReview = async () => {
    try {
      // Get weak cards first
      const result = await window.deckIpc.getWeakCards(20);
      if (result.success && result.data && result.data.length > 0) {
        // Don't create a fake deck - just pass the cards directly
        // You might need to update your context to handle this
        const weakCards = result.data.map((card) => ({
          ...card,
          deck_title: card.deck_title || "Mixed Deck",
        }));

        // Set a flag in context to indicate this is a weak cards review
        setDeckInView({
          id: -1,
          title: "Weak Cards Practice",
          cards: weakCards,
          isWeakCardsReview: true, // Add this flag
        });
        setCardView("inReview");
      } else {
        // Show appropriate error messages without switching views
        if (analytics.totalCards === 0) {
          toast.error("No cards found. Please create some flashcards first!");
        } else if (analytics.scheduledCards === 0) {
          toast.error(
            "No cards are scheduled. Please schedule cards for review first!",
          );
        } else {
          toast.error(
            "No weak cards found. All your cards are performing well!",
          );
        }
      }
    } catch (error) {
      console.error("Error starting weak cards review:", error);
      toast.error("Failed to start weak cards review");
    }
  };

  const scheduleAllCards = async () => {
    try {
      const result = await window.deckIpc.scheduleAllCards();
      if (result.success) {
        toast.success("All cards have been scheduled for review!");
        await loadAnalytics();
      } else {
        toast.error("Failed to schedule cards");
      }
    } catch (error) {
      console.error("Error scheduling cards:", error);
      toast.error("Error scheduling cards");
    }
  };

  const scheduleDeckCards = async (deckId: number) => {
    try {
      const result = await window.deckIpc.scheduleDeckCards(deckId);
      if (result.success) {
        toast.success("Deck cards have been scheduled for review!");
        await loadAnalytics();
      } else {
        toast.error("Failed to schedule deck cards");
      }
    } catch (error) {
      console.error("Error scheduling deck cards:", error);
      toast.error("Error scheduling deck cards");
    }
  };

  const startReview = async (deckId: number) => {
    try {
      // Handle special deck IDs (like weak cards review)
      if (deckId < 0) {
        const deck = decksWithStats.find((d) => d.id === deckId);
        if (deck) {
          setDeckInView(deck);
          setCardView("inReview");
        }
        return;
      }

      // Check if this deck has due cards (only for real decks with positive IDs)
      const dueCardsResult = await window.deckIpc.getDueCardsByDeck(deckId, 1);

      if (
        dueCardsResult.success &&
        dueCardsResult.data &&
        dueCardsResult.data.length > 0
      ) {
        const deck = decks?.find((d) => d.id === deckId);
        if (deck) {
          setDeckInView(deck);
          setCardView("inReview");
        }
      } else {
        toast.error("No cards are due for review in this deck!");
      }
    } catch (error) {
      console.error("Error starting deck review:", error);
      toast.error("Failed to start deck review");
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
          <div className="flex-1">
            <p className="text-soma-text-primary text-sm leading-relaxed">
              Soma Review uses spaced repetition to help you learn and retain
              information effectively. Cards will appear based on how well you
              remember them.
            </p>
          </div>
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
                Scheduled
              </span>
            </div>
            <p className="text-3xl font-bold text-soma-text-primary">
              {analytics.scheduledCards}
            </p>
            <p className="text-sm text-soma-lightest mt-2">In rotation</p>
          </div>
        </div>

        {/* Scheduling Notice */}
        {analytics.totalCards > 0 && analytics.scheduledCards === 0 && (
          <div className="bg-soma-warning/10 border border-soma-warning/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-soma-warning/20 rounded-xl">
                <AlertCircle className="text-soma-warning" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-soma-text-primary mb-2">
                  Cards Not Scheduled
                </h3>
                <p className="text-soma-text-secondary mb-4">
                  You have {analytics.totalCards} cards but none are scheduled
                  for spaced repetition. Schedule them to start your learning
                  journey!
                </p>
                <button
                  onClick={scheduleAllCards}
                  className="px-4 py-2 bg-soma-warning text-soma-darkest rounded-lg hover:bg-soma-warning/90 transition-all font-medium"
                >
                  Schedule All Cards Now
                </button>
              </div>
            </div>
          </div>
        )}

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
                        <h3 className="text-lg font-semibold text-soma-text-primary truncate max-w-sm">
                          {deck.title}
                        </h3>
                        <span className="text-sm text-soma-text-secondary">
                          {deck.cards.length} cards
                        </span>
                        {deck.hasUnscheduledCards && (
                          <span className="px-2 py-1 bg-soma-warning/20 text-soma-warning rounded-lg text-xs font-medium">
                            Has unscheduled cards
                          </span>
                        )}
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
                            {deck.totalReviews} sessions
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target size={14} className="text-soma-accent1" />
                          <span className="text-soma-text-secondary">
                            {deck.difficulty} difficulty
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {deck.hasUnscheduledCards && (
                        <button
                          onClick={() => deck.id && scheduleDeckCards(deck.id)}
                          className="px-3 py-2 bg-soma-warning/20 text-soma-warning rounded-lg hover:bg-soma-warning/30 transition-all text-sm font-medium"
                        >
                          <Settings size={16} className="inline mr-1" />
                          Schedule
                        </button>
                      )}
                      <button
                        onClick={() => deck.id && startReview(deck.id)}
                        className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all ${
                          deck.dueCards > 0
                            ? "bg-soma-accent2 text-white hover:bg-soma-accent2/90"
                            : "bg-soma-medium text-soma-text-secondary cursor-not-allowed"
                        }`}
                      >
                        <Play size={18} />
                        {deck.dueCards > 0 ? "Start Review" : "No Cards Ready"}
                      </button>
                    </div>
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
