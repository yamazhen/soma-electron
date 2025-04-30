import React from "react";
import { useAppContext } from "../../context/AppContext";
import QuizListing from "./QuizListing";
import QuizReview from "./QuizReview";
import QuizCreateForm from "./QuizCreateForm";
import QuizInReview from "./QuizInReview";

const Quiz: React.FC = () => {
  const { quizView, quizInReview } = useAppContext();
  switch (quizView) {
    case "listing":
      return <QuizListing />;
    case "review":
      return <QuizReview />;
    case "create":
      return <QuizCreateForm />;
    case "inReview":
      if (quizInReview) {
        return (
          <QuizInReview
            quiz={quizInReview}
            onComplete={() => console.log("Quiz Complted")}
          />
        );
      } else {
        return <QuizListing />;
      }
    default:
      return <QuizListing />;
  }
};

export default Quiz;
