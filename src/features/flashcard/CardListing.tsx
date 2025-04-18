import React from "react";
import CardSet from "./CardSet";

type Props = {};

const CardListing: React.FC<Props> = () => {
  const cards = [
    {
      id: 1,
      name: "Card Set 1",
      cardCount: 10,
    },
    {
      id: 2,
      name: "Card Set 1",
      cardCount: 10,
    },
    {
      id: 3,
      name: "Card Set 1",
      cardCount: 10,
    },
    {
      id: 4,
      name: "Card Set 1",
      cardCount: 10,
    },
    {
      id: 5,
      name: "Card Set 1",
      cardCount: 10,
    },
  ];

  return (
    <>
      <h1 className="text-3xl text-center mb-10">Soma Flashcards</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {cards.map((card) => (
          <CardSet
            key={card.id}
            cardSetName={card.name}
            cardSetCount={card.cardCount}
          />
        ))}
      </div>
    </>
  );
};

export default CardListing;
