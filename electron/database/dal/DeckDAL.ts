import { BaseDAL } from "./BaseDAL";

export class DeckDAL extends BaseDAL {
	create(deck: Deck): number {
		return this.transaction(() => {
			const insertDeck = this.db.prepare(`
        INSERT INTO decks (title) VALUES (?)
      `);
			const deckResult = insertDeck.run(deck.title);
			const deckId = deckResult.lastInsertRowid as number;

			const insertCard = this.db.prepare(`
        INSERT INTO cards (deck_id, front, back)
        VALUES (?, ?, ?)
      `);

			for (const card of deck.cards) {
				insertCard.run(deckId, card.front, card.back);
			}

			return deckId;
		});
	}

	findById(deckId: number): Deck | null {
		try {
			const deckRow = this.db
				.prepare("SELECT * FROM decks WHERE id = ?")
				.get(deckId);
			if (!deckRow) return null;

			const cards = this.db
				.prepare("SELECT * FROM cards WHERE deck_id = ? ORDER BY id ASC")
				.all(deckId)
				.map((row: any) => ({
					id: row.id,
					deckId: row.deck_id,
					front: row.front,
					back: row.back,
				}));

			return {
				id: deckRow.id,
				title: deckRow.title,
				cards,
			};
		} catch (error) {
			console.error("Error fetching deck:", error);
			return null;
		}
	}

	findAll(): Deck[] {
		try {
			const decks = this.db
				.prepare("SELECT * FROM decks ORDER BY id DESC")
				.all();
			const cardStmt = this.db.prepare(
				"SELECT * FROM cards WHERE deck_id = ? ORDER BY id ASC",
			);

			return decks.map((d: any) => ({
				id: d.id,
				title: d.title,
				cards: cardStmt.all(d.id).map((c: any) => ({
					id: c.id,
					deckId: c.deck_id,
					front: c.front,
					back: c.back,
				})),
			}));
		} catch (error) {
			console.error("Error fetching all decks:", error);
			return [];
		}
	}

	update(id: number, deck: Partial<Deck>): boolean {
		return this.transaction(() => {
			try {
				if (deck.title) {
					const updateDeckStmt = this.db.prepare(`
            UPDATE decks SET title = ? WHERE id = ?
          `);
					updateDeckStmt.run(deck.title, id);
				}

				if (deck.cards) {
					const deleteCardsStmt = this.db.prepare(`
            DELETE FROM cards WHERE deck_id = ?
          `);
					deleteCardsStmt.run(id);

					const insertCardStmt = this.db.prepare(`
            INSERT INTO cards (deck_id, front, back)
            VALUES (?, ?, ?)
          `);

					for (const card of deck.cards) {
						insertCardStmt.run(id, card.front, card.back);
					}
				}

				return true;
			} catch (error) {
				console.error("Error updating deck:", error);
				return false;
			}
		});
	}

	delete(id: number): boolean {
		return this.transaction(() => {
			try {
				const deleteCardsStmt = this.db.prepare(`
          DELETE FROM cards WHERE deck_id = ?
        `);
				deleteCardsStmt.run(id);

				const deleteDeckStmt = this.db.prepare(`
          DELETE FROM decks WHERE id = ?
        `);
				const result = deleteDeckStmt.run(id);

				return result.changes > 0;
			} catch (error) {
				console.error("Error deleting deck:", error);
				return false;
			}
		});
	}

	getCardCount(deckId: number): number {
		try {
			const result = this.db
				.prepare(`
        SELECT COUNT(*) as count FROM cards WHERE deck_id = ?
      `)
				.get(deckId);
			return result?.count || 0;
		} catch (error) {
			console.error("Error getting card count:", error);
			return 0;
		}
	}

	getDecksByTitle(title: string): Deck[] {
		try {
			const decks = this.db
				.prepare("SELECT * FROM decks WHERE title LIKE ? ORDER BY id DESC")
				.all(`%${title}%`);

			const cardStmt = this.db.prepare(
				"SELECT * FROM cards WHERE deck_id = ? ORDER BY id ASC",
			);

			return decks.map((d: any) => ({
				id: d.id,
				title: d.title,
				cards: cardStmt.all(d.id).map((c: any) => ({
					id: c.id,
					deckId: c.deck_id,
					front: c.front,
					back: c.back,
				})),
			}));
		} catch (error) {
			console.error("Error searching decks by title:", error);
			return [];
		}
	}
}
