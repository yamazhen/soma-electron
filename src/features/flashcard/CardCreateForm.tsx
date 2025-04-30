import React, { useState } from "react";
import { CirclePlus, X } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

interface Card {
  front: string;
  back: string;
}

const CardCreateForm: React.FC = () => {
  const { setCardView, fetchDecks } = useAppContext();
  const [title, setTitle] = useState("");
  const [cards, setCards] = useState<Card[]>([{ front: "", back: "" }]);

  const handleCardChange = (
    index: number,
    field: keyof Card,
    value: string,
  ) => {
    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card)),
    );
  };

  const addCard = () => setCards((prev) => [...prev, { front: "", back: "" }]);

  const removeCard = (index: number) =>
    setCards((prev) => prev.filter((_, i) => i !== index));

  const getPayload = () => ({ title, cards });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      console.error("Set title is required");
      return;
    }
    if (cards.some((card) => !card.front.trim() || !card.back.trim())) {
      console.error("All cards must have a question and an answer");
      return;
    }
    window.ipcRenderer.deckSave(getPayload()).then((res) => {
      if (res.success) {
        fetchDecks();
        setCardView("listing");
      } else {
        console.error("Failed to save deck:", res.error);
      }
    });
  };

  return (
    <section className="h-full w-full flex flex-col justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center overflow-auto w-full"
      >
        <div className="w-2xl flex flex-col gap-4 py-20">
          <h1 className="text-3xl">Create Card Set</h1>
          <div>
            <label className="text-xl">Set Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full border border-soma-light rounded p-2"
              placeholder="Enter set title"
            />
          </div>
          <h2 className="text-xl">Cards</h2>
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="relative flex gap-2 items-center w-full border border-soma-light p-4 justify-between"
            >
              <div className="w-full">
                <label>Front</label>
                <input
                  type="text"
                  value={card.front}
                  onChange={(e) =>
                    handleCardChange(idx, "front", e.target.value)
                  }
                  placeholder="Enter question"
                  className="mt-1 w-full border border-soma-light rounded p-2"
                />
              </div>
              <div className="w-full">
                <label>Back</label>
                <input
                  type="text"
                  value={card.back}
                  onChange={(e) =>
                    handleCardChange(idx, "back", e.target.value)
                  }
                  placeholder="Enter answer"
                  className="mt-1 w-full border border-soma-light rounded p-2"
                />
              </div>
              {cards.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCard(idx)}
                  className="bg-soma-error p-0.5 rounded-full absolute top-3 right-3 hover:bg-soma-error/50 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}

          <div>
            <button
              type="button"
              onClick={addCard}
              className="flex items-center bg-soma-light px-4 py-2 rounded-md hover:bg-soma-lightest hover:text-soma-dark transition-colors duration-200"
            >
              <CirclePlus size={16} className="mr-2" />
              Add Card
            </button>
          </div>

          <div className="w-full flex justify-center">
            <button
              type="submit"
              className="bg-soma-accent2 text-soma-darkest py-2 px-12 rounded-md hover:bg-soma-accent2/75 hover:text-soma-light"
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default CardCreateForm;
