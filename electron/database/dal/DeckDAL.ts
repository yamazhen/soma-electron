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
        .prepare(
          `
        SELECT COUNT(*) as count FROM cards WHERE deck_id = ?
      `,
        )
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

  getDueCards(limit?: number): any[] {
    const now = new Date().toISOString();
    let query = `
    SELECT c.*, d.title as deck_title
    FROM cards c
    JOIN decks d ON c.deck_id = d.id
    WHERE c.scheduled = 1 
    AND (c.next_review_date IS NULL OR c.next_review_date <= ?)
    ORDER BY 
      CASE WHEN c.next_review_date IS NULL THEN 0 ELSE 1 END,
      c.next_review_date ASC, 
      c.consecutive_correct ASC,
      c.id ASC
  `;

    if (limit) query += ` LIMIT ?`;

    const params = limit ? [now, limit] : [now];
    return this.db.prepare(query).all(...params);
  }

  updateCardScheduling(
    cardId: number,
    isCorrect: boolean,
    responseTime: number,
  ): boolean {
    return this.transaction(() => {
      // Get current card data
      const card = this.db
        .prepare("SELECT * FROM cards WHERE id = ?")
        .get(cardId) as any;
      if (!card) return false;

      const now = new Date();
      const nowISO = now.toISOString();
      let newInterval = card.review_interval || 1;
      let newEaseFactor = card.ease_factor || 2.5;
      let newConsecutiveCorrect = card.consecutive_correct || 0;

      // Check if this is an early review
      const isEarlyReview =
        card.next_review_date && new Date(card.next_review_date) > now;

      if (isCorrect) {
        newConsecutiveCorrect++;

        // SM-2 algorithm intervals
        if (newConsecutiveCorrect === 1) {
          newInterval = 1;
        } else if (newConsecutiveCorrect === 2) {
          newInterval = 6;
        } else {
          newInterval = Math.ceil(newInterval * newEaseFactor);
        }

        // Early review penalty
        if (isEarlyReview && newConsecutiveCorrect > 2) {
          const daysBetween = card.next_review_date
            ? Math.max(
                1,
                Math.floor(
                  (new Date(card.next_review_date).getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              )
            : 0;

          const earlyPenalty = Math.max(0.5, 1 - daysBetween / newInterval);
          newInterval = Math.ceil(newInterval * earlyPenalty);
        }

        // Update ease factor based on response quality
        const quality = isCorrect
          ? responseTime < 10
            ? 5
            : responseTime < 20
              ? 4
              : 3
          : 1;
        newEaseFactor = Math.max(
          1.3,
          newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
        );
      } else {
        // Wrong answer - reset streak and ease factor
        newConsecutiveCorrect = 0;
        newInterval = 1;

        const quality = 2;
        newEaseFactor = Math.max(
          1.3,
          newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
        );
      }

      // Response time adjustments
      if (responseTime && isCorrect) {
        const avgResponseTime = 15; // seconds
        if (responseTime < avgResponseTime / 2) {
          newInterval = Math.ceil(newInterval * 0.9); // Too fast, reduce interval
        } else if (responseTime > avgResponseTime * 2) {
          newInterval = Math.ceil(newInterval * 1.1); // Too slow, increase interval
        }
      }

      // Calculate next review date
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

      // Update card in database
      const stmt = this.db.prepare(`
        UPDATE cards 
        SET 
          scheduled = 1,
          review_interval = ?,
          ease_factor = ?,
          consecutive_correct = ?,
          last_reviewed = ?,
          next_review_date = ?
        WHERE id = ?
      `);

      const result = stmt.run(
        newInterval,
        newEaseFactor,
        newConsecutiveCorrect,
        nowISO,
        nextReviewDate.toISOString(),
        cardId,
      );

      return result.changes > 0;
    });
  }

  scheduleCard(cardId: number, scheduled: boolean = true): boolean {
    const stmt = this.db.prepare(`
    UPDATE cards 
    SET 
      scheduled = ?,
      next_review_date = CASE 
        WHEN ? = 1 THEN datetime('now') 
        ELSE NULL 
      END,
      review_interval = CASE 
        WHEN ? = 1 THEN 1 
        ELSE review_interval 
      END,
      ease_factor = CASE 
        WHEN ? = 1 THEN 2.5 
        ELSE ease_factor 
      END,
      consecutive_correct = CASE 
        WHEN ? = 1 THEN 0 
        ELSE consecutive_correct 
      END
    WHERE id = ?
  `);

    const result = stmt.run(
      scheduled ? 1 : 0,
      scheduled ? 1 : 0,
      scheduled ? 1 : 0,
      scheduled ? 1 : 0,
      scheduled ? 1 : 0,
      cardId,
    );
    return result.changes > 0;
  }

  getDueCardsCount(): { today: number; overdue: number; upcoming: number } {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    ).toISOString();

    const overdueCount =
      this.db
        .prepare(
          `
      SELECT COUNT(*) as count FROM cards 
      WHERE scheduled = 1 
      AND next_review_date < ?
    `,
        )
        .get(today)?.count || 0;

    const upcomingCount =
      this.db
        .prepare(
          `
      SELECT COUNT(*) as count FROM cards 
      WHERE scheduled = 1 
      AND next_review_date >= ?
    `,
        )
        .get(tomorrow)?.count || 0;

    // Count cards that are due right now
    const dueNowCount =
      this.db
        .prepare(
          `
      SELECT COUNT(*) as count FROM cards 
      WHERE scheduled = 1 
      AND (next_review_date IS NULL OR next_review_date <= ?)
    `,
        )
        .get(now.toISOString())?.count || 0;

    return {
      today: dueNowCount,
      overdue: overdueCount,
      upcoming: upcomingCount,
    };
  }

  logCardResponse(
    cardId: number,
    isCorrect: boolean,
    responseTime: number,
  ): boolean {
    return this.transaction(() => {
      // Log the response
      const logStmt = this.db.prepare(`
        INSERT INTO card_responses (card_id, is_correct, response_time)
        VALUES (?, ?, ?)
      `);
      logStmt.run(cardId, isCorrect ? 1 : 0, responseTime);

      // Update scheduling
      const success = this.updateCardScheduling(
        cardId,
        isCorrect,
        responseTime,
      );
      return success;
    });
  }

  getWeakCards(limit: number = 30): any[] {
    const query = `
      SELECT c.*, d.title as deck_title,
             COALESCE(incorrect_responses.incorrect_count, 0) as incorrect_count,
             COALESCE(total_responses.total_count, 0) as total_count,
             CASE 
               WHEN COALESCE(total_responses.total_count, 0) = 0 THEN 0
               ELSE (COALESCE(correct_responses.correct_count, 0) * 1.0 / total_responses.total_count)
             END as accuracy
      FROM cards c
      JOIN decks d ON c.deck_id = d.id
      LEFT JOIN (
        SELECT card_id, COUNT(*) as incorrect_count 
        FROM card_responses 
        WHERE is_correct = 0 
        GROUP BY card_id
      ) incorrect_responses ON c.id = incorrect_responses.card_id
      LEFT JOIN (
        SELECT card_id, COUNT(*) as total_count 
        FROM card_responses 
        GROUP BY card_id
      ) total_responses ON c.id = total_responses.card_id
      LEFT JOIN (
        SELECT card_id, COUNT(*) as correct_count 
        FROM card_responses 
        WHERE is_correct = 1 
        GROUP BY card_id
      ) correct_responses ON c.id = correct_responses.card_id
      WHERE c.scheduled = 1 
      AND (accuracy < 0.7 OR c.consecutive_correct < 3 OR total_count = 0)
      ORDER BY accuracy ASC, c.consecutive_correct ASC, c.id ASC
      LIMIT ?
    `;

    return this.db.prepare(query).all(limit);
  }

  scheduleAllCards(): boolean {
    return this.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE cards 
        SET 
          scheduled = 1,
          next_review_date = datetime('now'),
          review_interval = 1,
          ease_factor = 2.5,
          consecutive_correct = 0
        WHERE scheduled = 0 OR scheduled IS NULL
      `);

      const result = stmt.run();
      return result.changes > 0;
    });
  }

  // Add analytics for dashboard
  getCardAnalytics(): {
    totalCards: number;
    scheduledCards: number;
    masteredCards: number;
    learningCards: number;
  } {
    const totalCards =
      this.db.prepare("SELECT COUNT(*) as count FROM cards").get()?.count || 0;

    const scheduledCards =
      this.db
        .prepare("SELECT COUNT(*) as count FROM cards WHERE scheduled = 1")
        .get()?.count || 0;

    const masteredCards =
      this.db
        .prepare(
          "SELECT COUNT(*) as count FROM cards WHERE consecutive_correct >= 5",
        )
        .get()?.count || 0;

    const learningCards =
      this.db
        .prepare(
          "SELECT COUNT(*) as count FROM cards WHERE scheduled = 1 AND consecutive_correct < 5",
        )
        .get()?.count || 0;

    return {
      totalCards,
      scheduledCards,
      masteredCards,
      learningCards,
    };
  }

  getDueCardsByDeck(deckId: number, limit?: number): any[] {
    const now = new Date().toISOString();
    let query = `
    SELECT c.*, d.title as deck_title
    FROM cards c
    JOIN decks d ON c.deck_id = d.id
    WHERE c.deck_id = ? 
    AND c.scheduled = 1 
    AND (c.next_review_date IS NULL OR c.next_review_date <= ?)
    ORDER BY 
      CASE WHEN c.next_review_date IS NULL THEN 0 ELSE 1 END,
      c.next_review_date ASC, 
      c.consecutive_correct ASC,
      c.id ASC
  `;

    if (limit) query += ` LIMIT ?`;

    const params = limit ? [deckId, now, limit] : [deckId, now];
    return this.db.prepare(query).all(...params);
  }

  getDueCardsCountByDeck(deckId: number): {
    today: number;
    overdue: number;
    upcoming: number;
  } {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    ).toISOString();

    const overdueCount =
      this.db
        .prepare(
          `
        SELECT COUNT(*) as count FROM cards 
        WHERE deck_id = ? AND scheduled = 1 
        AND next_review_date < ?
      `,
        )
        .get(deckId, today)?.count || 0;

    const upcomingCount =
      this.db
        .prepare(
          `
        SELECT COUNT(*) as count FROM cards 
        WHERE deck_id = ? AND scheduled = 1 
        AND next_review_date >= ?
      `,
        )
        .get(deckId, tomorrow)?.count || 0;

    // Count cards that are due right now
    const dueNowCount =
      this.db
        .prepare(
          `
        SELECT COUNT(*) as count FROM cards 
        WHERE deck_id = ? AND scheduled = 1 
        AND (next_review_date IS NULL OR next_review_date <= ?)
      `,
        )
        .get(deckId, now.toISOString())?.count || 0;

    return {
      today: dueNowCount,
      overdue: overdueCount,
      upcoming: upcomingCount,
    };
  }
}
