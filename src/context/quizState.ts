import { useEffect, useState } from "react";

export const useQuizState = () => {
  const [quizView, setQuizView] = useState<
    "listing" | "review" | "create" | "inReview"
  >("listing");
  const [quizzes, setQuizzes] = useState<QuizData[] | undefined>([]);

  const fetchQuizzes = async () => {
    try {
      const response = await window.ipcRenderer.quizFindAll();
      if (response.success) {
        setQuizzes(response.quizData);
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
    fetchQuizzes,
  };
};
