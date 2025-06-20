import { BaseDAL } from "./BaseDAL";

export class QuizDAL extends BaseDAL {
  getAll(): Quiz[] {
    return this.db.prepare("SELECT * FROM quiz ORDER BY created_at DESC").all();
  }

  getById(id: number): Quiz | undefined {
    return this.db.prepare("SELECT * FROM quiz WHERE id = ?").get(id);
  }

  getByContentHash(contentHash: string): Quiz | undefined {
    return this.db
      .prepare("SELECT * FROM quiz WHERE content_hash = ?")
      .get(contentHash);
  }

  create(title: string, contentHash?: string): number {
    const stmt = this.db.prepare(
      "INSERT INTO quiz (title, content_hash) VALUES (?, ?)",
    );
    const result = stmt.run(title, contentHash);
    return result.lastInsertRowid as number;
  }

  update(id: number, title: string): boolean {
    const stmt = this.db.prepare("UPDATE quiz SET title = ? WHERE id = ?");
    const result = stmt.run(title, id);
    return result.changes > 0;
  }

  delete(id: number): boolean {
    return this.transaction(() => {
      const attempts = this.db
        .prepare("SELECT id FROM quiz_attempts WHERE quiz_id = ?")
        .all(id);

      for (const attempt of attempts) {
        this.db
          .prepare("DELETE FROM question_responses WHERE attempt_id = ?")
          .run(attempt.id);
      }

      this.db.prepare("DELETE FROM quiz_attempts WHERE quiz_id = ?").run(id);

      const questions = this.db
        .prepare("SELECT id FROM questions WHERE quiz_id = ?")
        .all(id);

      for (const question of questions) {
        this.db
          .prepare("DELETE FROM options WHERE question_id = ?")
          .run(question.id);
        this.db
          .prepare("DELETE FROM answers WHERE question_id = ?")
          .run(question.id);
      }

      this.db.prepare("DELETE FROM questions WHERE quiz_id = ?").run(id);

      const stmt = this.db.prepare("DELETE FROM quiz WHERE id = ?");
      const result = stmt.run(id);
      return result.changes > 0;
    });
  }
}
