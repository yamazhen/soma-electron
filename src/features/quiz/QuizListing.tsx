import {
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Play,
} from "lucide-react";
import React, { useState } from "react";
import SideMenuButton from "../../components/ui/buttons/SideMenuButton";

const QuizListing: React.FC = () => {
  const [expandedQuizzes, setExpandedQuizzes] = useState<number[]>([]);
  const toggleQuizExpansion = (id: number) => {
    setExpandedQuizzes((prev) =>
      prev.includes(id)
        ? prev.filter((quizId) => quizId !== id)
        : [...prev, id],
    );
  };
  const quizzes = [
    {
      id: 1,
      name: "Sample Quiz 1",
      questionCount: 10,
      questions: [
        { id: 101, text: "What is the capital of France?", scheduled: true },
        {
          id: 102,
          text: "What is the largest planet in our solar system?",
          scheduled: false,
        },
        { id: 103, text: "Who wrote Romeo and Juliet?", scheduled: true },
      ],
    },
    {
      id: 2,
      name: "Sample Quiz 2",
      questionCount: 20,
      questions: [
        { id: 201, text: "What is the square root of 144?", scheduled: true },
        {
          id: 202,
          text: "What is the chemical symbol for gold?",
          scheduled: false,
        },
      ],
    },
    {
      id: 3,
      name: "Sample Quiz 2",
      questionCount: 20,
      questions: [
        { id: 201, text: "What is the square root of 144?", scheduled: true },
        {
          id: 202,
          text: "What is the chemical symbol for gold?",
          scheduled: false,
        },
      ],
    },
    {
      id: 4,
      name: "Sample Quiz 2",
      questionCount: 20,
      questions: [
        { id: 201, text: "What is the square root of 144?", scheduled: true },
        { id: 202, text: "What is the square root of 144?", scheduled: true },
        { id: 203, text: "What is the square root of 144?", scheduled: true },
        { id: 204, text: "What is the square root of 144?", scheduled: true },
        {
          id: 202,
          text: "What is the chemical symbol for gold?",
          scheduled: false,
        },
      ],
    },
    {
      id: 5,
      name: "Sample Quiz 2",
      questionCount: 20,
      questions: [
        { id: 201, text: "What is the square root of 144?", scheduled: true },
        {
          id: 202,
          text: "What is the chemical symbol for gold?",
          scheduled: false,
        },
      ],
    },
  ];

  return (
    <section className="h-full w-full flex flex-col justify-center">
      <div className="flex flex-col gap-4 items-center p-4 overflow-auto">
        <h1 className="text-3xl">Quiz Listing</h1>
        <div className="bg-soma-medium rounded-sm p-4 flex items-center gap-2 max-w-2xl w-full">
          <Lightbulb size={50} />
          <p>
            You can review individual questions by clicking{" "}
            <strong>Start</strong> for a question in the table. Additionally,
            you can expand each row to view the questions and if they are
            scheduled for the next review session.
          </p>
        </div>
        <div className="bg-soma-medium rounded-sm flex items-center max-w-2xl w-full py-4">
          <table className="w-full text-left">
            <thead className="border-b-2 border-soma-light border-collapse">
              <tr>
                <th className="px-4 pb-4">Quiz Name</th>
                <th className="px-4 pb-4 text-center">Question Count</th>
                <th className="px-4 pb-4 text-center">Start Review</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <React.Fragment key={quiz.id}>
                  <tr className="border-b border-t border-soma-light">
                    <td className="py-2 px-4">
                      <div className="flex items-center">
                        <button onClick={() => toggleQuizExpansion(quiz.id)}>
                          {expandedQuizzes.includes(quiz.id) ? (
                            <ChevronDown size={18} strokeWidth={2} />
                          ) : (
                            <ChevronRight size={18} strokeWidth={2} />
                          )}
                        </button>
                        <span className="border border-soma-light rounded-xl px-4 min-w-[200px]">
                          {quiz.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">{quiz.questionCount}</td>
                    <td className="text-center">
                      <div className="flex justify-center">
                        <SideMenuButton
                          tippyContent="Start Review"
                          tippyPlacement="bottom"
                        >
                          <Play size={16} strokeWidth={1} />
                        </SideMenuButton>
                      </div>
                    </td>
                  </tr>
                  {expandedQuizzes.includes(quiz.id) && (
                    <tr className="bg-soma-darkest/60 text-sm">
                      <td colSpan={3} className="px-2 pt-2">
                        <div>
                          {quiz.questions && quiz.questions.length > 0 ? (
                            <table className="w-full text-left">
                              <thead className="border-b-2 border-soma-light">
                                <tr>
                                  <th className="pb-2 pl-4">Question</th>
                                  <th className="pb-2 text-center">
                                    Next Review
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {quiz.questions.map((question) => (
                                  <tr
                                    key={question.id}
                                    className="border-b border-soma-light"
                                  >
                                    <td className="py-2 pl-4">
                                      {question.text}
                                    </td>
                                    <td className="py-2 text-center">
                                      <div className="flex justify-center items-center">
                                        {question.scheduled ? (
                                          <CalendarCheck2 size={16} />
                                        ) : (
                                          <p>Not Scheduled</p>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-soma-text-secondary italic">
                              No questions available
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default QuizListing;
