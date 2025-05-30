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

	getAnalytics(): QuizAnalytics {
		try {
			const totalAttempts =
				this.db.prepare("SELECT COUNT(*) as count FROM quiz_attempts").get()
					?.count || 0;

			const avgScore =
				this.db
					.prepare("SELECT AVG(percentage) as avg FROM quiz_attempts")
					.get()?.avg || 0;

			const recentAttempts =
				this.db
					.prepare(`
          SELECT COUNT(*) as count 
          FROM quiz_attempts 
          WHERE date(created_at) >= date('now', '-7 days')
        `)
					.get()?.count || 0;

			const streak = this.calculateStudyStreak();

			const questionsToday =
				this.db
					.prepare(`
          SELECT COUNT(*) as count 
          FROM question_responses qr
          JOIN quiz_attempts qa ON qr.attempt_id = qa.id
          WHERE date(qa.created_at) = date('now')
        `)
					.get()?.count || 0;

			const accuracyData = this.db
				.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
          FROM question_responses qr
          JOIN quiz_attempts qa ON qr.attempt_id = qa.id
          WHERE date(qa.created_at) >= date('now', '-30 days')
        `)
				.get();

			const accuracy =
				accuracyData?.total > 0
					? Math.round((accuracyData.correct / accuracyData.total) * 100)
					: 0;

			return {
				totalAttempts,
				averageScore: Math.round(avgScore),
				recentAttempts,
				studyStreak: streak,
				questionsToday,
				accuracy,
			};
		} catch (error) {
			console.error("Error getting analytics:", error);
			return {
				totalAttempts: 0,
				averageScore: 0,
				recentAttempts: 0,
				studyStreak: 0,
				questionsToday: 0,
				accuracy: 0,
			};
		}
	}

	private calculateStudyStreak(): number {
		try {
			const attempts = this.db
				.prepare(`
          SELECT DISTINCT date(created_at) as study_date 
          FROM quiz_attempts 
          ORDER BY study_date DESC
        `)
				.all() as { study_date: string }[];

			if (attempts.length === 0) return 0;

			let streak = 0;
			const today = new Date().toISOString().split("T")[0];
			const currentDate = new Date();

			for (const attempt of attempts) {
				const studyDate = attempt.study_date;
				const expectedDate = currentDate.toISOString().split("T")[0];

				if (studyDate === expectedDate) {
					streak++;
					currentDate.setDate(currentDate.getDate() - 1);
				} else if (studyDate === today && streak === 0) {
					streak = 1;
					currentDate.setDate(currentDate.getDate() - 1);
				} else {
					break;
				}
			}

			return streak;
		} catch (error) {
			console.error("Error calculating study streak:", error);
			return 0;
		}
	}

	getDailyActivity(): DailyActivity[] {
		try {
			return this.db
				.prepare(`
          SELECT 
            date(created_at) as date,
            COUNT(*) as attempts,
            AVG(percentage) as avg_score
          FROM quiz_attempts 
          WHERE date(created_at) >= date('now', '-7 days')
          GROUP BY date(created_at)
          ORDER BY date DESC
        `)
				.all() as DailyActivity[];
		} catch (error) {
			console.error("Error getting daily activity:", error);
			return [];
		}
	}

	getSubjectPerformance(): SubjectPerformance[] {
		try {
			return this.db
				.prepare(`
          SELECT 
            q.title as subject,
            COUNT(qa.id) as attempts,
            AVG(qa.percentage) as avg_score,
            MAX(qa.created_at) as last_attempt
          FROM quiz_attempts qa
          JOIN quiz q ON qa.quiz_id = q.id
          GROUP BY q.id, q.title
          ORDER BY avg_score DESC
        `)
				.all() as SubjectPerformance[];
		} catch (error) {
			console.error("Error getting subject performance:", error);
			return [];
		}
	}
}
