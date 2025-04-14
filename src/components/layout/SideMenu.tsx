import React, { useState } from "react";
import SideMenuButton from "../ui/buttons/SideMenuButton";
import RotatingArrow from "../ui/common/RotatingArrow";
import Explorer from "../ui/navigation/Explorer";
import {
  Activity,
  BrainCircuit,
  Calendar,
  FileSearch,
  LayoutGrid,
  Plus,
  Settings,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";

const SideMenu: React.FC = () => {
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const { activePage, toggleMindMap, setInMindMap, createOrOpenTodaysNote } =
    useAppContext();

  const toggleExplorer = () => {
    setExplorerExpanded((prev) => !prev);
  };

  // Render different menu buttons based on active page
  const renderPageButtons = () => {
    switch (activePage) {
      case "home":
        return (
          <div className="menuButtonHolder">
            <SideMenuButton className="mt-2" tippyContent="Dashboard">
              <LayoutGrid size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton tippyContent="Analytics">
              <Activity size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton tippyContent="Quick Create">
              <Plus size={18} strokeWidth={1.5} />
            </SideMenuButton>
          </div>
        );
      case "notes":
        return (
          <div className="menuButtonHolder">
            <SideMenuButton tippyContent="Search Note" className="mt-2">
              <FileSearch size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton tippyContent="Mind Map" onClick={toggleMindMap}>
              <BrainCircuit size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton tippyContent="Today's Note">
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
        } ${activePage !== "notes" && "!duration-75"}`}
      >
        {renderPageButtons()}

        <div className="menuButtonHolder">
          {activePage === "notes" && (
            <RotatingArrow
              onClick={toggleExplorer}
              rotated={explorerExpanded}
            />
          )}
          <SideMenuButton className="mb-2" tippyContent="Settings">
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
