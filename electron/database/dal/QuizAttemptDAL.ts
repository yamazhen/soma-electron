import { BaseDAL } from "./BaseDAL";

const topFailedQuery = `
SELECT question_id, COUNT(*) as failure_count
    FROM question_responses
    WHERE is_correct = 0
    GROUP BY question_id
    ORDER BY failure_count DESC
    LIMIT ?
`;

export class QuizAttemptDAL extends BaseDAL {
  getAll(): QuizAttempt[] {
    return this.db
      .prepare("SELECT * FROM quiz_attempts ORDER BY created_at DESC")
      .all();
  }

  getByQuizId(quizId: number): QuizAttempt[] {
    return this.db
      .prepare(
        "SELECT * FROM quiz_attempts WHERE quiz_id = ? ORDER BY created_at DESC",
      )
      .all(quizId);
  }

  getById(id: number): QuizAttempt | undefined {
    return this.db.prepare("SELECT * FROM quiz_attempts WHERE id = ?").get(id);
  }

  getTopFailedQuestionIds(limit: number = 30): number[] {
    const result: QuestionResponse[] = this.db
      .prepare(topFailedQuery)
      .all(limit);
    return result.map((row) => row.question_id);
  }

  getWithResponses(id: number): AttemptWithResponses | undefined {
    const attempt = this.getById(id);
    if (!attempt) return undefined;

    const responses = this.db
      .prepare("SELECT * FROM question_responses WHERE attempt_id = ?")
      .all(id);

    return {
      ...attempt,
      responses,
    };
  }

  create(data: {
    quiz_id: number;
    score: number;
    total_questions: number;
  }): number {
    const stmt = this.db.prepare(
      "INSERT INTO quiz_attempts (quiz_id, score, total_questions) VALUES (?, ?, ?)",
    );

    const result = stmt.run(data.quiz_id, data.score, data.total_questions);

    return result.lastInsertRowid as number;
  }

  saveResponse(data: {
    attempt_id: number;
    question_id: number;
    user_answer: string;
    is_correct: boolean;
  }): number {
    const stmt = this.db.prepare(
      "INSERT INTO question_responses (attempt_id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)",
    );

    const result = stmt.run(
      data.attempt_id,
      data.question_id,
      data.user_answer,
      data.is_correct ? 1 : 0,
    );

    return result.lastInsertRowid as number;
  }

  delete(id: number): boolean {
    return this.transaction(() => {
      this.db
        .prepare("DELETE FROM question_responses WHERE attempt_id = ?")
        .run(id);

      const stmt = this.db.prepare("DELETE FROM quiz_attempts WHERE id = ?");
      const result = stmt.run(id);
      return result.changes > 0;
    });
  }
}
