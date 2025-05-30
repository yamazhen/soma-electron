type QuestionType = "multiple-choice" | "text-answer" | "true-false";

interface Question {
  id: number;
  quiz_id: number;
  text: string;
  type: QuestionType;
  boolean_answer: boolean | null;
  scheduled: boolean;
  next_review_date?: string | null;
  review_interval?: number | null;
  ease_factor?: number | null;
  consecutive_correct?: number | null;
  last_reviewed?: string | null;
}

interface Option {
  id: number;
  question_id: number;
  text: string;
  is_correct: boolean;
}

interface Answer {
  id: number;
  question_id: number;
  text: string;
}

interface QuestionWithDetails extends Question {
  options?: Option[];
  answers?: Answer[];
}

interface QuizAttemptDetails {
  id: number;
  quiz: { id: number; title: string };
  score: number;
  totalQuestions: number;
  date: Date;
  responses: any;
}

interface QuizAttempt {
  id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  created_at: string;
}

interface QuestionResponse {
  id: number;
  attempt_id: number;
  question_id: number;
  user_answer: string;
  is_correct: boolean;
}

interface AttemptWithResponses extends QuizAttempt {
  responses: QuestionResponse[];
}

interface Quiz {
  id: number;
  title: string;
  created_at: string;
}

interface QuizDetails extends Quiz {
  questions: QuestionWithDetails[];
  count: number;
}

interface QuizAttemptSummary {
  id: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
}

interface QuizReview {
  id: number;
  score: number;
  percentage: number;
  correct_questions: number[];
  wrong_questions: number[];
}
