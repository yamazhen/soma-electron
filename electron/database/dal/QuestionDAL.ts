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
        scheduled = false,
        options = [],
        answers = [],
      } = data;

      const insertQuestion = this.db.prepare(
        "INSERT INTO questions (quiz_id, text, type, boolean_answer, scheduled) VALUES (?, ?, ?, ?, ?)",
      );

      const result = insertQuestion.run(
        quiz_id,
        text,
        type,
        boolean_answer === null ? null : boolean_answer ? 1 : 0,
        scheduled ? 1 : 0,
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
}
