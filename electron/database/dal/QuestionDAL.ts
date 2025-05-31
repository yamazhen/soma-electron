import { BaseDAL } from "./BaseDAL";

export class QuestionDAL extends BaseDAL {
  getByQuizId(quizId: number): QuestionWithDetails[] {
    const questions = this.db
      .prepare("SELECT * FROM questions WHERE quiz_id = ? ORDER BY id")
      .all(quizId);

    return questions.map((question) => this.loadDetails(question));
  }

  getById(id: number): QuestionWithDetails | undefined {
    const question = this.db
      .prepare("SELECT * FROM questions WHERE id = ?")
      .get(id);

    if (!question) return undefined;

    return this.loadDetails(question);
  }

  getScheduled(scheduled: boolean = true): QuestionWithDetails[] {
    const questions = this.db
      .prepare("SELECT * FROM questions WHERE scheduled = ? ORDER BY id")
      .all(scheduled ? 1 : 0);

    return questions.map((question) => this.loadDetails(question));
  }

  private loadDetails(question: Question): QuestionWithDetails {
    const result: QuestionWithDetails = { ...question };

    if (question.type === "multiple-choice") {
      result.options = this.db
        .prepare("SELECT * FROM options WHERE question_id = ? ORDER BY id")
        .all(question.id);
    } else if (question.type === "text-answer") {
      result.answers = this.db
        .prepare("SELECT * FROM answers WHERE question_id = ? ORDER BY id")
        .all(question.id);
    }

    return result;
  }

