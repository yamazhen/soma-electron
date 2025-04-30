import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";

const CardSetView: React.FC = () => {
  const { deckInView, setCardView } = useAppContext();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  if (deckInView === undefined) {
    return <div>No deck selected</div>;
  }
  const cards = deckInView.cards;
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
  const sideTxt = showBack ? "Back" : "Front";
  return (
    <section className="h-full w-full flex flex-col items-center p-4">
      <button
        onClick={() => setCardView("listing")}
        className="self-end bg-soma-light px-2 py-1 rounded-md hover:bg-soma-lightest hover:text-soma-dark transition-colors duration-200"
      >
        ← Back to decks
      </button>

      <h2 className="text-2xl font-semibold mb-6">{deckInView.title}</h2>

      <p className="mb-2 text-xl">{sideTxt}</p>
      <div
        onClick={() => setShowBack(!showBack)}
        className="w-[300px] h-[400px] flex items-center justify-center rounded-lg shadow cursor-pointer p-4 text-xl bg-soma-light"
      >
        {showBack ? cards[currentIdx].back : cards[currentIdx].front}
      </div>

      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={prev}
          disabled={currentIdx === 0}
          className="px-4 py-2 bg-soma-light rounded disabled:opacity-50 cursor-pointer hover:bg-soma-lightest hover:text-soma-dark transition-colors duration-200"
        >
          Previous
        </button>

        <span>
          {currentIdx + 1} / {cards.length}
        </span>

        <button
          onClick={next}
          disabled={currentIdx === cards.length - 1}
          className="px-4 py-2 bg-soma-light rounded disabled:opacity-50 cursor-pointer hover:bg-soma-lightest hover:text-soma-dark transition-colors duration-200"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default CardSetView;
