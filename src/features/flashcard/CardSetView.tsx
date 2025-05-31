import { useState, useEffect } from "react";
import type React from "react";
import { useAppContext } from "../../context/AppContext";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Grid3X3,
  List,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Tippy from "@tippyjs/react";

const CardSetView: React.FC = () => {
  const { deckInView, setCardView, trackStudyActivity } = useAppContext();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [viewMode, setViewMode] = useState<"stack" | "grid">("stack");
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  useEffect(() => {
    if (deckInView) {
      trackStudyActivity("flashcard", deckInView.title);
    }
  }, [deckInView, trackStudyActivity]);

  if (deckInView === undefined) {
    return (
      <section className="h-full w-full bg-soma-darkest flex items-center justify-center">
        <div className="bg-soma-dark rounded-xl p-8 max-w-md">
          <div className="flex flex-col items-center gap-4">
            <Package size={48} className="text-soma-text-secondary" />
            <h2 className="text-xl font-semibold text-soma-text-primary">
              No deck selected
            </h2>
            <button
              type="button"
              onClick={() => setCardView("listing")}
              className="px-4 py-2 bg-soma-accent1 text-white rounded-lg hover:bg-opacity-90 transition-all cursor-pointer"
            >
              Back to Decks
            </button>
          </div>
        </div>
      </section>
    );
  }

  const cards = deckInView.cards;

  const deleteDeck = async () => {
    // TODO: call ipc to delete the deck
  };

  const handleCardClick = (idx: number) => {
    if (viewMode === "stack") {
      setShowBack(!showBack);
    } else {
      setCurrentIdx(idx);
      setViewMode("stack");
    }
  };

  const prev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setShowBack(false);
    }
  };

  const next = () => {
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setShowBack(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (viewMode === "stack") {
        if (e.key === "ArrowLeft") setCurrentIdx((idx) => Math.max(0, idx - 1));
        if (e.key === "ArrowRight")
          setCurrentIdx((idx) => Math.min(cards.length - 1, idx + 1));
        if (e.key === " ") {
          e.preventDefault();
          setShowBack(!showBack);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showBack, viewMode, cards.length]);

  return (
    <section className="h-full w-full bg-soma-darkest overflow-auto">
      <div className="min-h-full p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCardView("listing")}
                className="flex items-center gap-2 text-soma-text-secondary hover:text-soma-text-primary transition-colors cursor-pointer"
              >
                <ChevronLeft size={20} />
                Back to decks
              </button>

              <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div>
                      <Tippy
                        content="Delete deck"
                        placement="bottom"
                        arrow={true}
                        delay={200}
                        theme="custom"
                      >
                        <button
                          type="button"
                          className="p-2 bg-soma-error/20 text-soma-error rounded-lg hover:bg-soma-error/30 transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </Tippy>
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete{" "}
                        <span
                          className="inline-block max-w-[200px] truncate align-bottom font-medium"
                          title={deckInView.title}
                        >
                          "{deckInView.title}"
                        </span>{" "}
                        and all its cards.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteDeck}
                        className="bg-soma-error text-white hover:bg-soma-error/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <button
                  type="button"
                  onClick={() => setViewMode("stack")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "stack"
                      ? "bg-soma-accent1 text-white"
                      : "bg-soma-dark text-soma-text-secondary hover:bg-soma-medium"
                  }`}
                >
                  <Grid3X3 size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-soma-accent1 text-white"
                      : "bg-soma-dark text-soma-text-secondary hover:bg-soma-medium"
                  }`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-soma-text-primary truncate max-w-md">
                {deckInView.title}
              </h1>
              <span className="text-soma-text-secondary">
                {cards.length} cards
              </span>
            </div>
          </div>

          {/* Stack View */}
          {viewMode === "stack" && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-2xl mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-soma-text-secondary">
                    Progress
                  </span>
                  <span className="text-sm text-soma-text-primary font-medium">
                    {currentIdx + 1} / {cards.length}
                  </span>
                </div>
                <div className="w-full bg-soma-medium rounded-full h-2">
                  <div
                    className="bg-soma-accent1 rounded-full h-2 transition-all duration-300"
                    style={{
                      width: `${((currentIdx + 1) / cards.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Card Stack with side navigation buttons */}
              <div className="relative w-full max-w-2xl">
                {/* Left Navigation */}
                <button
                  type="button"
                  onClick={prev}
                  disabled={currentIdx === 0}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-30 p-3 rounded-full transition-all duration-200 ${
                    currentIdx === 0
                      ? "bg-soma-medium/30 text-soma-text-secondary cursor-not-allowed"
                      : "bg-soma-dark hover:bg-soma-medium text-soma-text-primary hover:scale-110 cursor-pointer"
                  }`}
                >
                  <ArrowLeft size={24} />
                </button>

                {/* Right Navigation */}
                <button
                  type="button"
                  onClick={next}
                  disabled={currentIdx === cards.length - 1}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-30 p-3 rounded-full transition-all duration-200 ${
                    currentIdx === cards.length - 1
                      ? "bg-soma-medium/30 text-soma-text-secondary cursor-not-allowed"
                      : "bg-soma-dark hover:bg-soma-medium text-soma-text-primary hover:scale-110 cursor-pointer "
                  }`}
                >
                  <ArrowRight size={24} />
                </button>

                {/* Shadow cards for stack effect */}
                {currentIdx < cards.length - 2 && (
                  <div className="absolute inset-0 transform translate-y-4 translate-x-4 opacity-30 z-0">
                    <div className="bg-soma-dark rounded-xl h-[400px]" />
                  </div>
                )}
                {currentIdx < cards.length - 1 && (
                  <div className="absolute inset-0 transform translate-y-2 translate-x-2 opacity-60 z-10">
                    <div className="bg-soma-dark rounded-xl h-[400px]" />
                  </div>
                )}

                {/* Main Card */}
                <div
                  onClick={() => handleCardClick(currentIdx)}
                  className="relative bg-soma-dark rounded-xl p-12 cursor-pointer min-h-[400px] flex flex-col items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 z-20 transform hover:scale-[1.02]"
                  onKeyDown={(e) => {
                    e.preventDefault();
                    if (e.key === " ") {
                      handleCardClick(currentIdx);
                    }
                  }}
                >
                  <div className="text-center w-full px-4">
                    <p className="text-2xl text-soma-text-primary leading-relaxed break-words hyphens-auto">
                      {showBack
                        ? cards[currentIdx].back
                        : cards[currentIdx].front}
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

                  {/* Click hint */}
                  <p className="absolute bottom-4 text-sm text-soma-text-secondary">
                    Click to flip • Space to flip • ← → to navigate
                  </p>
                </div>
              </div>

              {/* Minimalist Bottom Navigation */}
              <div className="flex items-center gap-8 mt-8">
                <button
                  type="button"
                  onClick={prev}
                  disabled={currentIdx === 0}
                  className={`group flex items-center gap-2 transition-all duration-200 ${
                    currentIdx === 0
                      ? "text-soma-text-secondary cursor-not-allowed opacity-50"
                      : "text-soma-text-secondary hover:text-soma-text-primary cursor-pointer"
                  }`}
                >
                  <ChevronLeft
                    size={20}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  <span className="text-sm font-medium">Previous</span>
                </button>

                <div className="flex gap-2">
                  {cards.map((card, index) => (
                    <button
                      type="button"
                      key={card.id}
                      onClick={() => setCurrentIdx(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentIdx
                          ? "w-8 bg-soma-accent1"
                          : "w-2 bg-soma-medium hover:bg-soma-light"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={next}
                  disabled={currentIdx === cards.length - 1}
                  className={`group flex items-center gap-2 transition-all duration-200 ${
                    currentIdx === cards.length - 1
                      ? "text-soma-text-secondary cursor-not-allowed opacity-50"
                      : "text-soma-text-secondary hover:text-soma-text-primary cursor-pointer"
                  }`}
                >
                  <span className="text-sm font-medium">Next</span>
                  <ChevronRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </div>
            </div>
          )}

          {/* Grid View  */}
          {viewMode === "grid" && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setShowAllAnswers(!showAllAnswers)}
                  className="flex items-center gap-2 px-4 py-2 bg-soma-dark rounded-lg hover:bg-soma-medium transition-all"
                >
                  {showAllAnswers ? <EyeOff size={18} /> : <Eye size={18} />}
                  <span className="text-soma-text-primary">
                    {showAllAnswers ? "Hide answers" : "Show answers"}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card, idx) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    onKeyDown={(_) => {}}
                    className="bg-soma-dark rounded-xl p-6 hover:bg-soma-medium cursor-pointer transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm text-soma-text-secondary">
                        Card {idx + 1}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          idx === currentIdx
                            ? "bg-soma-accent1/20 text-soma-accent1"
                            : "bg-soma-medium text-soma-text-secondary"
                        }`}
                      >
                        {idx === currentIdx ? "Current" : ""}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-soma-text-secondary mb-1">
                          Question
                        </p>
                        <p className="text-soma-text-primary break-words hyphens-auto line-clamp-3">
                          {card.front}
                        </p>
                      </div>
                      {showAllAnswers && (
                        <div>
                          <p className="text-xs text-soma-text-secondary mb-1">
                            Answer
                          </p>
                          <p className="text-soma-text-primary break-words hyphens-auto line-clamp-3">
                            {card.back}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CardSetView;
