import SideMenu from "./components/layout/SideMenu";
import TitleBar from "./components/layout/TitleBar";
import Notes from "./features/notes/Notes";
import Quiz from "./features/quiz/Quiz";
import Flashcard from "./features/flashcard/Flashcard";
import Home from "./features/home/Home";
import { useAppContext } from "./context/AppContext";

function App() {
  const { activePage } = useAppContext();

  return (
    <main>
      <TitleBar />
      <div className="container">
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
