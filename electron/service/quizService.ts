import { QuestionDAL, QuizAttemptDAL, QuizDAL } from "../database/dal";

export class QuizService {
  private quizDAL = new QuizDAL();
  private questionDAL = new QuestionDAL();
  private attemptDAL = new QuizAttemptDAL();

  getAllQuizzes(): QuizDetails[] {
    const quizzes = this.quizDAL.getAll();

    return quizzes.map((quiz) => {
      const questions = this.questionDAL.getByQuizId(quiz.id);
      return {
        ...quiz,
        questions: questions,
        count: questions.length,
      };
    });
  }

  getQuizDetails(id: number): QuizDetails | null {
    const quiz = this.quizDAL.getById(id);
    if (!quiz) return null;

    const questions = this.questionDAL.getByQuizId(id);
    return { ...quiz, questions: questions, count: questions.length };
  }

  createQuiz(
    title: string,
    questions: {
      text: string;
      type: QuestionType;
      boolean_answer?: boolean | null;
      scheduled?: boolean;
      options?: { text: string; is_correct: boolean }[];
      answers?: string[];
    }[] = [],
  ): number {
    if (!title.trim()) {
      throw new Error("Quiz title cannot be empty");
    }

    const quizId = this.quizDAL.create(title);

    for (const question of questions) {
      this.questionDAL.create({
        quiz_id: quizId,
        text: question.text,
        type: question.type,
        boolean_answer: question.boolean_answer,
        scheduled: question.scheduled,
        options: question.options,
        answers: question.answers,
      });
    }

    return quizId;
  }

  updateQuiz(id: number, title: string): boolean {
    return this.quizDAL.update(id, title);
  }

  deleteQuiz(id: number): boolean {
    return this.quizDAL.delete(id);
  }

  addQuestion(
    quizId: number,
    question: {
      text: string;
      type: QuestionType;
      boolean_answer?: boolean | null;
      scheduled?: boolean;
      options?: { text: string; is_correct: boolean }[];
      answers?: string[];
    },
  ): number {
    const quiz = this.quizDAL.getById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    return this.questionDAL.create({
      quiz_id: quizId,
      ...question,
    });
  }

  updateQuestion(
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
    return this.questionDAL.update(id, data);
  }

  deleteQuestion(id: number): boolean {
    return this.questionDAL.delete(id);
  }

  scheduleQuestion(id: number, scheduled: boolean): boolean {
    return this.questionDAL.updateScheduled(id, scheduled);
  }

  scheduleTopFailedQuestions(): boolean {
    const topThirtyFailedQuestions = this.attemptDAL.getTopFailedQuestionIds();

    if (topThirtyFailedQuestions.length === 0) return false;

    this.questionDAL.unscheduleAll();
    for (const questionId of topThirtyFailedQuestions) {
      this.questionDAL.updateScheduled(questionId, true);
    }
    return true;
  }

  submitQuizAttempt(
    quizId: number,
    answers: { questionId: number; answer: string }[],
  ): QuizReview {
    const quiz = this.quizDAL.getById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const questions = this.questionDAL.getByQuizId(quizId);

    if (questions.length === 0) {
      throw new Error("Quiz has no questions");
    }

    let score = 0;
    const responses: {
      question_id: number;
      user_answer: string;
      is_correct: boolean;
    }[] = [];

    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.questionId);

      if (!question) continue;

      const isCorrect = this.checkAnswer(question, answer.answer);

      if (isCorrect) score++;

