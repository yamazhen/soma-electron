import { ipcRenderer } from "electron";

export const deckApi = {
  deckSave: (deckData: Deck) => ipcRenderer.invoke("deck-save", deckData),
  deckFindById: (deckId: number) =>
    ipcRenderer.invoke("deck-find-by-id", deckId),
  deckFindAll: () => ipcRenderer.invoke("deck-find-all"),
  getDueCards: (limit?: number) =>
    ipcRenderer.invoke("deck:getDueCards", limit),
  submitReview: (data: {
    cardId: number;
    isCorrect: boolean;
    responseTime: number;
  }) => ipcRenderer.invoke("deck:submitReview", data),
  scheduleCard: (cardId: number, scheduled: boolean) =>
    ipcRenderer.invoke("deck:scheduleCard", cardId, scheduled),
};
