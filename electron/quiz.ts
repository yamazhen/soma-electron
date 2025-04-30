import { ipcMain } from "electron";
import { getDatabase } from "./database/database";

// function to save quiz review data
export function saveQuizReview(submission: QuizSubmission): number {
  const db = getDatabase();

  try {
    return db.transaction((data: QuizSubmission) => {
      const quiz = quizFindById(data.quizId);

      if (!quiz) {
        throw new Error("Quiz not found");
      }

      const correct_questions: number[] = [];
      const wrong_questions: number[] = [];

      for (const answer of data.answers) {
        const question = quiz.questions.find((q) => q.id === answer.questionId);

        if (!question) {
          continue;
        }

        const isCorrect = checkIfAnswerIsCorrect(question, answer.answer);

        if (isCorrect) {
          correct_questions.push(question.id);
        } else {
          wrong_questions.push(question.id);

          scheduleQuestionForReview(question.id);
        }
      }

      const score = correct_questions.length;

      const insertReview = db.prepare(`
        INSERT INTO quiz_review (
          quiz_id, 
          correct_questions, 
          wrong_questions,
          score
        ) VALUES (?, ?, ?, ?)
      `);

      const reviewResult = insertReview.run(
        data.quizId,
        JSON.stringify(correct_questions),
        JSON.stringify(wrong_questions),
        score,
      );

      return reviewResult.lastInsertRowid;
    })(submission);
  } catch (e) {
    console.error("Error saving quiz review:", e);
    throw e;
  }
}

// helper function to check if an answer is correct
function checkIfAnswerIsCorrect(
  question: QuizQuestion,
  answer: string,
): boolean {
  if (question.type === "true-false") {
    return (answer === "true") === question.correctAnswer;
  }

  if (question.type === "multiple-choice") {
    const correctOption = question.options?.find((opt) => opt.isCorrect);
    return (
      answer === correctOption?.text || answer === correctOption?.id?.toString()
    );
  }

  if (question.type === "fill-in-blank" || question.type === "short-answer") {
    const possibleAnswers =
      question.type === "fill-in-blank"
        ? question.answers
        : question.possibleAnswers;

    return (
      possibleAnswers?.some(
        (possible) =>
          possible.toLowerCase().trim() === answer.toLowerCase().trim(),
      ) || false
    );
  }

  return false;
}

// function to schedule a question for review
function scheduleQuestionForReview(questionId: number): void {
  const db = getDatabase();

  try {
    const updateStmt = db.prepare(`
      UPDATE questions 
      SET scheduled = 1
      WHERE id = ?
    `);
    updateStmt.run(questionId);
  } catch (e) {
    console.error("Error scheduling question for review:", e);
  }
}

// function to get a review by id
function getQuizReviewById(reviewId: number): QuizReview | null {
  const db = getDatabase();

  try {
    const stmt = db.prepare(`
      SELECT * FROM quiz_review WHERE id = ?
    `);

    const review = stmt.get(reviewId);

    if (!review) {
      return null;
    }

    return {
      id: review.id,
      quizId: review.quiz_id,
      score: review.score,
      correct_questions: JSON.parse(review.correct_questions || "[]"),
      wrong_questions: JSON.parse(review.wrong_questions || "[]"),
      createdAt: new Date(review.created_at),
    };
  } catch (e) {
    console.error("Error retrieving quiz review:", e);
    return null;
  }
}

// function to get all reviews for a quiz
function getQuizReviews(quizId: number): QuizReview[] {
  const db = getDatabase();

  try {
    const stmt = db.prepare(`
      SELECT * FROM quiz_review 
      WHERE quiz_id = ? 
      ORDER BY created_at DESC
    `);

    const reviews = stmt.all(quizId);

    return reviews.map((review: any) => ({
      id: review.id,
      quizId: review.quiz_id,
      score: review.score,
      correct_questions: JSON.parse(review.correct_questions || "[]"),
      wrong_questions: JSON.parse(review.wrong_questions || "[]"),
      createdAt: new Date(review.created_at),
    }));
  } catch (e) {
    console.error("Error retrieving quiz reviews:", e);
    return [];
  }
}

