import { useCallback, useEffect, useState } from "react";

export const useQuizState = () => {
	const [quizView, setQuizView] = useState<
		"listing" | "review" | "create" | "inReview"
	>("listing");
	const [quizzes, setQuizzes] = useState<QuizDetails[] | undefined>([]);

	const fetchQuizzes = useCallback(async () => {
		try {
			const response = await window.quizIpc.getAll();
			if (response.success) {
				setQuizzes(response.quizzes);
			} else {
				console.error("Error fetching quizzes:", response.error);
			}
		} catch (e) {
			console.error("Error fetching quizzes:", e);
		}
	}, []);

	useEffect(() => {
		fetchQuizzes();
	}, [fetchQuizzes]);

	return {
		setQuizView,
		quizView,
		quizzes,
		setQuizzes,
		fetchQuizzes,
	};
};
