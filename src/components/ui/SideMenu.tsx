import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpNarrowWideIcon,
  BrainCircuit,
  ChevronsUpDown,
  FilePenLine,
  FolderPlus,
  LayoutGrid,
  Plus,
  Settings,
} from "lucide-react";
import { usePage } from "../context/PageContext";
import SideMenuButton from "./SideMenuButton";
import RotatingArrow from "./RotatingArrow";

type Props = {
  className?: string;
};

const SideMenu: React.FC<Props> = ({ className }) => {
  const { activePage } = usePage();
  const [explorerExpanded, setExplorerExpanded] = useState(true);

  const toggleExplorer = () => {
    setExplorerExpanded((prev) => !prev);
  };

  // Render different menu buttons based on active page
  const renderPageButtons = () => {
    switch (activePage) {
      case "home":
        return (
          <div className="menuButtonHolder">
            <SideMenuButton className="mt-2" aria-label="Layout Grid">
              <LayoutGrid size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton aria-label="Activity">
              <Activity size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton aria-label="Add New">
              <Plus size={18} strokeWidth={1.5} />
            </SideMenuButton>
          </div>
        );
      case "notes":
        return (
          <div className="menuButtonHolder">
            <SideMenuButton className="mt-2" aria-label="Brain Circuit">
              <BrainCircuit size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton aria-label="Add New Note">
              <Plus size={18} strokeWidth={1.5} />
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
        className={`menu ${className} ${
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
              aria-expanded={explorerExpanded}
              aria-controls="explorer-panel"
              aria-label={
                explorerExpanded ? "Collapse explorer" : "Expand explorer"
              }
            />
          )}
          <SideMenuButton className="mb-2" aria-label="Settings">
            <Settings size={18} strokeWidth={1.5} />
          </SideMenuButton>
        </div>
      </section>

      {activePage === "notes" && (
        <section
          className={`explorerContainer ${explorerExpanded ? "expanded" : "collapsed"}`}
        >
          <div className="explorer">
            <div className="flex justify-center items-center gap-1 mb-2">
              <SideMenuButton>
                <FilePenLine size={18} strokeWidth={1.5} />
              </SideMenuButton>
              <SideMenuButton>
                <FolderPlus size={18} strokeWidth={1.5} />
              </SideMenuButton>
              <SideMenuButton>
                <ArrowUpNarrowWideIcon size={18} strokeWidth={1.5} />
              </SideMenuButton>
              <SideMenuButton>
                <ChevronsUpDown size={18} strokeWidth={1.5} />
              </SideMenuButton>
            </div>
            <ul className="flex flex-col gap-1" role="list">
              <li className="bg-soma-light rounded-sm px-8 py-[0.1rem] text-sm text-soma-text-primary">
                Welcome
              </li>
              <li className="rounded-sm px-8 py-[0.1rem] text-sm hover:bg-soma-light transition-colors duration-100 h-auto active:text-soma-text-primary">
                18-03-2025
              </li>
            </ul>
          </div>
        </section>
      )}
    </>
  );
};

export default SideMenu;
