import Flashcard from "./components/Flashcard";
import Home from "./components/Home";
import Notes from "./components/Notes";
import { usePage } from "./components/PageContext";
import Quiz from "./components/Quiz";
import SideMenu from "./components/SideMenu";
import TitleBar from "./components/TitleBar";

function App() {
  const { activePage } = usePage();

  return (
    <main className="main">
      <TitleBar />
      <div className="container">
        <SideMenu
          toggleExplorer={toggleExplorer}
          explorerExpanded={explorerExpanded}
          className={
            activePage === "notes" && explorerExpanded ? "bg-soma-dark" : ""
          }
        />
        {activePage === "home" && <Home />}
        {activePage === "notes" && <Notes />}
        {activePage === "quiz" && <Quiz />}
        {activePage === "flashcard" && <Flashcard />}
      </div>
    </main>
  );
}

export default App;
