import { Lightbulb } from "lucide-react";
import React from "react";
import { useAppContext } from "../../context/AppContext";

const CardReview: React.FC = () => {
  const { getMessage } = useAppContext();
  return (
    <section className="h-full w-full flex flex-col justify-center">
      <div className="flex flex-col gap-4 items-center p-4 overflow-auto">
        <h1 className="text-3xl mb-5">{getMessage("flashcard.review")}</h1>
        <div className="bg-soma-medium max-w-2xl rounded-sm p-4 flex items-center gap-2 w-xl mb-5">
          <Lightbulb size={25} />
          <p>
            Soma Review is a spaced repetition system that helps you learn and
            retain information effectively.
          </p>
        </div>
        <div className="bg-soma-medium max-w-2xl rounded-sm p-4 flex items-center gap-2 w-xl">
          Review Box
        </div>
      </div>
    </section>
  );
};

export default CardReview;
