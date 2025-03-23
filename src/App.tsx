import Flashcard from "./components/Flashcard";
import Home from "./components/Home";
import Notes from "./components/notePage/Notes";
import { usePage } from "./components/context/PageContext";
import Quiz from "./components/Quiz";
import SideMenu from "./components/ui/SideMenu";
import TitleBar from "./components/ui/TitleBar";
import { FileProvider } from "./components/context/FileContext";

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
