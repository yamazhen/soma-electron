import { Lightbulb } from "lucide-react";
import React from "react";

const CardReview: React.FC = () => {
  return (
    <>
      <h1 className="text-3xl mb-5">Card Reviews</h1>
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
    </>
  );
};

export default CardReview;
