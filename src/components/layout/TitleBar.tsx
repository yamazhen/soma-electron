import { BookCheck, Home, NotebookPen, SquareAsterisk } from "lucide-react";
import TitleBarButton from "../ui/buttons/TitleBarButton";
import { useAppContext } from "../../context/AppContext";
import { useEffect, useState } from "react";

const TitleBar = () => {
  const { activePage, setActivePage, getMessage } = useAppContext();
  const [windowControlSpace, setWindowControlSpace] = useState<boolean>(true);

  useEffect(() => {
    window.ipcRenderer.onWindowStateChange(({ isFullScreen, isMacOS }) => {
      setWindowControlSpace(!isFullScreen && isMacOS);
    });
  }, []);

  return (
    <section className="titleBar">
      {windowControlSpace && <div className="windowControls"></div>}
      <TitleBarButton
        tippyContent={getMessage("menu.home")}
        isActive={activePage === "home"}
        onClick={() => setActivePage("home")}
        className={`${windowControlSpace ? "" : "ml-4"}`}
      >
        <Home size={18} strokeWidth={1.5} />
      </TitleBarButton>
      <TitleBarButton
        tippyContent={getMessage("menu.notes")}
        isActive={activePage === "notes"}
        onClick={() => setActivePage("notes")}
      >
        <NotebookPen size={18} strokeWidth={1.5} />
      </TitleBarButton>
      <TitleBarButton
        tippyContent={getMessage("menu.quiz")}
        isActive={activePage === "quiz"}
        onClick={() => setActivePage("quiz")}
      >
        <BookCheck size={18} strokeWidth={1.5} />
      </TitleBarButton>
      <TitleBarButton
        tippyContent={getMessage("menu.flashcards")}
        isActive={activePage === "flashcard"}
        onClick={() => setActivePage("flashcard")}
      >
        <SquareAsterisk size={18} strokeWidth={1.5} />
      </TitleBarButton>
    </section>
  );
};

export default TitleBar;
