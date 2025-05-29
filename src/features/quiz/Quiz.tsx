import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import QuizListing from "./QuizListing";
import QuizReview from "./QuizReview";
import QuizCreateForm from "./QuizCreateForm";
import QuizInReview from "./QuizInReview";

const Quiz: React.FC = () => {
	const { quizView } = useAppContext();
	const [quizInReview, setQuizInReview] = useState<QuizDetails | undefined>(
		undefined,
	);

	switch (quizView) {
		case "listing":
			return <QuizListing setQuizInReview={setQuizInReview} />;
		case "review":
			return <QuizReview setQuizInReview={setQuizInReview} />;
		case "create":
			return <QuizCreateForm />;
		case "inReview":
			if (quizInReview) {
				return <QuizInReview quiz={quizInReview} />;
			}
			return <QuizListing setQuizInReview={setQuizInReview} />;
		default:
			return <QuizListing setQuizInReview={setQuizInReview} />;
	}
};

export default Quiz;
