import React, { useEffect, useState } from "react";
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
import SideMenuButton from "./SideMenuButton";
import { usePage } from "./PageContext";
import RotatingArrow from "./RotatingArrow";

type Props = {
  className?: string;
};

const SideMenu: React.FC<Props> = ({ className }) => {
  const { activePage } = usePage();

  // States for the explorer panel
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const [animationClass, setAnimationClass] = useState(
    explorerExpanded ? "scaleIn" : "",
  );
  const [isExplorerVisible, setIsExplorerVisible] = useState(explorerExpanded);
  // useEffect to handle the animation of the explorer panel
  useEffect(() => {
    if (explorerExpanded) {
      setIsExplorerVisible(true);
      setAnimationClass("scaleIn");
    } else {
      setAnimationClass("scaleOut");
      const timer = setTimeout(() => {
        setIsExplorerVisible(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [explorerExpanded]);
  // Function to toggle the explorer panel
  const toggleExplorer = () => {
    setExplorerExpanded(!explorerExpanded);
  };

  return (
    <>
      <section
        className={`menu ${className} ${isExplorerVisible && activePage === "notes" ? "bg-soma-dark" : "bg-transparent"}`}
      >
        {activePage === "home" && (
          <>
            <div className="menuButtonHolder">
              <SideMenuButton className="mt-2">
                <LayoutGrid size={18} strokeWidth={1.5} />
              </SideMenuButton>
              <SideMenuButton>
                <Activity size={18} strokeWidth={1.5} />
              </SideMenuButton>
              <SideMenuButton>
                <Plus size={18} strokeWidth={1.5} />
              </SideMenuButton>
            </div>
          </>
        )}
        {activePage === "notes" && (
          <>
            <div className="menuButtonHolder">
              <SideMenuButton className="mt-2">
                <BrainCircuit size={18} strokeWidth={1.5} />
              </SideMenuButton>
              <SideMenuButton>
                <Plus size={18} strokeWidth={1.5} />
              </SideMenuButton>
            </div>
          </>
        )}
        {activePage === "quiz" && (
          <>
            <div className="menuButtonHolder"></div>
          </>
        )}
        {activePage === "flashcard" && (
          <>
            <div className="menuButtonHolder"></div>
          </>
        )}
        <div className="menuButtonHolder">
          {activePage === "notes" && (
            <RotatingArrow
              onClick={toggleExplorer}
              rotated={explorerExpanded}
            />
          )}
          <SideMenuButton className="mb-2">
            <Settings size={18} strokeWidth={1.5} />
          </SideMenuButton>
        </div>
      </section>
      {activePage === "notes" && isExplorerVisible && (
        <section className={`explorer ${animationClass}`}>
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
          <ul className="flex flex-col gap-1">
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
