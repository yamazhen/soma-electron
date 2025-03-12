import React from "react";
import { useCurrentDate } from "../utils/DateUpdater";
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

type Props = {};

const Home: React.FC<Props> = () => {
  const currentDate = useCurrentDate();

  return (
    <section className="content home">
      {/* Welcome Message */}
      <div className="mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-1">Welcome to Soma</h1>
        <div className="flex flex-row text-center items-center gap-2">
          <p className="text-soma-accent2">
            Today is{" "}
            {currentDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <Calendar className="text-soma-accent2" size={18} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-3 gap-4">
        <div className="activityButton">
          <div className="flex flex-row items-center gap-2">
            <Book size={18} />
            <h3 className="text-lg font-semibold">Last Opened Note</h3>
          </div>
          <p className="text-soma-text-primary italic">"Daily Note"</p>
        </div>
        <div className="activityButton">
          <div className="flex flex-row items-center gap-2">
            <Brain size={18} />
            <h3 className="text-lg font-semibold">Recent Quiz</h3>
          </div>
          <p className="text-soma-text-primary italic">
            "Advanced Web Programming"
          </p>
        </div>
        <div className="activityButton">
          <div className="flex flex-row items-center gap-2">
            <WalletCards size={18} />
            <h3 className="text-lg font-semibold">Last Flashcard Set</h3>
          </div>
          <p className="text-soma-text-primary italic">"Mobile Programming"</p>
        </div>
      </div>

      {/* Study Streak & Progress */}
      <div className="mt-6 p-4 bg-soma-medium rounded-lg shadow flex flex-col justify-between text-soma-text-primary">
        <div className="flex flex-row items-center gap-2">
          <Flame size={18}></Flame>
          <p className="text-lg">
            Study Streak: <span className="font-bold">5 Days</span>
          </p>
        </div>
        <div className="flex flex-row items-center gap-2">
          <BookOpenCheck size={18}></BookOpenCheck>
          <p className="text-lg">3 Quizzes Completed</p>
        </div>
        <div className="flex flex-row items-center gap-2">
          <NotebookText size={18}></NotebookText>
          <p className="text-lg">12 Notes Created</p>
        </div>
        <div className="flex flex-row items-center gap-2">
          <StickyNote size={18}></StickyNote>
          <p className="text-lg">20 Flashcards Reviewed</p>
        </div>
      </div>
    </section>
  );
};

export default Home;
