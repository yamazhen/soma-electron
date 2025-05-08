import React from "react";
import TitleBar from "./TitleBar";
import SideMenu from "./SideMenu";
import { useAppContext } from "../../context/AppContext";
import Notes from "../../features/notes/Notes";
import Home from "../../features/home/Home";
import Quiz from "../../features/quiz/Quiz";
import Flashcard from "../../features/flashcard/Flashcard";

const MainWindow: React.FC = () => {
  const { activePage } = useAppContext();

  return (
    <main id="mainApp">
      <TitleBar />
      <div className="wrapper">
        <SideMenu />
        {activePage === "notes" && <Notes />}
        {activePage === "home" && <Home />}
        {activePage === "quiz" && <Quiz />}
        {activePage === "flashcard" && <Flashcard />}
      </div>
    </main>
  );
};

export default MainWindow;
