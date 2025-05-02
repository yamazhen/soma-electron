import SideMenu from "./components/layout/SideMenu";
import TitleBar from "./components/layout/TitleBar";
import Notes from "./features/notes/Notes";
import Quiz from "./features/quiz/Quiz";
import Flashcard from "./features/flashcard/Flashcard";
import Home from "./features/home/Home";
import { useAppContext } from "./context/AppContext";
import { Routes, Route, HashRouter } from "react-router-dom";
import Search from "./features/notes/search/Search";

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
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
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
            </>
          }
        />
        <Route path="/search" element={<Search />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
