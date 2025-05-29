import { DeckDAL } from "../database/dal";

export class DeckService {
	private deckDAL = new DeckDAL();

	createDeck(deckData: Deck): {
		success: boolean;
		deckId?: number;
		error?: string;
	} {
		try {
			if (!deckData.title?.trim()) {
				return { success: false, error: "Deck title is required" };
			}

			if (!deckData.cards || deckData.cards.length === 0) {
				return { success: false, error: "Deck must have at least one card" };
			}

			for (const card of deckData.cards) {
				if (!card.front?.trim() || !card.back?.trim()) {
					return {
						success: false,
						error: "All cards must have front and back content",
					};
				}
			}

			const deckId = this.deckDAL.create(deckData);
			return { success: true, deckId };
		} catch (error) {
			console.error("Error in createDeck service:", error);
			return { success: false, error: "Failed to create deck" };
		}
	}

	getDeckById(deckId: number): {
		success: boolean;
		deck?: Deck;
		error?: string;
	} {
		try {
			if (!deckId || deckId <= 0) {
				return { success: false, error: "Invalid deck ID" };
			}

			const deck = this.deckDAL.findById(deckId);
			if (!deck) {
				return { success: false, error: "Deck not found" };
			}

			return { success: true, deck };
		} catch (error) {
			console.error("Error in getDeckById service:", error);
			return { success: false, error: "Failed to retrieve deck" };
		}
	}

	getAllDecks(): { success: boolean; decks?: Deck[]; error?: string } {
		try {
			const decks = this.deckDAL.findAll();
			return { success: true, decks };
		} catch (error) {
			console.error("Error in getAllDecks service:", error);
			return { success: false, error: "Failed to retrieve decks" };
		}
	}

	updateDeck(
		id: number,
		deckData: Partial<Deck>,
	): { success: boolean; error?: string } {
		try {
			if (!id || id <= 0) {
				return { success: false, error: "Invalid deck ID" };
			}

			const existingDeck = this.deckDAL.findById(id);
			if (!existingDeck) {
				return { success: false, error: "Deck not found" };
			}

			if (deckData.title !== undefined && !deckData.title.trim()) {
				return { success: false, error: "Deck title cannot be empty" };
			}

			if (deckData.cards) {
				for (const card of deckData.cards) {
					if (!card.front?.trim() || !card.back?.trim()) {
						return {
							success: false,
							error: "All cards must have front and back content",
						};
					}
				}
			}

			const success = this.deckDAL.update(id, deckData);
			if (!success) {
				return { success: false, error: "Failed to update deck" };
			}

			return { success: true };
		} catch (error) {
			console.error("Error in updateDeck service:", error);
			return { success: false, error: "Failed to update deck" };
		}
	}

	deleteDeck(id: number): { success: boolean; error?: string } {
		try {
			if (!id || id <= 0) {
				return { success: false, error: "Invalid deck ID" };
			}

			const existingDeck = this.deckDAL.findById(id);
			if (!existingDeck) {
				return { success: false, error: "Deck not found" };
			}

			const success = this.deckDAL.delete(id);
			if (!success) {
				return { success: false, error: "Failed to delete deck" };
			}

			return { success: true };
		} catch (error) {
			console.error("Error in deleteDeck service:", error);
			return { success: false, error: "Failed to delete deck" };
		}
	}

	searchDecks(query: string): {
		success: boolean;
		decks?: Deck[];
		error?: string;
	} {
		try {
			if (!query?.trim()) {
				return this.getAllDecks();
			}

			const decks = this.deckDAL.getDecksByTitle(query.trim());
			return { success: true, decks };
		} catch (error) {
			console.error("Error in searchDecks service:", error);
			return { success: false, error: "Failed to search decks" };
		}
	}

	getDeckStats(id: number): {
		success: boolean;
		stats?: { cardCount: number };
		error?: string;
	} {
		try {
			if (!id || id <= 0) {
				return { success: false, error: "Invalid deck ID" };
			}

			const cardCount = this.deckDAL.getCardCount(id);
			return {
				success: true,
				stats: { cardCount },
			};
		} catch (error) {
			console.error("Error in getDeckStats service:", error);
			return { success: false, error: "Failed to get deck statistics" };
		}
	}
}