// make a function to save quiz to db
export function quizSave(quizData: QuizData): number {
  const db = getDatabase();
  const transaction = db.transaction((data: QuizData) => {
    const insertQuiz = db.prepare("INSERT INTO quiz (title) VALUES (?)");
    const quizResult = insertQuiz.run(data.title);
    const quizId = quizResult.lastInsertRowid;

    const insertQuestion = db.prepare(`
      INSERT INTO questions (id, quiz_id, text, type, correct_answer, scheduled) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertOption = db.prepare(`
      INSERT INTO options (question_id, text, is_correct) 
      VALUES (?, ?, ?)
    `);

    const insertAnswer = db.prepare(`
      INSERT INTO answers (question_id, text) 
      VALUES (?, ?)
    `);

    for (const question of data.questions) {
      let correctAnswer = null;
      if (question.type === "true-false") {
        correctAnswer = question.correctAnswer ? 1 : 0;
      }

      const questionResult = insertQuestion.run(
        null,
        quizId,
        question.text,
        question.type,
        correctAnswer,
        question.scheduled ?? 0,
      );

      const newQuestionId = questionResult.lastInsertRowid;

      if (
        question.type === "multiple-choice" &&
        question.options !== undefined
      ) {
        for (const option of question.options) {
          insertOption.run(
            newQuestionId,
            option.text,
            option.isCorrect ? 1 : 0,
          );
        }
      }

      if (question.type === "fill-in-blank" && question.answers !== undefined) {
        for (const answer of question.answers) {
          insertAnswer.run(newQuestionId, answer);
        }
      }

      if (
        question.type === "short-answer" &&
        question.possibleAnswers !== undefined
      ) {
        for (const answer of question.possibleAnswers) {
          insertAnswer.run(newQuestionId, answer);
        }
      }
    }
    return quizId;
  });

  try {
    const newQuizId = transaction(quizData);
    return newQuizId;
  } catch (e) {
    console.error("Error saving quiz:", e);
    throw e;
  }
}
// make a function to get quiz frm db
function quizFindById(quizId: number): QuizData | null {
  try {
    const db = getDatabase();

    const quizStmt = db.prepare("SELECT * FROM quiz WHERE id = ?");
    const quizRow = quizStmt.get(quizId);
    if (!quizRow) return null;

    const questionsStmt = db.prepare(
      "SELECT * FROM questions WHERE quiz_id = ?",
    );
    const questionsRows = questionsStmt.all(quizId);

    const optionStmt = db.prepare(
      "SELECT * FROM options WHERE question_id = ?",
    );
    const answerStmt = db.prepare(
      "SELECT * FROM answers WHERE question_id = ?",
    );

    const questions: QuizQuestion[] = questionsRows.map((row: any) => {
      const base: QuizQuestion = {
        id: row.id,
        text: row.text,
        type: row.type,
        scheduled: !!row.scheduled,
      };

      if (row.type === "multiple-choice") {
        const options = optionStmt.all(row.id).map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: !!opt.is_correct,
        }));
        return { ...base, options };
      }

      if (row.type === "fill-in-blank") {
        const answers = answerStmt.all(row.id).map((ans: any) => ans.text);
        return { ...base, answers };
      }

      if (row.type === "short-answer") {
        const possibleAnswers = answerStmt
          .all(row.id)
          .map((ans: any) => ans.text);
        return { ...base, possibleAnswers };
      }

      if (row.type === "true-false") {
        return { ...base, correctAnswer: !!row.correct_answer };
      }

      return base;
    });

    return {
      id: quizRow.id,
      title: quizRow.title,
      questions,
    };
  } catch (e) {
    console.error("Error getting quiz:", e);
    return null;
  }
}

// function to find all quiz
function quizFindAll(): QuizData[] | null {
  try {
    const db = getDatabase();

    const quizStmt = db.prepare("SELECT * FROM quiz");
    const quizzes = quizStmt.all();

    const questionsStmt = db.prepare(
      "SELECT * FROM questions WHERE quiz_id = ?",
    );
    const optionStmt = db.prepare(
      "SELECT * FROM options WHERE question_id = ?",
    );
    const answerStmt = db.prepare(
      "SELECT * FROM answers WHERE question_id = ?",
    );

    const results: QuizData[] = quizzes.map((quiz: any) => {
      const questionsRows = questionsStmt.all(quiz.id);

      const questions: QuizQuestion[] = questionsRows.map((row: any) => {
        const base: QuizQuestion = {
          id: row.id,
          text: row.text,
          type: row.type,
          scheduled: !!row.scheduled,
        };

        if (row.type === "multiple-choice") {
          const options = optionStmt.all(row.id).map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: !!opt.is_correct,
          }));
          return { ...base, options };
        }

        if (row.type === "fill-in-blank") {
          const answers = answerStmt.all(row.id).map((ans: any) => ans.text);
          return { ...base, answers };
        }

        if (row.type === "short-answer") {
          const possibleAnswers = answerStmt
            .all(row.id)
            .map((ans: any) => ans.text);
          return { ...base, possibleAnswers };
        }

        if (row.type === "true-false") {
          return { ...base, correctAnswer: !!row.correct_answer };
        }

        return base;
      });
      return {
        id: quiz.id,
        title: quiz.title,
        questions,
      };
    });
    return results;
  } catch (e) {
    console.error("Error getting quizzes:", e);
    return null;
  }
}

// handler setup
export function setupQuizHandlers() {
  ipcMain.handle("quiz-save", async (_event, quizData: QuizData) => {
    try {
      const quizId = quizSave(quizData);
      return { success: true, quizId };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("quiz-find-all", async () => {
    try {
      const quizData = quizFindAll();
      if (!quizData) {
        return { success: false, error: "No quizzes found" };
      }
      return { success: true, quizData };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("quiz-find-by-id", async (_event, quizId: number) => {
    try {
      const quizData = quizFindById(quizId);
      if (!quizData) {
        return { success: false, error: "Quiz not found" };
      }
      return { success: true, quizData };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle(
    "review-submit",
    async (_event, submission: QuizSubmission) => {
      try {
        const reviewId = saveQuizReview(submission);
        const review = getQuizReviewById(reviewId);

        return {
          success: true,
          reviewId,
          review,
        };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  );

  ipcMain.handle("review_find_by_id", async (_event, reviewId: number) => {
    try {
      const review = getQuizReviewById(reviewId);
      if (!review) {
        return { success: false, error: "Review not found" };
      }
      return { success: true, review };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("review_find_by_quiz_id", async (_event, quizId: number) => {
    try {
      const reviews = getQuizReviews(quizId);
      return { success: true, reviews };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
}
