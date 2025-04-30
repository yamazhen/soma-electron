import SideMenu from "./components/layout/SideMenu";
import TitleBar from "./components/layout/TitleBar";
import Notes from "./features/notes/Notes";
import Quiz from "./features/quiz/Quiz";
import Flashcard from "./features/flashcard/Flashcard";
import Home from "./features/home/Home";
import { useAppContext } from "./context/AppContext";

function App() {
  const { activePage } = useAppContext();

  window.addEventListener(
    "click",
    (e) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;

      e.preventDefault();

      let href = anchor.getAttribute("href")!;
      if (!href.match(/^[a-z]+:/i)) {
        href = "https://" + href;
      }
      window.ipcRenderer.openExternalLink(href);
    },
    { capture: true },
  );

  return (
    <main>
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
}

export default App;
