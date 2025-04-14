import { BookCheck, Home, NotebookPen, SquareAsterisk } from "lucide-react";
import TitleBarButton from "../ui/buttons/TitleBarButton";
import { useAppContext } from "../../context/AppContext";

const TitleBar = () => {
  const { activePage, setActivePage } = useAppContext();
  return (
    <section className="titleBar">
      <div className="windowControls"></div>
      <TitleBarButton
        tippyContent="Home"
        isActive={activePage === "home"}
        onClick={() => setActivePage("home")}
      >
        <Home size={18} strokeWidth={1.5} />
      </TitleBarButton>
      <TitleBarButton
        tippyContent="Notes"
        isActive={activePage === "notes"}
        onClick={() => setActivePage("notes")}
      >
        <NotebookPen size={18} strokeWidth={1.5} />
      </TitleBarButton>
      <TitleBarButton
        tippyContent="Quiz"
        isActive={activePage === "quiz"}
        onClick={() => setActivePage("quiz")}
      >
        <BookCheck size={18} strokeWidth={1.5} />
      </TitleBarButton>
      <TitleBarButton
        tippyContent="Flashcard"
        isActive={activePage === "flashcard"}
        onClick={() => setActivePage("flashcard")}
      >
        <SquareAsterisk size={18} strokeWidth={1.5} />
      </TitleBarButton>
    </section>
  );
};

export default TitleBar;
