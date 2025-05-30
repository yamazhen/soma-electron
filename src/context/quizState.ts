import { useCallback, useEffect, useState } from "react";

export const useQuizState = () => {
  const [quizView, setQuizView] = useState<
    "listing" | "review" | "create" | "inReview"
  >("listing");
  const [quizzes, setQuizzes] = useState<QuizDetails[] | undefined>([]);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [lastScheduleUpdate, setLastScheduleUpdate] = useState(Date.now());

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

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      const response = await window.quizIpc.getAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        console.error("Error fetching analytics:", response.error);
      }
    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const triggerScheduleUpdate = useCallback(() => {
    setLastScheduleUpdate(Date.now());
  }, []);

  useEffect(() => {
    fetchQuizzes();
    fetchAnalytics();
  }, [fetchQuizzes, fetchAnalytics, lastScheduleUpdate]);

  return {
    setQuizView,
    quizView,
    quizzes,
    setQuizzes,
    fetchQuizzes,
    analytics,
    loadingAnalytics,
    fetchAnalytics,
    triggerScheduleUpdate,
    lastScheduleUpdate,
  };
};
