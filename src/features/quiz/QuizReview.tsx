import { Lightbulb } from "lucide-react";
import React from "react";

const QuizReview: React.FC = () => {
  return (
    <section className="h-full w-full flex flex-col justify-center">
      <div className="flex flex-col gap-4 items-center p-4 overflow-auto">
        <span className="w-full max-w-2xl">
          <h1 className="text-3xl">Quiz Reviews</h1>
        </span>
        <div className="bg-soma-medium max-w-2xl rounded-sm p-4 flex items-center gap-2 w-full">
          <Lightbulb size={25} />
          <p>
            Soma Review is a spaced repetition system that helps you learn and
            retain information effectively.
          </p>
        </div>
        <div className="bg-soma-medium max-w-2xl rounded-sm p-4 flex items-center gap-2 w-full">
          Review Box
        </div>
      </div>
    </section>
  );
};

export default QuizReview;
