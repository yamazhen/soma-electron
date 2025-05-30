import { ipcMain } from "electron";
import { DeckService } from "../service";

export function setupDeckHandlers() {
  const deckService = new DeckService();

  ipcMain.handle("deck-save", async (_event, deckData: Deck) => {
    return deckService.createDeck(deckData);
  });

  ipcMain.handle("deck-find-by-id", async (_event, deckId: number) => {
    return deckService.getDeckById(deckId);
  });

  ipcMain.handle("deck-find-all", async () => {
    return deckService.getAllDecks();
  });

  ipcMain.handle(
    "deck-update",
    async (_event, id: number, deckData: Partial<Deck>) => {
      return deckService.updateDeck(id, deckData);
    },
  );

  ipcMain.handle("deck-delete", async (_event, id: number) => {
    return deckService.deleteDeck(id);
  });

  ipcMain.handle("deck-search", async (_event, query: string) => {
    return deckService.searchDecks(query);
  });

  ipcMain.handle("deck-stats", async (_event, id: number) => {
    return deckService.getDeckStats(id);
  });

  ipcMain.handle("deck:getDueCards", async (_, limit?: number) => {
    return deckService.getDueCards(limit);
  });

  ipcMain.handle(
    "deck:submitReview",
    async (
      _,
      data: {
        cardId: number;
        isCorrect: boolean;
        responseTime: number;
      },
    ) => {
      return deckService.submitCardReview(data);
    },
  );

  ipcMain.handle(
    "deck:scheduleCard",
    async (_, cardId: number, scheduled: boolean) => {
      return deckService.scheduleCard(cardId, scheduled);
    },
  );

  ipcMain.handle("deck:getDueCardsCount", async () => {
    return deckService.getDueCardsCount();
  });

  ipcMain.handle("deck:getWeakCards", async (_, limit?: number) => {
    return deckService.getWeakCards(limit);
  });

  ipcMain.handle("deck:scheduleAllCards", async () => {
    return deckService.scheduleAllCards();
  });

  ipcMain.handle("deck:getMixedReview", async (_, limit?: number) => {
    return deckService.getMixedReviewCards(limit);
  });

  ipcMain.handle("deck:getAnalytics", async () => {
    return deckService.getCardAnalytics();
  });
}
