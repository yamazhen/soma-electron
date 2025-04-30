import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { CircleHelp } from "lucide-react";

type Props = {
  quiz: QuizData;
  onComplete?: (review: QuizReview) => void;
};

const QuizInReview: React.FC<Props> = ({ quiz, onComplete }) => {
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(10);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<
    { questionId: number; answer: string }[]
  >([]);
  const [review, setReview] = useState<QuizReview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setQuizView, fetchQuizzes } = useAppContext();

  const question = quiz?.questions?.[index];

  useEffect(() => {
    if (!quiz?.questions?.length) {
      setError("Invalid quiz data: missing questions");
    } else {
      setError(null);
    }
  }, [quiz]);

  useEffect(() => {
    if (!question || error) return;

    setTime(100000);
    setUserAnswer(null);
    setFeedback(false);

    const timer = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(timer);
          endTimer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [index, question, error]);

  useEffect(() => {
    if (answers.length === quiz.questions.length && !submitting && !review) {
      handleSubmit();
    }
  }, [answers]);

  const endTimer = () => {
    setFeedback(true);
    setTimeout(() => setIndex((i) => i + 1), 2000);
  };

  const checkCorrect = (q: QuizQuestion | null, a: string): boolean => {
    if (!q) return false;

    if (q.type === "true-false") {
      return (a === "true") === q.correctAnswer;
    }

    if (q.type === "multiple-choice") {
      const correct = q.options?.find((opt) => opt?.isCorrect);
      return a === correct?.text || a === correct?.id?.toString();
    }

    const answers = q.type === "fill-in-blank" ? q.answers : q.possibleAnswers;
    return (
      answers?.some((ans) => {
        const norm = (s: string) =>
          s
            .toLowerCase()
            .replace(/[^\w\s]|_/g, "")
            .replace(/\s+/g, " ")
            .trim();
        return norm(a) === norm(ans);
      }) || false
    );
  };

  const handleSelect = (a: string) => {
    if (time === 0 || userAnswer !== null || !question) return;

    setUserAnswer(a);
    setFeedback(true);

    setAnswers((prev) => [...prev, { questionId: question.id, answer: a }]);
    if (checkCorrect(question, a)) setScore((s) => s + 1);

    setTimeout(() => setIndex((i) => i + 1), 2000);
  };

  const handleSubmit = async () => {
    if (!quiz.id || !answers.length || submitting) return;
    setSubmitting(true);

    try {
      const result = await window.ipcRenderer.reviewSubmit({
        quizId: quiz.id,
        answers,
      });

      if (result.success && result.review) {
        setReview(result.review);
        onComplete?.(result.review);
      } else {
        setError(`Failed to submit review: ${result.error || "Unknown error"}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(`Submission error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderOptions = () => {
    if (!question) return null;

    if (question.type === "multiple-choice") {
      return (
        <div className="flex flex-col space-y-2">
          {question.options?.map((opt) =>
            opt ? (
              <button
                key={opt.id}
                className={`border p-2 ${
                  feedback
                    ? opt.isCorrect
                      ? "bg-green-100"
                      : userAnswer === opt.text
                        ? "bg-red-100"
                        : ""
                    : "hover:bg-gray-100"
                }`}
                onClick={() => handleSelect(opt.text || "")}
                disabled={feedback}
              >
                {opt.text || "No text"}
              </button>
            ) : null,
          )}
        </div>
      );
    }

    if (question.type === "true-false") {
      return (
        <div className="flex flex-col space-y-2">
          {["true", "false"].map((val) => (
            <button
              key={val}
              className={`border p-2 ${
                feedback
                  ? val === String(question.correctAnswer)
                    ? "bg-green-100"
                    : userAnswer === val
                      ? "bg-red-100"
                      : ""
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleSelect(val)}
              disabled={feedback}
            >
              {val.charAt(0).toUpperCase() + val.slice(1)}
            </button>
          ))}
        </div>
      );
    }

    if (["fill-in-blank", "short-answer"].includes(question.type)) {
      return (
        <div>
          <input
            type="text"
            placeholder="Type your answer"
            disabled={feedback}
            className="border p-2 w-full mb-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = e.currentTarget.value.trim();
                handleSelect(value);
              }
            }}
          />
          <button
            className="border p-2 w-full"
            onClick={(e) => {
              const input = e.currentTarget
                .previousElementSibling as HTMLInputElement;
              handleSelect(input?.value?.trim() || "");
            }}
            disabled={feedback}
          >
            Submit
          </button>
          {feedback && (
            <div className="mt-2 p-2 bg-gray-100">
              <p>
                Correct answers:{" "}
                {(question.answers || question.possibleAnswers)?.join(", ") ||
                  "None"}
              </p>
            </div>
          )}
        </div>
      );
    }

    return <p>Unsupported question type</p>;
  };

  if (error) {
    return (
      <div className="p-4 border">
        <h2 className="text-red-500 mb-2">Error</h2>
        <p>{error}</p>
        <button
          className="border p-2 mt-4"
          onClick={() => window.history.back()}
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  if (index >= quiz.questions.length) {
    return (
      <div className="p-20 flex flex-col w-full h-full justify-center gap-4">
        <h2 className="mb-2">Quiz Complete</h2>
        <p className="mb-4">
          Score: {score}/{quiz.questions.length}
        </p>

        {submitting ? (
          <p>Submitting...</p>
        ) : review ? (
          <div className="border p-2 text-center">
            <p>Review saved!</p>
            <div className="flex justify-around">
              <p>{review.correct_questions.length} Correct</p>
              <p>{review.wrong_questions.length} Wrong</p>
            </div>
          </div>
        ) : (
          <button onClick={handleSubmit} className="border p-2 w-full mb-2">
            Save Results
          </button>
        )}

        <button
          onClick={() => {
            fetchQuizzes();
            setQuizView("listing");
          }}
          className="border p-2 w-full hover:bg-soma-light"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full justify-center p-20">
      <div className="border-b p-2">
        <p>
          Question {index + 1}/{quiz.questions.length}
        </p>
        <p>Time left: {time}s</p>
      </div>

      <div className="p-4">
        <div className="p-4 mb-4 flex gap-2 items-center justify-center">
          <p className="text-3xl">{question?.text || "No question text"}</p>
          <CircleHelp size={30} strokeWidth={2} />
        </div>
        {renderOptions()}
        {feedback && (
          <div className="mt-4 p-2 border">
            {userAnswer === null
              ? "Time's up!"
              : checkCorrect(question, userAnswer)
                ? "Correct"
                : "Incorrect"}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizInReview;
