import { BookCheck, Home, NotebookPen, SquareAsterisk } from "lucide-react";
import TitleBarButton from "./TitleBarButton";
import { usePage } from "./PageContext";

const TitleBar = () => {
  const { activePage, setActivePage } = usePage();
  return (
    <section className="titleBar">
      <div className="windowControls"></div>
      <TitleBarButton
        isActive={activePage === "home"}
        onClick={() => setActivePage("home")}
      >
        <Home size={18} strokeWidth={1.5} />
      </TitleBarButton>
      <TitleBarButton
        isActive={activePage === "notes"}
        onClick={() => setActivePage("notes")}
      >
        <NotebookPen size={18} strokeWidth={1.5} />
      </TitleBarButton>
      <TitleBarButton
        isActive={activePage === "quiz"}
        onClick={() => setActivePage("quiz")}
      >
        <BookCheck size={18} strokeWidth={1.5} />
      </TitleBarButton>
      <TitleBarButton
        isActive={activePage === "flashcard"}
        onClick={() => setActivePage("flashcard")}
      >
        <SquareAsterisk size={18} strokeWidth={1.5} />
      </TitleBarButton>
    </section>
  );
};

export default TitleBar;
