import axios from "axios";
import { DeckDAL } from "../database/dal";
import {
  handleServiceCall,
  handleServiceOperation,
} from "../utils/serviceHelper";
import { env } from "../config/config";
import generateContentHash from "../utils/contentHash";

export class DeckService {
  private deckDAL = new DeckDAL();

  async createDeck(
    deckData: Deck,
    contentHash?: string,
  ): Promise<IpcResponseData<number>> {
    return await handleServiceCall(() => {
      if (!deckData.title?.trim()) {
        throw new Error("Deck title is required");
      }

      if (!deckData.cards || deckData.cards.length === 0) {
        throw new Error("Deck must have at least one card");
      }

      for (const card of deckData.cards) {
        if (!card.front?.trim() || !card.back?.trim()) {
          throw new Error("All cards must have front and back content");
        }
      }

      return this.deckDAL.create(deckData, contentHash);
    }, "Failed to create deck");
  }

  async getDeckById(deckId: number): Promise<IpcResponseData<Deck>> {
    return await handleServiceCall(() => {
      if (!deckId || deckId <= 0) {
        throw new Error("Invalid deck ID");
      }

      const deck = this.deckDAL.findById(deckId);
      if (!deck) {
        throw new Error("Deck not found");
      }
      return deck;
    }, "Failed to retrieve deck");
  }

  async getAllDecks(): Promise<IpcResponseData<Deck[]>> {
    return await handleServiceCall(() => {
      return this.deckDAL.findAll();
    }, "Failed to retrieve decks");
  }

  async updateDeck(id: number, deckData: Partial<Deck>): Promise<IpcResponse> {
    return await handleServiceOperation(() => {
      if (!id || id <= 0) {
        throw new Error("Invalid deck ID");
      }

      const existingDeck = this.deckDAL.findById(id);
      if (!existingDeck) {
        throw new Error("Deck not found");
      }

      if (deckData.title !== undefined && !deckData.title.trim()) {
        throw new Error("Deck title cannot be empty");
      }

      if (deckData.cards) {
        for (const card of deckData.cards) {
          if (!card.front?.trim() || !card.back?.trim()) {
            throw new Error("All cards must have front and back content");
          }
        }
      }

      const success = this.deckDAL.update(id, deckData);
      if (!success) {
        return false;
      }
    }, "Failed to update deck");
  }

  async deleteDeck(id: number): Promise<IpcResponse> {
    return await handleServiceOperation(() => {
      if (!id || id <= 0) {
        throw new Error("Invalid deck ID");
      }

      const existingDeck = this.deckDAL.findById(id);
      if (!existingDeck) {
        throw new Error("Deck not found");
      }

      const success = this.deckDAL.delete(id);
      if (!success) {
        throw new Error("Failed to delete deck");
      }
    }, "Failed to delete deck");
  }

  async searchDecks(query: string): Promise<IpcResponseData<Deck[]>> {
    return await handleServiceCall(async () => {
      if (!query?.trim()) {
        const allDecks = await this.getAllDecks();
        if (!allDecks.success) {
          throw new Error(allDecks.error);
        }
        if (!allDecks.data) {
          throw new Error("No decks found");
        }
        return allDecks.data;
      }

      return this.deckDAL.getDecksByTitle(query.trim());
    }, "Failed to search decks");
  }

  async getDeckStats(
    id: number,
  ): Promise<IpcResponseData<{ cardCount: number }>> {
    return await handleServiceCall(() => {
      if (!id || id <= 0) {
        throw new Error("Invalid deck ID");
      }

      const cardCount = this.deckDAL.getCardCount(id);
      return { cardCount };
    }, "Failed to retrieve deck statistics");
  }

  async getDueCards(limit?: number): Promise<IpcResponseData<any[]>> {
    return await handleServiceCall(() => {
      return this.deckDAL.getDueCards(limit);
    }, "Failed to get due cards");
  }

  async updateCardScheduling(
    cardId: number,
    isCorrect: boolean,
    responseTime: number,
  ): Promise<IpcResponse> {
    return await handleServiceOperation(() => {
      if (!cardId || cardId <= 0) {
        throw new Error("Invalid card ID");
      }

      const success = this.deckDAL.updateCardScheduling(
        cardId,
        isCorrect,
        responseTime,
      );
      if (!success) {
        throw new Error("Failed to update card scheduling");
      }
    }, "Failed to update card scheduling");
  }

  async scheduleCard(
    cardId: number,
    scheduled: boolean = true,
  ): Promise<IpcResponse> {
    return await handleServiceOperation(() => {
      if (!cardId || cardId <= 0) {
        throw new Error("Invalid card ID");
      }

      const success = this.deckDAL.scheduleCard(cardId, scheduled);
      if (!success) {
        throw new Error("Failed to schedule card");
      }
    }, "Failed to schedule card");
  }

  async getDueCardsCount(): Promise<
    IpcResponseData<{ today: number; overdue: number; upcoming: number }>
  > {
    return await handleServiceCall(() => {
      return this.deckDAL.getDueCardsCount();
    }, "Failed to get due cards count");
  }

