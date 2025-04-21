import React from "react";
import { useAppContext } from "../../context/AppContext";
import QuizListing from "./QuizListing";
import QuizReview from "./QuizReview";
import QuizCreateForm from "./QuizCreateForm";
import QuizInReview from "./QuizInReview";

const Quiz: React.FC = () => {
  const { quizView, quizInReview } = useAppContext();
  if (quizView === "listing") {
    return <QuizListing />;
  }
  if (quizView === "review") {
    return <QuizReview />;
  }
  if (quizView === "inReview" && quizInReview) {
    return (
      <QuizInReview
        quiz={quizInReview}
        onComplete={() => console.log("Quiz Complted")}
      />
    );
  }
  if (quizView === "create") {
    return <QuizCreateForm />;
  }
};

export default Quiz;
