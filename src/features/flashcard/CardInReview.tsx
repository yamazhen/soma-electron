import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { Timer, CheckCircle, XCircle, RotateCcw } from "lucide-react";

const CardInReview: React.FC = () => {
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const { setCardView, recordActivity, trackStudyActivity } = useAppContext();

  useEffect(() => {
    loadDueCards();
  }, []);

  useEffect(() => {
    if (dueCards.length > 0) {
      trackStudyActivity("flashcard", "Mixed Flashcard Review");
    }
  }, [dueCards, trackStudyActivity]);

  const loadDueCards = async () => {
    try {
      setLoading(true);
      const result = await window.deckIpc.getDueCards(20); // Limit to 20 cards

      if (result.success && result.data) {
        setDueCards(result.data);
        if (result.data.length === 0) {
          setReviewComplete(true);
        }
      } else {
        console.error("Failed to load due cards:", result.error);
        setReviewComplete(true);
      }
    } catch (error) {
      console.error("Error loading due cards:", error);
      setReviewComplete(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!dueCards[currentIndex]) return;

    const responseTime = (Date.now() - startTime) / 1000;

    try {
      // Submit the review
      const result = await window.deckIpc.submitReview({
        cardId: dueCards[currentIndex].id,
        isCorrect,
        responseTime,
      });

      if (result.success) {
        // Update score
        setScore((prev) => ({
          correct: prev.correct + (isCorrect ? 1 : 0),
          total: prev.total + 1,
        }));

        // Move to next card or finish
        if (currentIndex < dueCards.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setShowBack(false);
          setStartTime(Date.now());
        } else {
          // Review complete
          setReviewComplete(true);

          // Log activity
          recordActivity("flashcard", {
            title: "Mixed Flashcard Review",
            entityId: "mixed-review",
            cardCount: dueCards.length,
          });
        }
      } else {
        console.error("Failed to submit review:", result.error);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const flipCard = () => {
    setShowBack(!showBack);
  };

  const resetReview = () => {
    setCurrentIndex(0);
    setShowBack(false);
    setStartTime(Date.now());
    setReviewComplete(false);
    setScore({ correct: 0, total: 0 });
    loadDueCards();
  };

  if (loading) {
    return (
      <section className="h-full w-full bg-soma-darkest flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soma-accent3"></div>
      </section>
    );
  }

  if (reviewComplete || dueCards.length === 0) {
    return (
      <section className="h-full w-full bg-soma-darkest flex items-center justify-center">
        <div className="bg-soma-dark rounded-xl p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-soma-text-primary mb-6 text-center">
            {dueCards.length === 0 ? "No Cards Due!" : "Review Complete!"}
          </h2>

          {score.total > 0 && (
            <div className="bg-soma-medium rounded-xl p-6 mb-6">
              <p className="text-4xl font-bold text-soma-text-primary text-center mb-2">
                {Math.round((score.correct / score.total) * 100)}%
              </p>
              <p className="text-soma-text-secondary text-center">
                Score: {score.correct}/{score.total}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {dueCards.length === 0 ? (
              <p className="text-soma-text-secondary text-center mb-6">
                Great job! No flashcards are due for review right now.
              </p>
            ) : (
              <div className="bg-soma-medium rounded-xl p-4 mb-6">
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-soma-success">
                      {score.correct}
                    </p>
                    <p className="text-soma-text-secondary text-sm">Correct</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-soma-error">
                      {score.total - score.correct}
                    </p>
                    <p className="text-soma-text-secondary text-sm">
                      Incorrect
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={resetReview}
              className="w-full p-3 rounded-xl bg-soma-accent3 text-white hover:bg-opacity-90 transition-all mb-3 flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Review Again
            </button>

            <button
              onClick={() => setCardView("review")}
              className="w-full p-3 rounded-xl bg-soma-accent1 text-white hover:bg-opacity-90 transition-all cursor-pointer"
            >
              Back to Review
            </button>
          </div>
        </div>
      </section>
    );
  }

  const currentCard = dueCards[currentIndex];

  return (
    <section className="h-full w-full bg-soma-darkest flex items-center justify-center">
      <div className="w-full max-w-2xl p-6">
        {/* Progress Bar */}
        <div className="bg-soma-dark rounded-xl p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-soma-text-secondary">
              Card {currentIndex + 1} of {dueCards.length}
            </p>
            <div className="flex items-center gap-2">
              <Timer className="text-soma-accent3" size={20} />
              <span className="text-soma-text-primary font-medium">
                {currentCard?.deck_title || "Mixed Review"}
              </span>
            </div>
          </div>
          <div className="w-full bg-soma-medium rounded-full h-2">
            <div
              className="bg-soma-accent3 rounded-full h-2 transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / dueCards.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-soma-dark rounded-xl p-12 min-h-[400px] flex flex-col items-center justify-center relative">
          <div className="text-center max-w-lg w-full">
            <p className="text-2xl text-soma-text-primary leading-relaxed mb-8">
              {showBack ? currentCard?.back : currentCard?.front}
            </p>
          </div>

          {/* Side indicator */}
          <div
            className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
              showBack
                ? "bg-soma-accent3/20 text-soma-accent3"
                : "bg-soma-accent1/20 text-soma-accent1"
            }`}
          >
            {showBack ? "Answer" : "Question"}
          </div>

          {!showBack ? (
            // Show card button
            <button
              onClick={flipCard}
              className="mt-8 px-6 py-3 bg-soma-accent1 text-white rounded-xl hover:bg-opacity-90 transition-all"
            >
              Show Answer
            </button>
          ) : (
            // Answer buttons
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => handleAnswer(false)}
                className="px-6 py-3 bg-soma-error text-white rounded-xl hover:bg-opacity-90 transition-all flex items-center gap-2"
              >
                <XCircle size={20} />
                Incorrect
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="px-6 py-3 bg-soma-success text-white rounded-xl hover:bg-opacity-90 transition-all flex items-center gap-2"
              >
                <CheckCircle size={20} />
                Correct
              </button>
            </div>
          )}

          {/* Keyboard hint */}
          <p className="absolute bottom-4 text-sm text-soma-text-secondary">
            {!showBack ? "Click to reveal answer" : "Rate your performance"}
          </p>
        </div>

        {/* Score display */}
        <div className="flex justify-center mt-6">
          <div className="bg-soma-dark rounded-xl px-6 py-3">
            <p className="text-soma-text-secondary text-sm">
              Score: {score.correct}/{score.total} (
              {score.total > 0
                ? Math.round((score.correct / score.total) * 100)
                : 0}
              %)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardInReview;
