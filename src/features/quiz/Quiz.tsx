import React from "react";
import { useAppContext } from "../../context/AppContext";
import QuizListing from "./QuizListing";
import QuizReview from "./QuizReview";

const Quiz: React.FC = () => {
  const { inQuizListing, inQuizReview } = useAppContext();
  return inQuizListing && !inQuizReview ? <QuizListing /> : <QuizReview />;
};

export default Quiz;
