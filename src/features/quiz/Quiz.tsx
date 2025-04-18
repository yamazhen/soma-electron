import React from "react";
import { useAppContext } from "../../context/AppContext";
import QuizListing from "./QuizListing";
import QuizReview from "./QuizReview";
import QuizCreateForm from "./QuizCreateForm";

const Quiz: React.FC = () => {
  const { quizView } = useAppContext();
  if (quizView === "listing") {
    return <QuizListing />;
  }
  if (quizView === "review") {
    return <QuizReview />;
  }
  if (quizView === "create") {
    return <QuizCreateForm />;
  }
};

export default Quiz;
