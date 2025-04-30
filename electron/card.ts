import { ipcMain } from "electron";
import { getDatabase } from "./database/database";

function saveDeck(deck: Deck): number {
  const db = getDatabase();
  const txn = db.transaction((data: Deck) => {
    const insertDeck = db.prepare(`
      INSERT INTO decks (title) VALUES (?)
    `);
    const deckResult = insertDeck.run(data.title);
    const deckId = deckResult.lastInsertRowid;

    const insertCard = db.prepare(`
      INSERT INTO cards (deck_id, front, back)
      VALUES (?, ?, ?)
    `);
    for (const card of data.cards) {
      insertCard.run(deckId, card.front, card.back);
    }

    return deckId;
  });

  try {
    return txn(deck);
  } catch (e) {
    console.error("Error saving deck:", e);
    throw e;
  }
}

export function findDeckById(deckId: number): Deck | null {
  const db = getDatabase();
  try {
    const deckRow = db.prepare(`SELECT * FROM decks WHERE id = ?`).get(deckId);
    if (!deckRow) return null;

    const cards = db
      .prepare(`SELECT * FROM cards WHERE deck_id = ? ORDER BY id ASC`)
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
  } catch (e) {
    console.error("Error fetching deck:", e);
    return null;
  }
}

function findAllDeck(): Deck[] {
  const db = getDatabase();
  try {
    const decks = db.prepare(`SELECT * FROM decks ORDER BY id DESC`).all();
    const cardStmt = db.prepare(
      `SELECT * FROM cards WHERE deck_id = ? ORDER BY id ASC`,
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
  } catch (e) {
    console.error("Error fetching all decks:", e);
    return [];
  }
}

export function setupCardHandlers() {
  ipcMain.handle("deck-save", async (_e, deckData: Deck) => {
    try {
      const id = saveDeck(deckData);
      return { success: true, deckId: id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("deck-find-by-id", async (_e, deckId: number) => {
    try {
      const deck = findDeckById(deckId);
      if (!deck) return { success: false, error: "Deck not found" };
      return { success: true, deck };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("deck-find-all", async () => {
    try {
      const decks = findAllDeck();
      return { success: true, decks };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });
}
