import { useCallback, useState } from "react";

export const useActivityState = () => {
  const [lastActivityUpdate, setLastActivityUpdate] = useState(Date.now());

  const recordActivity = useCallback(
    async (
      type: "quiz" | "note" | "flashcard" | "note-edit",
      details: {
        title: string;
        entityId?: string;
        score?: number;
        cardCount?: number;
        questionsCount?: number;
        deckTitle?: string;
        quizTitle?: string;
      },
    ) => {
      try {
        const entityId = details.entityId || `${type}-${Date.now()}`;
        const title =
          details.title ||
          details.quizTitle ||
          details.deckTitle ||
          `${type} activity`;

        const result = await window.dashboardApi.logActivity(
          type,
          title,
          entityId,
          details,
        );

        if (result?.success) {
          setLastActivityUpdate(Date.now());
        }
      } catch (error) {
        console.error("Error recording activity:", error);
      }
    },
    [],
  );

  return {
    lastActivityUpdate,
    recordActivity,
  };
};
