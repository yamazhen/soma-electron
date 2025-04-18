import { useState } from "react";

export const useQuizState = () => {
  const [quizView, setQuizView] = useState<"listing" | "review" | "create">(
    "listing",
  );

  const clickQuizListing = () => setQuizView("listing");
  const clickQuizReview = () => setQuizView("review");
  const clickCreateQuiz = () => setQuizView("create");

  return {
    clickQuizListing,
    clickQuizReview,
    clickCreateQuiz,
    quizView,
  };
};
