import { Lightbulb } from "lucide-react";
import React from "react";

const QuizReview: React.FC = () => {
  return (
    <section className="content flex justify-center items-center">
      <div id="reviewContainer" className="flex flex-col gap-4">
        <h1 className="text-3xl">Quiz Reviews</h1>
        <div className="bg-soma-medium max-w-2xl rounded-sm p-4 flex items-center gap-2">
          <Lightbulb size={25} />
          <p>
            Soma Review is a spaced repetition system that helps you learn and
            retain information effectively.
          </p>
        </div>
        <div className="bg-soma-medium max-w-2xl rounded-sm p-4 flex items-center gap-2">
          Review Box
        </div>
      </div>
    </section>
  );
};

export default QuizReview;
