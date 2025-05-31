import { ipcRenderer } from "electron";

export const deckApi = {
  deckSave: (deckData: Deck) => ipcRenderer.invoke("deck-save", deckData),
  deckFindById: (deckId: number) =>
    ipcRenderer.invoke("deck-find-by-id", deckId),
  deckFindAll: () => ipcRenderer.invoke("deck-find-all"),
  getDueCards: (limit?: number) =>
    ipcRenderer.invoke("deck:getDueCards", limit),
  getDueCardsCount: () => ipcRenderer.invoke("deck:getDueCardsCount"),
  getWeakCards: (limit?: number) =>
    ipcRenderer.invoke("deck:getWeakCards", limit),
  scheduleAllCards: () => ipcRenderer.invoke("deck:scheduleAllCards"),
  getMixedReview: (limit?: number) =>
    ipcRenderer.invoke("deck:getMixedReview", limit),
  getAnalytics: () => ipcRenderer.invoke("deck:getAnalytics"),
  submitReview: (data: {
    cardId: number;
    isCorrect: boolean;
    responseTime: number;
  }) => ipcRenderer.invoke("deck:submitReview", data),
  scheduleCard: (cardId: number, scheduled: boolean) =>
    ipcRenderer.invoke("deck:scheduleCard", cardId, scheduled),
  getDueCardsByDeck: (deckId: number, limit?: number) =>
    ipcRenderer.invoke("deck:getDueCardsByDeck", deckId, limit),
  getDueCardsCountByDeck: (deckId: number) =>
    ipcRenderer.invoke("deck:getDueCardsCountByDeck", deckId),
  getDeckAccuracy: (deckId: number) =>
    ipcRenderer.invoke("deck:getDeckAccuracy", deckId),
  getDeckDifficulty: (deckId: number) =>
    ipcRenderer.invoke("deck:getDeckDifficulty", deckId),
  getDeckReviewStats: (deckId: number) =>
    ipcRenderer.invoke("deck:getDeckReviewStats", deckId),
  scheduleDeckCards: (deckId: number) =>
    ipcRenderer.invoke("deck:scheduleDeckCards", deckId),
  hasUnscheduledCards: (deckId: number) =>
    ipcRenderer.invoke("deck:hasUnscheduledCards", deckId),
  generateDeckFromNote: (noteContent: string) =>
    ipcRenderer.invoke("deck:generateDeckFromNote", noteContent),
};
