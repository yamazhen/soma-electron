import React, { useTransition } from "react";
import {
  Book,
  BookOpenCheck,
  Brain,
  Calendar,
  Flame,
  NotebookText,
  StickyNote,
  WalletCards,
} from "lucide-react";
import { useCurrentDate } from "../../utils/DateUpdater";
import { useAppContext } from "../../context/AppContext";

type Props = {};

const Home: React.FC<Props> = () => {
  const currentDate = useCurrentDate();
  const { getMessage, currentLang } = useAppContext();

  return (
    <section className="content p-16 flex flex-col justify-center items-center">
      {/* Welcome Message */}
      <div className="mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold">{getMessage("home.welcome")}</h1>
        <div className="flex flex-row text-center items-center gap-2 text-soma-lightest">
          <p>
            {getMessage("home.today")}
            {currentDate.toLocaleDateString(currentLang, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <Calendar size={18} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-3 gap-4">
        <div className="activityButton">
          <div className="flex flex-row items-center gap-2">
            <Book size={18} />
            <h3 className="text-lg font-semibold">
              {getMessage("home.lastNote")}
            </h3>
          </div>
          <p className="text-soma-text-primary italic">"Daily Note"</p>
        </div>
        <div className="activityButton">
          <div className="flex flex-row items-center gap-2">
            <Brain size={18} />
            <h3 className="text-lg font-semibold">
              {getMessage("home.lastQuiz")}
            </h3>
          </div>
          <p className="text-soma-text-primary italic">
            "Advanced Web Programming"
          </p>
        </div>
        <div className="activityButton">
          <div className="flex flex-row items-center gap-2">
            <WalletCards size={18} />
            <h3 className="text-lg font-semibold">
              {getMessage("home.lastFlashcard")}
            </h3>
          </div>
          <p className="text-soma-text-primary italic">"Mobile Programming"</p>
        </div>
      </div>

      {/* Study Streak & Progress */}
      <div className="mt-6 p-4 bg-soma-medium rounded-lg shadow flex flex-col justify-between text-soma-text-primary">
        <div className="flex flex-row items-center gap-2">
          <Flame size={18}></Flame>
          <p className="text-lg">
            {getMessage("home.studyStreak")}{" "}
            <span className="font-bold">5 {getMessage("common.days")}</span>
          </p>
        </div>
        <div className="flex flex-row items-center gap-2">
          <BookOpenCheck size={18}></BookOpenCheck>
          <p className="text-lg">3 {getMessage("home.quizCompleted")}</p>
        </div>
        <div className="flex flex-row items-center gap-2">
          <NotebookText size={18}></NotebookText>
          <p className="text-lg">12 {getMessage("home.notesCreated")}</p>
        </div>
        <div className="flex flex-row items-center gap-2">
          <StickyNote size={18}></StickyNote>
          <p className="text-lg">20 {getMessage("home.flashcardsCreated")}</p>
        </div>
      </div>
    </section>
  );
};

export default Home;
