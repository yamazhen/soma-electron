import React, { useEffect, useState } from "react";

type Props = {
  quiz: QuizData;
  onComplete?: (review: any) => void;
};

const QuizInReview: React.FC<Props> = ({ quiz, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<
    { questionId: number; answer: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<QuizReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate quiz data
  useEffect(() => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      setError("Invalid quiz data: missing questions");
      return;
    }
    // Reset error if valid
    setError(null);
  }, [quiz]);

  // Safe access to current question
  const currentQuestion = quiz?.questions?.[currentQuestionIndex] || null;

  useEffect(() => {
    // Don't proceed if there's an error or no current question
    if (error || !currentQuestion) return;

    setTimeLeft(10);
    setUserAnswer(null);
    setShowFeedback(false);

    if (currentQuestionIndex >= (quiz?.questions?.length || 0)) {
      setQuizComplete(true);
      submitQuizReview();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleTimerEnd();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, quiz?.questions?.length, error]);

  const submitQuizReview = async () => {
    if (!quiz?.id || answers.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const submission: QuizSubmission = {
        quizId: quiz.id,
        answers: answers,
      };

      const result = await window.ipcRenderer.quizSubmitReview(submission);

      if (result.success) {
        if (result.review) {
          setReviewResult(result.review);
          if (onComplete) {
            onComplete(result.review);
          }
        }
      } else {
        console.error("Failed to submit quiz review:", result.error);
        setError(
          `Failed to submit quiz review: ${result.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error submitting quiz review:", error);
      setError(
        `Error submitting quiz review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimerEnd = () => {
    setShowFeedback(true);
    setTimeout(moveToNextQuestion, 2000);
  };

  const checkIfAnswerIsCorrect = (
    question: QuizQuestion | null,
    answer: string,
  ): boolean => {
    if (!question) return false;

    if (question.type === "true-false") {
      return (answer === "true") === question.correctAnswer;
    }

    if (question.type === "multiple-choice") {
      const correctOption = question.options?.find((opt) => opt?.isCorrect);
      return (
        answer === correctOption?.text ||
        answer === correctOption?.id?.toString()
      );
    }

    if (question.type === "fill-in-blank" || question.type === "short-answer") {
      const possibleAnswers =
        question.type === "fill-in-blank"
          ? question.answers
          : question.possibleAnswers;

      console.log("User answer:", answer);
      console.log("Possible answers:", possibleAnswers);

      // More lenient matching
      return (
        (Array.isArray(possibleAnswers) &&
          possibleAnswers.some((possible) => {
            if (!possible) return false;

            const normalizedPossible = possible.toLowerCase().trim();
            const normalizedAnswer = answer.toLowerCase().trim();

            console.log(
              `Comparing: "${normalizedAnswer}" with "${normalizedPossible}"`,
            );

            // Try exact match first
            if (normalizedAnswer === normalizedPossible) return true;

            // Try removing punctuation and extra spaces
            const cleanPossible = normalizedPossible
              .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
              .replace(/\s+/g, " ");
            const cleanAnswer = normalizedAnswer
              .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
              .replace(/\s+/g, " ");

            return cleanAnswer === cleanPossible;
          })) ||
        false
      );
    }

    return false;
  };

  const handleAnswerSelect = (answer: string) => {
    if (timeLeft === 0 || userAnswer !== null || !currentQuestion) return;

    setUserAnswer(answer);
    setShowFeedback(true);

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        answer: answer,
      },
    ]);

    if (checkIfAnswerIsCorrect(currentQuestion, answer)) {
      setScore((prevScore) => prevScore + 1);
    }

    setTimeout(moveToNextQuestion, 2000);
  };

  const moveToNextQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
  };

  const renderQuestion = () => {
    const question = currentQuestion;

    if (!question) {
      return <p>Question not available</p>;
    }

    switch (question.type) {
      case "multiple-choice":
        return (
          <div>
            {Array.isArray(question.options) && question.options.length > 0 ? (
              <div className="flex flex-col space-y-2">
                {question.options.map((option) => {
                  return option ? (
                    <button
                      key={option.id || `option-${Math.random()}`}
                      className={`border p-2 ${
                        showFeedback
                          ? option.isCorrect
                            ? "bg-green-100"
                            : userAnswer === option.text
                              ? "bg-red-100"
                              : ""
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => handleAnswerSelect(option.text || "")}
                      disabled={showFeedback}
                    >
                      {option.text || "No text provided"}
                    </button>
                  ) : null;
                })}
              </div>
            ) : (
              <p>No options available for this question</p>
            )}
          </div>
        );

      case "true-false":
        return (
          <div className="flex flex-col space-y-2">
            {["true", "false"].map((option) => (
              <button
                key={option}
                className={`border p-2 ${
                  showFeedback
                    ? option === String(question.correctAnswer)
                      ? "bg-green-100"
                      : userAnswer === option
                        ? "bg-red-100"
                        : ""
                    : "hover:bg-gray-100"
                }`}
                onClick={() => handleAnswerSelect(option)}
                disabled={showFeedback}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        );

      case "fill-in-blank":
      case "short-answer":
        return (
          <div>
            <input
              type="text"
              placeholder="Type your answer"
              disabled={showFeedback}
              id="answer-input"
              className="border p-2 w-full mb-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !showFeedback) {
                  const value = e.currentTarget.value.trim();
                  handleAnswerSelect(value);
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.currentTarget
                  .previousElementSibling as HTMLInputElement;
                const value = input?.value?.trim() || "";
                handleAnswerSelect(value);
              }}
              disabled={showFeedback}
              className="border p-2 w-full"
            >
              Submit
            </button>
            {showFeedback && (
              <div className="mt-2 p-2 bg-gray-100">
                <p>
                  Correct answers:{" "}
                  {(question.type === "fill-in-blank"
                    ? question.answers
                    : question.possibleAnswers
                  )?.join(", ") || "None provided"}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return <p>Question type not supported</p>;
    }
  };

  // Display error message if necessary
  if (error) {
    return (
      <div className="p-4">
        <div className="border p-4">
          <h2 className="text-red-500 mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.history.back()}
            className="border p-2 mt-4"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="p-4">
        <div className="border p-4 text-center">
          <h2 className="mb-2">Quiz Complete</h2>
          <p className="mb-4">
            Score: {score}/{quiz?.questions?.length || 0}
          </p>

          {isSubmitting ? (
            <div>
              <p>Submitting results...</p>
            </div>
          ) : reviewResult ? (
            <div className="border p-2 mt-4">
              <p className="mb-2">Review saved successfully</p>
              <div className="flex justify-around">
                <div>
                  <p>{reviewResult.correct_questions?.length || 0} Correct</p>
                </div>
                <div>
                  <p>{reviewResult.wrong_questions?.length || 0} Wrong</p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={submitQuizReview}
              className="border p-2 w-full mb-2"
            >
              Save Results
            </button>
          )}

          <button
            onClick={() => window.history.back()}
            className="border p-2 w-full"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // Render loading state if no question is available
  if (!currentQuestion) {
    return (
      <div className="p-4 text-center">
        <p>Loading quiz...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Question counter */}
      <div className="border-b p-2">
        <p>
          Question {currentQuestionIndex + 1}/{quiz?.questions?.length || 0}
        </p>
        <p>Time remaining: {timeLeft}s</p>
      </div>

      {/* Question display */}
      <div className="p-4">
        <div className="border p-4 mb-4">
          <p>{currentQuestion.text || "No question text available"}</p>
        </div>

        {renderQuestion()}

        {/* Feedback display */}
        {showFeedback && (
          <div className="mt-4 p-2 border">
            {userAnswer === null
              ? "Time's up!"
              : checkIfAnswerIsCorrect(currentQuestion, userAnswer)
                ? "Correct"
                : "Incorrect"}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizInReview;
