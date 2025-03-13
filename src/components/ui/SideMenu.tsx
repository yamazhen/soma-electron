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
import { useSideMenu } from "../context/SideMenuContext";
import SideMenuButton from "./SideMenuButton";
import RotatingArrow from "./RotatingArrow";

type Props = {
  className?: string;
};

const SideMenu: React.FC<Props> = ({ className }) => {
  const { activePage } = usePage();
  const { explorerExpanded, toggleExplorer } = useSideMenu();
  const prevActivePage = useRef(activePage);

  // states for animations and visibility
  const [isExplorerVisible, setIsExplorerVisible] = useState(explorerExpanded);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // handle page transitions
  useEffect(() => {
    if (activePage === "notes" && prevActivePage.current !== "notes") {
      setShouldAnimate(false);
    }
    prevActivePage.current = activePage;
  }, [activePage]);

  // handle visibility and animations with proper cleanup
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (explorerExpanded) {
      setIsExplorerVisible(true);
    } else {
      timer = setTimeout(() => {
        setIsExplorerVisible(false);
      }, 200);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [explorerExpanded]);

  // function to toggle the explorer panel with animation
  const handleToggleExplorer = () => {
    setShouldAnimate(true);
    toggleExplorer();
  };

  // determine animation class based on state
  const getAnimationClass = () => {
    if (!shouldAnimate) return "";
    return explorerExpanded ? "scaleIn" : "scaleOut";
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
          isExplorerVisible && activePage === "notes"
            ? "bg-soma-dark"
            : "bg-transparent"
        }`}
      >
        {renderPageButtons()}

        <div className="menuButtonHolder">
          {activePage === "notes" && (
            <RotatingArrow
              onClick={handleToggleExplorer}
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

      {activePage === "notes" && isExplorerVisible && (
        <section
          className={`explorer ${getAnimationClass()}`}
          style={{
            transform:
              !shouldAnimate && explorerExpanded ? "scaleX(1)" : undefined,
          }}
        >
          <div className="flex justify-center items-center gap-1 mb-2">
            <SideMenuButton aria-label="New File">
              <FilePenLine size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton aria-label="New Folder">
              <FolderPlus size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton aria-label="Sort">
              <ArrowUpNarrowWideIcon size={18} strokeWidth={1.5} />
            </SideMenuButton>
            <SideMenuButton aria-label="Collapse All">
              <ChevronsUpDown size={18} strokeWidth={1.5} />
            </SideMenuButton>
          </div>
          <ul className="flex flex-col gap-1" role="list">
            <li className="bg-soma-light rounded-sm px-8 py-[0.1rem] text-sm text-soma-text-primary">
              Welcome
            </li>
            <li className="rounded-sm px-8 py-[0.1rem] text-sm hover:bg-soma-light transition-colors duration-200 h-auto">
              18-03-2025
            </li>
          </ul>
        </section>
      )}
    </>
  );
};

export default SideMenu;
