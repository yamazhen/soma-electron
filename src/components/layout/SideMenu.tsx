import React, { useState } from "react";
import SideMenuButton from "../ui/buttons/SideMenuButton";
import RotatingArrow from "../ui/common/RotatingArrow";
import Explorer from "../ui/navigation/Explorer";
import {
  Activity,
  BrainCircuit,
  Calendar,
  FileQuestion,
  FileSearch,
  GraduationCap,
  LayoutGrid,
  Plus,
  PlusCircle,
  Settings,
  SquareAsterisk,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";

const SideMenu: React.FC = () => {
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const {
    activePage,
    setInMindMap,
    createOrOpenTodaysNote,
    setCardView,
    getMessage,
    setQuizView,
    setSelectedFile,
  } = useAppContext();

  const clickMindMap = () => {
    setInMindMap(true);
    setSelectedFile("");
  };

  const toggleExplorer = () => {
    setExplorerExpanded((prev) => !prev);
  };

  const openSettings = () => {
    window.ipcRenderer.openSettings();
  };

  // Render different menu buttons based on active page
  const renderPageButtons = () => {
    switch (activePage) {
      case "home":
        return (
          <div className="menuButtonHolder">
            <SideMenuButton
              className="mt-2"
              tippyContent={getMessage("home.dashboard")}
            >
              <LayoutGrid size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton tippyContent={getMessage("home.analytics")}>
              <Activity size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton tippyContent={getMessage("home.quickCreate")}>
              <Plus size={18} strokeWidth={1.5} />
            </SideMenuButton>
          </div>
        );
      case "quiz":
        return (
          <div className="menuButtonHolder">
            <SideMenuButton
              className="mt-2"
              tippyContent={getMessage("quiz.listing")}
              onClick={() => setQuizView("listing")}
            >
              <FileQuestion size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton
              tippyContent={getMessage("quiz.review")}
              onClick={() => setQuizView("review")}
            >
              <GraduationCap size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton
              tippyContent={getMessage("quiz.create")}
              onClick={() => setQuizView("create")}
            >
              <PlusCircle size={18} strokeWidth={1.5} />
            </SideMenuButton>
          </div>
        );
      case "flashcard":
        return (
          <div className="menuButtonHolder">
            <SideMenuButton
              className="mt-2"
              tippyContent={getMessage("flashcard.listing")}
              onClick={() => setCardView("listing")}
            >
              <SquareAsterisk size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton
              tippyContent={getMessage("flashcard.review")}
              onClick={() => setCardView("review")}
            >
              <GraduationCap size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton
              tippyContent={getMessage("flashcard.create")}
              onClick={() => setCardView("create")}
            >
              <PlusCircle size={18} strokeWidth={1.5} />
            </SideMenuButton>
          </div>
        );
      case "notes":
        return (
          <div className="menuButtonHolder">
            <SideMenuButton
              tippyContent={getMessage("notes.search")}
              className="mt-2"
              onClick={() => window.ipcRenderer.openSearchPopup()}
            >
              <FileSearch size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton
              tippyContent={getMessage("notes.mindMap")}
              onClick={clickMindMap}
            >
              <BrainCircuit size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton tippyContent={getMessage("notes.today")}>
              <Calendar
                size={18}
                strokeWidth={1.5}
                onClick={() => {
                  createOrOpenTodaysNote(), setInMindMap(false);
                }}
              />
            </SideMenuButton>
          </div>
        );
      default:
        return <div className="menuButtonHolder"></div>;
    }
  };

  return (
    <>
      <section
        className={`menu ${
          explorerExpanded && activePage === "notes"
            ? "bg-soma-dark"
            : "bg-transparent transition-colors duration-700"
        } ${activePage !== "notes" && "!duration-0"}`}
      >
        {renderPageButtons()}

        <div className="menuButtonHolder">
          {activePage === "notes" && (
            <RotatingArrow
              onClick={toggleExplorer}
              rotated={explorerExpanded}
            />
          )}
          <SideMenuButton
            className="mb-2"
            tippyContent={getMessage("menu.settings")}
            onClick={openSettings}
          >
            <Settings size={18} strokeWidth={1.5} />
          </SideMenuButton>
        </div>
      </section>

      {activePage === "notes" && (
        <Explorer explorerExpanded={explorerExpanded} />
      )}
    </>
  );
};

export default SideMenu;
