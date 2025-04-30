import React from "react";
import CardSet from "./CardSet";
import { useAppContext } from "../../context/AppContext";

type Props = {};

const CardListing: React.FC<Props> = () => {
  const { getMessage, viewCardSet, decks } = useAppContext();

  return (
    <section className="h-full w-full flex flex-col justify-center">
      <div className="flex flex-col gap-4 items-center p-4 overflow-auto">
        <h1 className="text-3xl text-center my-5">
          {getMessage("flashcard.listing")}
        </h1>
        {!decks || decks.length === 0 ? (
          <div>No decks yet. Create one to get started!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {decks.map((deck) => (
              <div
                key={deck.id}
                onClick={() => viewCardSet(deck.id!)}
                className="cursor-pointer"
              >
                <CardSet
                  cardSetName={deck.title}
                  cardSetCount={deck.cards.length}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CardListing;