      responses.push({
        question_id: answer.questionId,
        user_answer: answer.answer,
        is_correct: isCorrect,
      });
    }

    if (responses.length !== questions.length) {
      const answeredQuestionIds = new Set(responses.map((r) => r.question_id));

      for (const question of questions) {
        if (!answeredQuestionIds.has(question.id)) {
          responses.push({
            question_id: question.id,
            user_answer: "TIMEOUT",
            is_correct: false,
          });
        }
      }
    }

    const attemptId = this.attemptDAL.create({
      quiz_id: quizId,
      score,
      total_questions: questions.length,
    });

    for (const response of responses) {
      this.attemptDAL.saveResponse({
        attempt_id: attemptId,
        ...response,
      });
    }

    const attempt = this.attemptDAL.getWithResponses(attemptId);
    if (!attempt) {
      throw new Error("Failed to retrieve attempt");
    }

    return {
      id: attempt.id,
      score: attempt.score,
      percentage: attempt.percentage,
      correct_questions: attempt.responses
        .filter((r) => r.is_correct)
        .map((r) => r.question_id),
      wrong_questions: attempt.responses
        .filter((r) => !r.is_correct)
        .map((r) => r.question_id),
    };
  }

  getQuizAttemptHistory(quizId: number): QuizAttemptSummary[] {
    const quiz = this.quizDAL.getById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const attempts = this.attemptDAL.getByQuizId(quizId);

    return attempts.map((attempt) => ({
      id: attempt.id,
      score: attempt.score,
      totalQuestions: attempt.total_questions,
      percentage: attempt.percentage,
      date: attempt.created_at,
    }));
  }

  getAttemptDetails(attemptId: number): any {
    const attempt = this.attemptDAL.getWithResponses(attemptId);
    if (!attempt) {
      throw new Error("Attempt not found");
    }

    const quiz = this.quizDAL.getById(attempt.quiz_id);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const questions = this.questionDAL.getByQuizId(attempt.quiz_id);

    const detailedResponses = attempt.responses.map((response) => {
      const question = questions.find((q) => q.id === response.question_id);
      return {
        ...response,
        question: question || null,
      };
    });

    return {
      id: attempt.id,
      quiz: {
        id: quiz.id,
        title: quiz.title,
      },
      score: attempt.score,
      totalQuestions: attempt.total_questions,
      percentage: attempt.percentage,
      date: attempt.created_at,
      responses: detailedResponses,
    };
  }

  private checkAnswer(question: QuestionWithDetails, answer: string): boolean {
    if (answer === "TIMEOUT") return false;

    if (question.type === "true-false") {
      return (answer === "true") === !!question.boolean_answer;
    }

    if (question.type === "multiple-choice" && question.options) {
      const correctOption = question.options.find((opt) => opt.is_correct);
      return answer === correctOption?.text;
    }

    if (question.type === "text-answer" && question.answers) {
      const normalizedUserAnswer = this.normalizeText(answer);

      return question.answers.some(
        (a) => this.normalizeText(a.text) === normalizedUserAnswer,
      );
    }

    return false;
  }

  private normalizeText(text: string): string {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "");
  }

  getAnalytics(): QuizAnalytics {
    return this.attemptDAL.getAnalytics();
  }

  getDailyActivity(): DailyActivity[] {
    return this.attemptDAL.getDailyActivity();
  }

  getSubjectPerformance(): SubjectPerformance[] {
    return this.attemptDAL.getSubjectPerformance();
  }

  getScheduledQuestions(limit?: number): QuestionWithDetails[] {
    return this.questionDAL.getScheduledQuestions(limit);
  }

  getDueQuestionsCount() {
    return this.questionDAL.getDueQuestionsCount();
  }

  getQuestionsByScheduleStatus(status: "due-today" | "overdue" | "upcoming") {
    return this.questionDAL.getQuestionsByScheduleStatus(status);
  }

  scheduleAllExistingQuestions(): boolean {
    return this.questionDAL.scheduleExistingQuestions();
  }

  // Add method to get mixed review questions
  getMixedReviewQuestions(limit: number = 20): QuestionWithDetails[] {
    return this.questionDAL.getDueQuestions(limit);
  }

  // Add method to get quiz-specific scheduled questions
  getQuizScheduledQuestions(quizId: number): QuestionWithDetails[] {
    return this.questionDAL.getScheduledQuestionsByQuizId(quizId);
  }

  // Fix the scheduling submission method
  submitQuizAttemptWithScheduling(
    quizId: number,
    answers: { questionId: number; answer: string; responseTime?: number }[],
  ): QuizReview {
    const quiz = this.quizDAL.getById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    let questions: QuestionWithDetails[];

    // Handle special quiz IDs for mixed reviews
    if (quizId === -1) {
      // General review
      const questionIds = answers.map((a) => a.questionId);
      questions = questionIds
        .map((id) => this.questionDAL.getById(id))
        .filter(Boolean);
    } else if (quizId === -2) {
      // Weak questions review
      const questionIds = answers.map((a) => a.questionId);
      questions = questionIds
        .map((id) => this.questionDAL.getById(id))
        .filter(Boolean);
    } else {
      questions = this.questionDAL.getByQuizId(quizId);
    }

    if (questions.length === 0) {
      throw new Error("No questions found");
    }

    let score = 0;
    const responses: {
      question_id: number;
      user_answer: string;
      is_correct: boolean;
    }[] = [];

    // Process answers and update scheduling
    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      const isCorrect = this.checkAnswer(question, answer.answer);
      if (isCorrect) score++;

      responses.push({
        question_id: answer.questionId,
        user_answer: answer.answer,
        is_correct: isCorrect,
      });

      // Update scheduling for this question
      this.questionDAL.updateScheduling(
        answer.questionId,
        isCorrect,
        answer.responseTime,
      );
    }

    // Only save attempt for real quizzes, not mixed reviews
    let attemptId: number;
    if (quizId > 0) {
      attemptId = this.attemptDAL.create({
        quiz_id: quizId,
        score,
        total_questions: questions.length,
      });

      for (const response of responses) {
        this.attemptDAL.saveResponse({
          attempt_id: attemptId,
          ...response,
        });
      }
    } else {
      attemptId = -1; // Placeholder for mixed reviews
    }

    return {
      id: attemptId,
      score: score,
      percentage: Math.round((score / questions.length) * 100),
      correct_questions: responses
        .filter((r) => r.is_correct)
        .map((r) => r.question_id),
      wrong_questions: responses
        .filter((r) => !r.is_correct)
        .map((r) => r.question_id),
    };
  }
}
