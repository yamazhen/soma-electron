import React from "react";
import RotatingArrow from "../ui/common/RotatingArrow";
import Explorer from "../ui/navigation/Explorer";
import {
  BrainCircuit,
  Calendar,
  FileQuestion,
  FileSearch,
  GraduationCap,
  LayoutGrid,
  PlusCircle,
  Settings,
  SquareAsterisk,
  Home,
  Brain,
  BookOpen,
  WalletCards,
  NotebookIcon,
  WandSparkles,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import SidebarButton from "../ui/buttons/SidebarButton";

const SideMenu: React.FC = () => {
  const {
    activePage,
    setNoteView,
    createOrOpenTodaysNote,
    setCardView,
    setExplorerExpanded,
    explorerExpanded,
    setQuizView,
    setActivePage,
    noteView,
    quizView,
    cardView,
    loggedIn,
  } = useAppContext();

  const toggleExplorer = () => {
    setExplorerExpanded((prev) => !prev);
  };

  const openSettings = () => {
    window.ipcRenderer.openSettings();
  };

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "notes", icon: BookOpen, label: "Notes" },
    { id: "quiz", icon: Brain, label: "Quizzes" },
    { id: "flashcard", icon: WalletCards, label: "Flashcards" },
  ];

  const renderPageActions = () => {
    switch (activePage) {
      case "home":
        return (
          <>
            <SidebarButton
              icon={LayoutGrid}
              variant="secondary"
              isActive
              tippyContent="Dashboard"
            />
          </>
        );
      case "quiz":
        return (
          <>
            <SidebarButton
              tippyContent="Quiz Sets"
              icon={FileQuestion}
              onClick={() => setQuizView("listing")}
              variant="secondary"
              isActive={quizView === "listing"}
            />
            <SidebarButton
              tippyContent="Quiz Reviews"
              icon={GraduationCap}
              onClick={() => setQuizView("review")}
              variant="secondary"
              isActive={quizView === "review" || quizView === "inReview"}
            />
            <SidebarButton
              tippyContent="Create Quiz Set"
              icon={PlusCircle}
              onClick={() => setQuizView("create")}
              variant="secondary"
              isActive={quizView === "create"}
            />
          </>
        );
      case "flashcard":
        return (
          <>
            <SidebarButton
              tippyContent="Flashcard Decks"
              icon={SquareAsterisk}
              onClick={() => setCardView("listing")}
              variant="secondary"
              isActive={cardView === "listing"}
            />
            <SidebarButton
              tippyContent="Flashcard Reviews"
              icon={GraduationCap}
              onClick={() => setCardView("review")}
              variant="secondary"
              isActive={cardView === "review"}
            />
            <SidebarButton
              tippyContent="Create Flashcard Deck"
              icon={PlusCircle}
              onClick={() => setCardView("create")}
              variant="secondary"
              isActive={cardView === "create"}
            />
          </>
        );
      case "notes":
        return (
          <>
            <SidebarButton
              tippyContent="Notes"
              icon={NotebookIcon}
              onClick={() => setNoteView("note")}
              variant="secondary"
              isActive={noteView === "note"}
            />
            <SidebarButton
              tippyContent="Mind Map"
              icon={BrainCircuit}
              onClick={() => setNoteView("mindmap")}
              variant="secondary"
              isActive={noteView === "mindmap"}
            />
            <SidebarButton
              tippyContent="Create Today's Note"
              icon={Calendar}
              onClick={() => {
                createOrOpenTodaysNote();
                setNoteView("note");
              }}
              variant="secondary"
            />
            <SidebarButton
              tippyContent="Search Notes"
              icon={FileSearch}
              onClick={() => window.ipcRenderer.openSearchPopup()}
              variant="secondary"
            />
            {loggedIn && (
              <SidebarButton
                tippyContent="Generate Note"
                onClick={() => window.ipcRenderer.openGenerateNotePopup()}
                icon={WandSparkles}
                variant="secondary"
              />
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <aside
        className={`
        relative flex flex-col h-full w-16
        ${
          explorerExpanded && activePage === "notes"
            ? "bg-soma-dark shadow-xl"
            : "bg-soma-dark/80 backdrop-blur-sm"
        }
        transition-all duration-300
        border-r border-soma-light/10
        flex-shrink-0
      `}
      >
        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col">
          {/* Primary Navigation */}
          <div className="p-2 space-y-1 mt-2">
            {navItems.map((item) => (
              <SidebarButton
                key={item.id}
                icon={item.icon}
                isActive={activePage === item.id}
                onClick={() => setActivePage?.(item.id)}
                tippyContent={item.label}
              />
            ))}
          </div>

          {/* Separator */}
          <div className="mx-3 my-2">
            <div className="h-px bg-soma-light/20" />
          </div>

          {/* Page Actions */}
          <div className="p-2 space-y-1 flex-1">{renderPageActions()}</div>
        </nav>

        {/* Bottom Section */}
        <div className="p-2 space-y-1 border-t border-soma-light/10 flex flex-col gap-1 mb-1">
          {activePage === "notes" && (
            <div className="flex justify-center">
              <RotatingArrow
                onClick={toggleExplorer}
                rotated={explorerExpanded}
              />
            </div>
          )}
          <div className="flex justify-center">
            <SidebarButton
              icon={Settings}
              onClick={openSettings}
              size="sm"
              variant="secondary"
              tippyContent="Settings"
            />
          </div>
        </div>
      </aside>

      {/* Explorer panel */}
      {activePage === "notes" && (
        <Explorer explorerExpanded={explorerExpanded} />
      )}
    </>
  );
};

export default SideMenu;
