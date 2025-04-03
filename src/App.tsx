import SideMenu from "./components/layout/SideMenu";
import TitleBar from "./components/layout/TitleBar";
import { FileProvider } from "./context/FileContext";
import { usePage } from "./context/PageContext";
import Notes from "./features/notes/Notes";
import Quiz from "./features/quiz/Quiz";
import Flashcard from "./features/flashcard/Flashcard";
import Home from "./features/home/Home";

function App() {
  const { activePage } = usePage();

  return (
    <main>
      <TitleBar />
      <div className="container">
        <FileProvider>
          <SideMenu />
          {activePage === "notes" && <Notes />}
          {activePage === "home" && <Home />}
          {activePage === "quiz" && <Quiz />}
          {activePage === "flashcard" && <Flashcard />}
        </FileProvider>
      </div>
    </main>
  );
}

export default App;
