import { CirclePlus, X } from "lucide-react";
import React, { useState } from "react";
import SideMenuButton from "../../components/ui/buttons/SideMenuButton";
import { useAppContext } from "../../context/AppContext";
import { RadioGroup, Radio } from "@headlessui/react";

type QuestionType =
  | "multiple-choice"
  | "fill-in-blank"
  | "true-false"
  | "short-answer";

interface BaseQuestion {
  id: number;
  text: string;
  type: QuestionType;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice";
  options: { id: number; text: string; isCorrect: boolean }[];
}

interface FillInBlankQuestion extends BaseQuestion {
  type: "fill-in-blank";
  answers: string[];
}

interface TrueFalseQuestion extends BaseQuestion {
  type: "true-false";
  correctAnswer: boolean;
}

interface ShortAnswerQuestion extends BaseQuestion {
  type: "short-answer";
  possibleAnswers: string[];
}

type Question =
  | MultipleChoiceQuestion
  | FillInBlankQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion;

type Props = {};

const QuizCreateForm: React.FC<Props> = () => {
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const { getMessage, setQuizView, fetchQuizzes } = useAppContext();

  const addQuestion = (type: QuestionType) => {
    const newQuestionId = questions.length + 1;

    let newQuestion: Question;

    switch (type) {
      case "multiple-choice":
        newQuestion = {
          id: newQuestionId,
          text: "",
          type: "multiple-choice",
          options: [
            { id: 1, text: "", isCorrect: false },
            { id: 2, text: "", isCorrect: false },
            { id: 3, text: "", isCorrect: false },
            { id: 4, text: "", isCorrect: false },
          ],
        };
        break;
      case "fill-in-blank":
        newQuestion = {
          id: newQuestionId,
          text: "",
          type: "fill-in-blank",
          answers: [""],
        };
        break;
      case "true-false":
        newQuestion = {
          id: newQuestionId,
          text: "",
          type: "true-false",
          correctAnswer: true,
        };
        break;
      case "short-answer":
        newQuestion = {
          id: newQuestionId,
          text: "",
          type: "short-answer",
          possibleAnswers: [""],
        };
        break;
    }

    setQuestions([...questions, newQuestion]);
  };

  const updateQuestionText = (id: number, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id));
    setQuestions((prev) =>
      prev.map((q, index) => ({
        ...q,
        id: index + 1,
      })),
    );
  };

  const updateOptionText = (
    questionId: number,
    optionId: number,
    text: string,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "multiple-choice") {
          return {
            ...q,
            options: q.options.map((o) =>
              o.id === optionId ? { ...o, text } : o,
            ),
          };
        }
        return q;
      }),
    );
  };

  const setCorrectOption = (questionId: number, optionId: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "multiple-choice") {
          return {
            ...q,
            options: q.options.map((o) => ({
              ...o,
              isCorrect: o.id === optionId,
            })),
          };
        }
        return q;
      }),
    );
  };

  const addOption = (questionId: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "multiple-choice") {
          return {
            ...q,
            options: [
              ...q.options,
              { id: q.options.length + 1, text: "", isCorrect: false },
            ],
          };
        }
        return q;
      }),
    );
  };

  const removeOption = (questionId: number, optionId: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "multiple-choice") {
          return {
            ...q,
            options: q.options
              .filter((o) => o.id !== optionId)
              .map((o, idx) => ({
                ...o,
                id: idx + 1,
              })),
          };
        }
        return q;
      }),
    );
  };

  const updateBlankAnswer = (
    questionId: number,
    index: number,
    text: string,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "fill-in-blank") {
          const newAnswers = [...q.answers];
          newAnswers[index] = text;
          return {
            ...q,
            answers: newAnswers,
          };
        }
        return q;
      }),
    );
  };

  const addBlankAnswer = (questionId: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "fill-in-blank") {
          return {
            ...q,
            answers: [...q.answers, ""],
          };
        }
        return q;
      }),
    );
  };

  const removeBlankAnswer = (questionId: number, index: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "fill-in-blank") {
          return {
            ...q,
            answers: q.answers.filter((_, i) => i !== index),
          };
        }
        return q;
      }),
    );
  };

  const setTrueFalseAnswer = (questionId: number, value: boolean) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "true-false") {
          return {
            ...q,
            correctAnswer: value,
          };
        }
        return q;
      }),
    );
  };

  const updatePossibleAnswer = (
    questionId: number,
    index: number,
    text: string,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "short-answer") {
          const newAnswers = [...q.possibleAnswers];
          newAnswers[index] = text;
          return {
            ...q,
            possibleAnswers: newAnswers,
          };
        }
        return q;
      }),
    );
  };

  const addPossibleAnswer = (questionId: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "short-answer") {
          return {
            ...q,
            possibleAnswers: [...q.possibleAnswers, ""],
          };
        }
        return q;
      }),
    );
  };

  const removePossibleAnswer = (questionId: number, index: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === "short-answer") {
          return {
            ...q,
            possibleAnswers: q.possibleAnswers.filter((_, i) => i !== index),
          };
        }
        return q;
      }),
    );
  };

  const getQuizData = () => {
    return {
      title: quizTitle,
      questions: questions,
    };
  };

  const submitQuiz = () => {
    const quizData = getQuizData();
    let hasError: boolean = false;

    if (!hasError) {
      if (quizData.title.trim() === "") {
        console.error("Quiz title is required");
        hasError = true;
      }
      if (quizData.questions.length <= 0) {
        console.error("At least one question is required");
        hasError = true;
      }
      quizData.questions.forEach((question) => {
        if (question.text.trim() === "") {
          console.error(`Question ${question.id} text is required`);
          hasError = true;
        }
        if (question.type === "multiple-choice") {
          const hasCorrectAnswer = question.options.some(
            (option) => option.isCorrect,
          );
          if (!hasCorrectAnswer) {
            console.error(
              `Question ${question.id} must have at least one correct answer`,
            );
            hasError = true;
          }
        }
        if (question.type === "fill-in-blank") {
          if (question.answers.some((answer) => answer.trim() === "")) {
            console.error(
              `Question ${question.id} must have at least one acceptable answer`,
            );
            hasError = true;
          }
        }
        if (question.type === "short-answer") {
          if (question.possibleAnswers.some((answer) => answer.trim() === "")) {
            console.error(
              `Question ${question.id} must have at least one possible answer`,
            );
            hasError = true;
          }
        }
      });
    }
    if (hasError) {
      return;
    }

    window.ipcRenderer.quizSave(quizData).then((response) => {
      if (response.success) {
        setQuizView("listing");
        fetchQuizzes();
      } else {
        console.error("Error saving quiz:", response.error);
      }
    });
  };

  const renderQuestionEditor = (question: Question) => {
    switch (question.type) {
      case "multiple-choice":
        return (
          <>
            <div className="flex flex-col gap-2">
              <p>Answer choices:</p>
              <RadioGroup
                by="id"
                value={question.options.find((o) => o.isCorrect)}
                onChange={(option) => setCorrectOption(question.id, option.id)}
                className="space-y-2"
              >
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center w-full gap-2"
                  >
                    <Radio
                      value={option}
                      className="group flex h-4 w-4 items-center justify-center rounded-full ring-1 ring-soma-light data-[checked]:bg-soma-lightest data-[checked]:ring-soma-lightest"
                    >
                      <span className="h-2 w-2 rounded-full bg-soma-accent1 opacity-0 group-data-[checked]:opacity-100" />
                    </Radio>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) =>
                        updateOptionText(question.id, option.id, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === " ") {
                          e.stopPropagation();
                        }
                      }}
                      placeholder={`Option ${option.id}`}
                      className="border border-soma-light rounded-md p-2 w-full"
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(question.id, option.id)}
                        className="hover:bg-soma-error p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </RadioGroup>
              <div className="flex items-center justify-center mt-2">
                <button
                  type="button"
                  onClick={() => addOption(question.id)}
                  className="bg-soma-light p-2 rounded-full hover:bg-soma-light/50 transition-colors duration-200"
                >
                  <SideMenuButton
                    tippyContent={getMessage("quiz.addOption")}
                    tippyPlacement="bottom"
                    className="!bg-transparent"
                  >
                    <CirclePlus size={18} />
                  </SideMenuButton>
                </button>
              </div>
            </div>
          </>
        );

      case "fill-in-blank":
        return (
          <div className="flex flex-col gap-2">
            <p>Acceptable answers:</p>
            {question.answers.map((answer, index) => (
              <div key={index} className="flex items-center w-full gap-2">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) =>
                    updateBlankAnswer(question.id, index, e.target.value)
                  }
                  placeholder={`Acceptable answer ${index + 1}`}
                  className="border border-soma-light rounded-md p-2 w-full"
                />
                {question.answers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlankAnswer(question.id, index)}
                    className="hover:bg-soma-error p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <p className="font-mono text-[12px] w-full">
              Tip: For fill-in-blank questions, include underscores (_____) in
              your question text to indicate blank spaces.
            </p>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => addBlankAnswer(question.id)}
                className="bg-soma-light p-2 rounded-full hover:bg-soma-light/50 transition-colors duration-200"
              >
                <SideMenuButton
                  tippyContent={getMessage("quiz.addOption")}
                  tippyPlacement="bottom"
                  className="!bg-transparent"
                >
                  <CirclePlus size={18} />
                </SideMenuButton>
              </button>
            </div>
          </div>
        );

      case "true-false":
        return (
          <div className="flex flex-col gap-2">
            <p>Correct answer:</p>
            <RadioGroup
              value={question.correctAnswer}
              onChange={(value) => setTrueFalseAnswer(question.id, value)}
              className="space-y-2"
            >
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Radio
                    value={true}
                    className="group flex h-4 w-4 items-center justify-center rounded-full ring-1 ring-soma-light data-[checked]:bg-soma-lightest data-[checked]:ring-soma-lightest"
                  >
                    <span className="h-2 w-2 rounded-full bg-soma-accent1 opacity-0 group-data-[checked]:opacity-100" />
                  </Radio>
                  <span>True</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio
                    value={false}
                    className="group flex h-4 w-4 items-center justify-center rounded-full ring-1 ring-soma-light data-[checked]:bg-soma-lightest data-[checked]:ring-soma-lightest"
                  >
                    <span className="h-2 w-2 rounded-full bg-soma-accent1 opacity-0 group-data-[checked]:opacity-100" />
                  </Radio>
                  <span>False</span>
                </div>
              </div>
            </RadioGroup>
          </div>
        );

      case "short-answer":
        return (
          <div className="flex flex-col gap-2">
            <p>Acceptable answers:</p>
            {question.possibleAnswers.map((answer, index) => (
              <div key={index} className="flex items-center w-full gap-2">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) =>
                    updatePossibleAnswer(question.id, index, e.target.value)
                  }
                  placeholder={`Possible answer ${index + 1}`}
                  className="border border-soma-light rounded-md p-2 w-full"
                />
                {question.possibleAnswers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePossibleAnswer(question.id, index)}
                    className="hover:bg-soma-error p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-center mt-2">
              <button
                type="button"
                onClick={() => addPossibleAnswer(question.id)}
                className="bg-soma-light p-2 rounded-full hover:bg-soma-light/50 transition-colors duration-200"
              >
                <SideMenuButton
                  tippyContent={getMessage("quiz.addOption")}
                  tippyPlacement="bottom"
                  className="!bg-transparent"
                >
                  <CirclePlus size={18} />
                </SideMenuButton>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <section className="h-full w-full flex flex-col justify-center items-center">
      <div className="flex flex-col gap-4 items-center p-4 overflow-auto w-full">
        <h1 className="text-3xl">Create New Quiz</h1>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col w-full gap-2">
            <label htmlFor="quizTitle" className="text-xl">
              Quiz Title
            </label>
            <input
              type="text"
              className="border border-soma-light rounded-md p-2 w-full"
              id="quizTitle"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>

          <div className="w-full flex flex-col gap-2">
            <h2 className="text-xl">Questions</h2>
            <div className="flex gap-2 justify-between w-2xl">
              <button
                className="bg-soma-light p-2 rounded-md hover:bg-soma-lightest hover:text-soma-dark transition-colors duration-200 flex-1"
                type="button"
                onClick={() => addQuestion("multiple-choice")}
              >
                + Multiple Choice
              </button>
              <button
                className="bg-soma-light p-2 rounded-md hover:bg-soma-lightest hover:text-soma-dark transition-colors duration-200 flex-1"
                type="button"
                onClick={() => addQuestion("fill-in-blank")}
              >
                + Fill in the Blank
              </button>
              <button
                className="bg-soma-light p-2 rounded-md hover:bg-soma-lightest hover:text-soma-dark transition-colors duration-200 flex-1"
                type="button"
                onClick={() => addQuestion("true-false")}
              >
                + True/False
              </button>
              <button
                className="bg-soma-light p-2 rounded-md hover:bg-soma-lightest hover:text-soma-dark transition-colors duration-200 flex-1"
                type="button"
                onClick={() => addQuestion("short-answer")}
              >
                + Short Answer
              </button>
            </div>
          </div>
          {questions.map((question) => (
            <div
              key={question.id}
              className="flex flex-col gap-4 border border-soma-light p-6 w-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <h3 className="text-md uppercase">Question {question.id} </h3>
                  <span className="bg-soma-light/50 border border-soma-lightest px-1 rounded-md">
                    {question.type
                      ? question.type.replace("-", " ")
                      : "unknown"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="bg-soma-error p-1 rounded-full hover:bg-soma-error/50 text-soma-darkest transition-colors duration-150"
                >
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                value={question.text}
                className="border border-soma-light rounded-md p-2 w-full"
                onChange={(e) =>
                  updateQuestionText(question.id, e.target.value)
                }
                placeholder="Enter your question"
              />

              {renderQuestionEditor(question)}
            </div>
          ))}
          {questions.length > 0 && (
            <button
              className="bg-soma-accent2 text-soma-darkest py-2 px-12 rounded-md hover:bg-soma-accent2/75 hover:text-soma-light"
              onClick={submitQuiz}
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default QuizCreateForm;
