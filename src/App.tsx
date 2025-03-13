import Flashcard from "./components/Flashcard";
import Home from "./components/Home";
import Notes from "./components/Notes";
import { usePage } from "./components/PageContext";
import Quiz from "./components/Quiz";
import SideMenu from "./components/SideMenu";
import { SideMenuProvider } from "./components/SideMenuContext";
import TitleBar from "./components/TitleBar";

function App() {
  const { activePage } = usePage();

  return (
    <main className="main">
      <TitleBar />
      <div className="container">
        <SideMenuProvider>
          <SideMenu />
        </SideMenuProvider>
        {activePage === "home" && <Home />}
        {activePage === "notes" && <Notes />}
        {activePage === "quiz" && <Quiz />}
        {activePage === "flashcard" && <Flashcard />}
      </div>
    </main>
  );
}

export default App;