  async getWeakCards(limit?: number): Promise<IpcResponseData<any[]>> {
    return await handleServiceCall(() => {
      return this.deckDAL.getWeakCards(limit || 30);
    }, "Failed to get weak cards");
  }

  async scheduleAllCards(): Promise<IpcResponse> {
    return await handleServiceOperation(() => {
      return this.deckDAL.scheduleAllCards();
    }, "Failed to schedule all cards");
  }

  async getMixedReviewCards(
    limit: number = 20,
  ): Promise<IpcResponseData<any[]>> {
    return await handleServiceCall(() => {
      return this.deckDAL.getDueCards(limit);
    }, "Failed to get mixed review cards");
  }

  async getCardAnalytics(): Promise<IpcResponseData<any>> {
    return await handleServiceCall(() => {
      return this.deckDAL.getCardAnalytics();
    }, "Failed to get card analytics");
  }

  async submitCardReview(data: {
    cardId: number;
    isCorrect: boolean;
    responseTime: number;
  }): Promise<IpcResponseData<{ success: boolean }>> {
    return await handleServiceCall(() => {
      if (!data.cardId || data.cardId <= 0) {
        throw new Error("Invalid card ID");
      }

      const success = this.deckDAL.logCardResponse(
        data.cardId,
        data.isCorrect,
        data.responseTime,
      );

      if (!success) {
        throw new Error("Failed to log card response and update scheduling");
      }

      return { success: true };
    }, "Failed to submit card review");
  }

  async getDueCardsByDeck(
    deckId: number,
    limit?: number,
  ): Promise<IpcResponseData<any[]>> {
    return await handleServiceCall(() => {
      if (!deckId || deckId <= 0) {
        throw new Error("Invalid deck ID");
      }
      return this.deckDAL.getDueCardsByDeck(deckId, limit);
    }, "Failed to get due cards for deck");
  }

  async getDueCardsCountByDeck(
    deckId: number,
  ): Promise<
    IpcResponseData<{ today: number; overdue: number; upcoming: number }>
  > {
    return await handleServiceCall(() => {
      if (!deckId || deckId <= 0) {
        throw new Error("Invalid deck ID");
      }
      return this.deckDAL.getDueCardsCountByDeck(deckId);
    }, "Failed to get due cards count for deck");
  }

  async getDeckAccuracy(deckId: number): Promise<IpcResponseData<number>> {
    return await handleServiceCall(() => {
      if (!deckId || deckId <= 0) {
        throw new Error("Invalid deck ID");
      }
      return this.deckDAL.getDeckAccuracy(deckId);
    }, "Failed to get deck accuracy");
  }

  async getDeckDifficulty(deckId: number): Promise<IpcResponseData<number>> {
    return await handleServiceCall(() => {
      if (!deckId || deckId <= 0) {
        throw new Error("Invalid deck ID");
      }
      return this.deckDAL.getDeckDifficulty(deckId);
    }, "Failed to get deck difficulty");
  }

  async getDeckReviewStats(deckId: number): Promise<
    IpcResponseData<{
      lastReviewed: string;
      totalReviews: number;
    }>
  > {
    return await handleServiceCall(() => {
      if (!deckId || deckId <= 0) {
        throw new Error("Invalid deck ID");
      }
      return this.deckDAL.getDeckReviewStats(deckId);
    }, "Failed to get deck review stats");
  }

  async scheduleDeckCards(deckId: number): Promise<IpcResponse> {
    return await handleServiceOperation(() => {
      if (!deckId || deckId <= 0) {
        throw new Error("Invalid deck ID");
      }
      return this.deckDAL.scheduleDeckCards(deckId);
    }, "Failed to schedule deck cards");
  }

  async hasUnscheduledCards(deckId: number): Promise<IpcResponseData<boolean>> {
    return await handleServiceCall(() => {
      if (!deckId || deckId <= 0) {
        throw new Error("Invalid deck ID");
      }
      return this.deckDAL.hasUnscheduledCards(deckId);
    }, "Failed to check unscheduled cards");
  }

  async generateDeckFromNote(noteContent: string): Promise<IpcResponse> {
    return await handleServiceCall(async () => {
      const contentHash = generateContentHash(noteContent);

      const existingDeck = this.deckDAL.getByContentHash(contentHash);

      if (existingDeck) {
        const response = await axios.post(
          `${env.gatewayUrl}/api/ai/v1/notes/generate-deck`,
          { note_content: noteContent },
        );

        const newDeck = response.data.deck;
        if (!newDeck || !newDeck.cards || newDeck.cards.length === 0) {
          throw new Error("Failed to generate deck from note");
        }

        const success = this.deckDAL.addCardsToDeck(
          existingDeck.id!,
          newDeck.cards,
        );
        if (!success) {
          throw new Error("Failed to update existing deck with new cards");
        }

        return { isExisting: true };
      } else {
        const response = await axios.post(
          `${env.gatewayUrl}/api/ai/v1/notes/generate-deck`,
          {
            note_content: noteContent,
          },
        );

        const deck = response.data.deck;
        if (!deck || !deck.cards || deck.cards.length === 0) {
          throw new Error("Failed to generate deck from note");
        }

        this.deckDAL.create(deck, contentHash);
      }
    }, "Failed to generate deck from note");
  }
}