  create(data: {
    quiz_id: number;
    text: string;
    type: QuestionType;
    boolean_answer?: boolean | null;
    scheduled?: boolean;
    options?: { text: string; is_correct: boolean }[];
    answers?: string[];
  }): number {
    return this.transaction(() => {
      const {
        quiz_id,
        text,
        type,
        boolean_answer = null,
        scheduled = true,
        options = [],
        answers = [],
      } = data;

      const insertQuestion = this.db.prepare(`
      INSERT INTO questions (
        quiz_id, text, type, boolean_answer, scheduled,
        next_review_date, review_interval, ease_factor, consecutive_correct
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      const now = new Date().toISOString();
      const nextReviewDate = scheduled ? now : null;
      const initialInterval = 1;
      const initialEaseFactor = 2.5;
      const initialConsecutiveCorrect = 0;

      const result = insertQuestion.run(
        quiz_id,
        text,
        type,
        boolean_answer === null ? null : boolean_answer ? 1 : 0,
        scheduled ? 1 : 0,
        nextReviewDate,
        initialInterval,
        initialEaseFactor,
        initialConsecutiveCorrect,
      );

      const questionId = result.lastInsertRowid as number;

      if (type === "multiple-choice" && options.length > 0) {
        const insertOption = this.db.prepare(
          "INSERT INTO options (question_id, text, is_correct) VALUES (?, ?, ?)",
        );

        for (const option of options) {
          insertOption.run(questionId, option.text, option.is_correct ? 1 : 0);
        }
      }

      if (type === "text-answer" && answers.length > 0) {
        const insertAnswer = this.db.prepare(
          "INSERT INTO answers (question_id, text) VALUES (?, ?)",
        );

        for (const answer of answers) {
          insertAnswer.run(questionId, answer);
        }
      }

      return questionId;
    });
  }

  update(
    id: number,
    data: Partial<{
      text: string;
      type: QuestionType;
      boolean_answer: boolean | null;
      scheduled: boolean;
      options: { text: string; is_correct: boolean }[];
      answers: string[];
    }>,
  ): boolean {
    return this.transaction(() => {
      const question = this.getById(id);
      if (!question) return false;

      const updateFields: string[] = [];
      const params: any[] = [];

      if (data.text !== undefined) {
        updateFields.push("text = ?");
        params.push(data.text);
      }

      if (data.type !== undefined) {
        updateFields.push("type = ?");
        params.push(data.type);
      }

      if (data.boolean_answer !== undefined) {
        updateFields.push("boolean_answer = ?");
        params.push(data.boolean_answer);
      }

      if (data.scheduled !== undefined) {
        updateFields.push("scheduled = ?");
        params.push(data.scheduled ? 1 : 0);
      }

      if (updateFields.length > 0) {
        params.push(id);
        const updateQuery = `UPDATE questions SET ${updateFields.join(", ")} WHERE id = ?`;
        this.db.prepare(updateQuery).run(...params);
      }

      if (
        (data.type === "multiple-choice" ||
          question.type === "multiple-choice") &&
        data.options !== undefined
      ) {
        this.db.prepare("DELETE FROM options WHERE question_id = ?").run(id);

        if (data.options.length > 0) {
          const insertOption = this.db.prepare(
            "INSERT INTO options (question_id, text, is_correct) VALUES (?, ?, ?)",
          );

          for (const option of data.options) {
            insertOption.run(id, option.text, option.is_correct ? 1 : 0);
          }
        }
      }

      if (
        (data.type === "text-answer" || question.type === "text-answer") &&
        data.answers !== undefined
      ) {
        this.db.prepare("DELETE FROM answers WHERE question_id = ?").run(id);

        if (data.answers.length > 0) {
          const insertAnswer = this.db.prepare(
            "INSERT INTO answers (question_id, text) VALUES (?, ?)",
          );

          for (const answer of data.answers) {
            insertAnswer.run(id, answer);
          }
        }
      }

      return true;
    });
  }

  updateScheduled(id: number, scheduled: boolean): boolean {
    const stmt = this.db.prepare(
      "UPDATE questions SET scheduled = ? WHERE id = ?",
    );
    const result = stmt.run(scheduled ? 1 : 0, id);
    return result.changes > 0;
  }

  delete(id: number): boolean {
    return this.transaction(() => {
      this.db.prepare("DELETE FROM options WHERE question_id = ?").run(id);

      this.db.prepare("DELETE FROM answers WHERE question_id = ?").run(id);

      this.db
        .prepare("DELETE FROM question_responses WHERE question_id = ?")
        .run(id);

      const stmt = this.db.prepare("DELETE FROM questions WHERE id = ?");
      const result = stmt.run(id);
      return result.changes > 0;
    });
  }

  unscheduleAll(): boolean {
    const stmt = this.db.prepare("UPDATE questions SET scheduled = 0");
    const result = stmt.run();
    return result.changes > 0;
  }

  getScheduledQuestions(limit?: number): QuestionWithDetails[] {
    const now = new Date().toISOString();
    let query = `
      SELECT * FROM questions 
      WHERE scheduled = 1 
      AND (next_review_date IS NULL OR next_review_date <= ?)
      ORDER BY next_review_date ASC, id ASC
    `;

    if (limit) {
      query += ` LIMIT ?`;
      const questions = this.db.prepare(query).all(now, limit);
      return questions.map((q) => this.loadDetails(q));
    }

    const questions = this.db.prepare(query).all(now);
    return questions.map((q) => this.loadDetails(q));
  }

  getDueQuestionsCount(): { today: number; overdue: number; upcoming: number } {
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

    const todayCount =
      this.db
        .prepare(
          `
      SELECT COUNT(*) as count FROM questions 
      WHERE scheduled = 1 
      AND next_review_date >= ? 
      AND next_review_date < ?
    `,
        )
        .get(today, tomorrow)?.count || 0;

    const overdueCount =
      this.db
        .prepare(
          `
      SELECT COUNT(*) as count FROM questions 
      WHERE scheduled = 1 
      AND next_review_date < ?
    `,
        )
        .get(today)?.count || 0;

    const upcomingCount =
      this.db
        .prepare(
          `
      SELECT COUNT(*) as count FROM questions 
      WHERE scheduled = 1 
      AND next_review_date >= ?
    `,
        )
        .get(tomorrow)?.count || 0;

    const dueNowCount =
      this.db
        .prepare(
          `
      SELECT COUNT(*) as count FROM questions 
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

  getQuestionsByScheduleStatus(
    status: "due-today" | "overdue" | "upcoming",
  ): QuestionWithDetails[] {
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

    let query = `SELECT * FROM questions WHERE scheduled = 1 `;
    let params: string[] = [];

    switch (status) {
      case "due-today":
        query += `AND next_review_date >= ? AND next_review_date < ?`;
        params = [today, tomorrow];
        break;
      case "overdue":
        query += `AND next_review_date < ?`;
        params = [today];
        break;
      case "upcoming":
        query += `AND next_review_date >= ?`;
        params = [tomorrow];
        break;
    }

    query += ` ORDER BY next_review_date ASC`;

    const questions = this.db.prepare(query).all(...params);
    return questions.map((q) => this.loadDetails(q));
  }

  scheduleExistingQuestions(): boolean {
    return this.transaction(() => {
      const unscheduledQuestions = this.db
        .prepare(
          `
      SELECT COUNT(*) as count FROM questions 
      WHERE scheduled = 0 OR scheduled IS NULL
    `,
        )
        .get() as { count: number };

      if (unscheduledQuestions.count === 0) {
        return false;
      }

      const stmt = this.db.prepare(`
      UPDATE questions 
      SET 
        scheduled = 1,
        next_review_date = datetime('now'),
        review_interval = 1,
        ease_factor = 2.5,
        consecutive_correct = 0,
        last_reviewed = NULL
      WHERE scheduled = 0 OR scheduled IS NULL
    `);

      const result = stmt.run();
      return result.changes > 0;
    });
  }

  scheduleAllExistingQuestions(): boolean {
    return this.transaction(() => {
      const stmt = this.db.prepare(`
      UPDATE questions 
      SET 
        scheduled = 1,
        next_review_date = datetime('now', '+1 day'),
        review_interval = 1,
        ease_factor = 2.5,
        consecutive_correct = 0
      WHERE scheduled = 0 OR scheduled IS NULL
    `);

      const result = stmt.run();
      return result.changes > 0;
    });
  }

  getDueQuestions(limit?: number): QuestionWithDetails[] {
    const now = new Date().toISOString();
    let query = `
    SELECT * FROM questions 
    WHERE scheduled = 1 
    AND (next_review_date IS NULL OR next_review_date <= ?)
    ORDER BY 
      CASE WHEN next_review_date IS NULL THEN 0 ELSE 1 END,
      next_review_date ASC, 
      consecutive_correct ASC,
      id ASC
  `;

    if (limit) {
      query += ` LIMIT ?`;
      const questions = this.db.prepare(query).all(now, limit);
      return questions.map((q) => this.loadDetails(q));
    }

    const questions = this.db.prepare(query).all(now);
    return questions.map((q) => this.loadDetails(q));
  }

  getScheduledQuestionsByQuizId(quizId: number): QuestionWithDetails[] {
    const questions = this.db
      .prepare(
        `
      SELECT * FROM questions 
      WHERE quiz_id = ? AND scheduled = 1 
      ORDER BY next_review_date ASC, id ASC
    `,
      )
      .all(quizId);

    return questions.map((question) => this.loadDetails(question));
  }

  updateScheduling(
    questionId: number,
    isCorrect: boolean,
    responseTime: number,
  ): boolean {
    return this.transaction(() => {
      const question = this.getById(questionId);
      if (!question) return false;

      const now = new Date();
      const nowISO = now.toISOString();
      let newInterval = question.review_interval || 1;
      let newEaseFactor = question.ease_factor || 2.5;
      let newConsecutiveCorrect = question.consecutive_correct || 0;

      const isEarlyReview =
        question.next_review_date && new Date(question.next_review_date) > now;

      if (isCorrect) {
        newConsecutiveCorrect++;

        if (newConsecutiveCorrect === 1) {
          newInterval = 1;
        } else if (newConsecutiveCorrect === 2) {
          newInterval = 6;
        } else {
          newInterval = Math.ceil(newInterval * newEaseFactor);
        }

        if (isEarlyReview && newConsecutiveCorrect > 2) {
          const daysBetween = question.next_review_date
            ? Math.max(
                1,
                Math.floor(
                  (new Date(question.next_review_date).getTime() -
                    now.getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              )
            : 0;

          const earlyPenalty = Math.max(0.5, 1 - daysBetween / newInterval);
          newInterval = Math.ceil(newInterval * earlyPenalty);
        }

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
        newConsecutiveCorrect = 0;
        newInterval = 1;

        const quality = 2;
        newEaseFactor = Math.max(
          1.3,
          newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
        );
      }

      if (responseTime && isCorrect) {
        const avgResponseTime = 15;
        if (responseTime < avgResponseTime / 2) {
          newInterval = Math.ceil(newInterval * 0.9);
        } else if (responseTime > avgResponseTime * 2) {
          newInterval = Math.ceil(newInterval * 1.1);
        }
      }

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

      const stmt = this.db.prepare(`
      UPDATE questions 
      SET 
        review_interval = ?,
        ease_factor = ?,
        consecutive_correct = ?,
        last_reviewed = ?,
        next_review_date = ?,
        scheduled = 1
      WHERE id = ?
    `);

      const result = stmt.run(
        newInterval,
        newEaseFactor,
        newConsecutiveCorrect,
        nowISO,
        nextReviewDate.toISOString(),
        questionId,
      );

      return result.changes > 0;
    });
  }

  getQuizDueQuestions(quizId: number, limit?: number): QuestionWithDetails[] {
    const now = new Date().toISOString();
    let query = `
    SELECT * FROM questions 
    WHERE quiz_id = ? 
    AND scheduled = 1 
    AND (next_review_date IS NULL OR next_review_date <= ?)
    ORDER BY 
      CASE WHEN next_review_date IS NULL THEN 0 ELSE 1 END,
      next_review_date ASC, 
      consecutive_correct ASC,
      id ASC
  `;

    if (limit) {
      query += ` LIMIT ?`;
      const questions = this.db.prepare(query).all(quizId, now, limit);
      return questions.map((q) => this.loadDetails(q));
    }

    const questions = this.db.prepare(query).all(quizId, now);
    return questions.map((q) => this.loadDetails(q));
  }
}
