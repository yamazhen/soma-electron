import {
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Play,
} from "lucide-react";
import React, { useState } from "react";
import SideMenuButton from "../../components/ui/buttons/SideMenuButton";
import { useAppContext } from "../../context/AppContext";

interface Props {
  setQuizInReview: (quizData: QuizData | undefined) => void;
}

const QuizListing: React.FC<Props> = ({ setQuizInReview }) => {
  const { getMessage, quizzes, setQuizView } = useAppContext();
  const [expandedQuizzes, setExpandedQuizzes] = useState<number[]>([]);

  const reviewQuiz = async (quizId: number) => {
    try {
      const response = await window.ipcRenderer.quizFindById(quizId);

      if (response.success) {
        setQuizInReview(response.quizData);
        setQuizView("inReview");
      } else {
        console.error("Error fetching quiz:", response.error);
      }
    } catch (e) {
      console.error("Exception while fetching quiz:", e);
    }
  };

  const toggleQuizExpansion = (id: number) => {
    setExpandedQuizzes((prev) =>
      prev.includes(id)
        ? prev.filter((quizId) => quizId !== id)
        : [...prev, id],
    );
  };

  let quizListingInfoMessage = getMessage("quiz.listingInfo");
  quizListingInfoMessage = quizListingInfoMessage
    .replace("<strongStart>", "<strong>")
    .replace("</strongEnd>", "</strong>");

  return (
    <section className="h-full w-full flex flex-col justify-center">
      <div className="flex flex-col gap-4 items-center p-4 overflow-auto">
        <span className="w-full max-w-2xl">
          <h1 className="text-3xl">{getMessage("quiz.listing")}</h1>
        </span>
        <div className="bg-soma-medium rounded-sm p-4 flex items-center gap-2 max-w-2xl w-full">
          <Lightbulb size={50} />
          <p dangerouslySetInnerHTML={{ __html: quizListingInfoMessage }}></p>
        </div>
        <div className="bg-soma-medium rounded-sm flex items-center max-w-2xl w-full py-4">
          <table className="w-full text-left">
            <thead className="border-b-2 border-soma-light border-collapse">
              <tr>
                <th className="px-4 pb-4">{getMessage("quiz.name")}</th>
                <th className="px-4 pb-4 text-center">
                  {getMessage("quiz.count")}
                </th>
                <th className="px-4 pb-4 text-center">
                  {getMessage("quiz.startReview")}
                </th>
              </tr>
            </thead>
            <tbody>
              {quizzes && quizzes.length > 0 ? (
                quizzes.map((quiz) => (
                  <React.Fragment key={quiz.id}>
                    <tr className="border-b border-t border-soma-light">
                      <td className="py-2 px-4">
                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              quiz.id && toggleQuizExpansion(quiz.id)
                            }
                          >
                            {quiz.id && expandedQuizzes.includes(quiz.id) ? (
                              <ChevronDown size={18} strokeWidth={2} />
                            ) : (
                              <ChevronRight size={18} strokeWidth={2} />
                            )}
                          </button>
                          <span className="border border-soma-light rounded-xl px-4 min-w-[200px]">
                            {quiz.title}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">{quiz.questions.length}</td>
                      <td className="text-center">
                        <div className="flex justify-center">
                          <SideMenuButton
                            tippyContent={getMessage("quiz.startReview")}
                            tippyPlacement="bottom"
                            onClick={() => quiz.id && reviewQuiz(quiz.id)}
                          >
                            <Play size={16} strokeWidth={1} />
                          </SideMenuButton>
                        </div>
                      </td>
                    </tr>
                    {quiz.id && expandedQuizzes.includes(quiz.id) && (
                      <tr className="bg-soma-darkest/60 text-sm">
                        <td colSpan={3} className="px-2 pt-2">
                          <div>
                            {quiz.questions && quiz.questions.length > 0 ? (
                              <table className="w-full text-left">
                                <thead className="border-b-2 border-soma-light">
                                  <tr>
                                    <th className="pb-2 pl-4">
                                      {getMessage("quiz.question")}
                                    </th>
                                    <th className="pb-2 text-center">
                                      {getMessage("quiz.nextReview")}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {quiz.questions.map((question, index) => (
                                    <tr
                                      key={question.id}
                                      className={`${
                                        index !== quiz.questions.length - 1
                                          ? "border-b border-soma-light"
                                          : ""
                                      }`}
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
                ))
              ) : (
                <tr className="border-b-2 border-soma-light bg-soma-light/40">
                  <td colSpan={3} className="text-center py-4">
                    No Quizzes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default QuizListing;
