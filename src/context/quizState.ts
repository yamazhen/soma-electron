import { useEffect, useState } from "react";

export const useQuizState = () => {
  const [quizView, setQuizView] = useState<
    "listing" | "review" | "create" | "inReview"
  >("listing");
  const [quizzes, setQuizzes] = useState<QuizData[] | undefined>([]);
  const [quizInReview, setQuizInReview] = useState<QuizData | undefined>(
    undefined,
  );

  const reviewQuiz = async (quizId: number) => {
    try {
      const response = await window.ipcRenderer.quizFindById(quizId);

      if (response.success) {
        console.log("Quiz data:", response.quizData);
        setQuizInReview(response.quizData);
        setQuizView("inReview");
      } else {
        console.error("Error fetching quiz:", response.error);
      }
    } catch (e) {
      console.error("Exception while fetching quiz:", e);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await window.ipcRenderer.quizFindAll();
      if (response.success) {
        setQuizzes(response.quizData);
        console.log("Fetched quizzes:", response.quizData);
      } else {
        console.error("Error fetching quizzes:", response.error);
      }
    } catch (e) {
      console.error("Error fetching quizzes:", e);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  return {
    setQuizView,
    quizView,
    quizzes,
    setQuizzes,
    quizInReview,
    reviewQuiz,
    fetchQuizzes,
  };
};
