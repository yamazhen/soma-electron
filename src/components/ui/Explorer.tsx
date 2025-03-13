import React from "react";
import SideMenuButton from "./SideMenuButton";
import {
  ArrowUpNarrowWideIcon,
  ChevronsUpDown,
  FilePenLine,
  FolderPlus,
} from "lucide-react";

type Props = {
  explorerExpanded: boolean;
};

const Explorer: React.FC<Props> = ({ explorerExpanded }) => {
  return (
    <section
      className={`explorerContainer ${explorerExpanded ? "expanded" : "collapsed"}`}
    >
      <div className="explorer">
        <div className="flex justify-center items-center gap-1 mb-2">
          <SideMenuButton tippyPlacement="bottom" tippyContent="New Note">
            <FilePenLine size={18} strokeWidth={1.5} />
          </SideMenuButton>
          <SideMenuButton tippyPlacement="bottom" tippyContent="New Folder">
            <FolderPlus size={18} strokeWidth={1.5} />
          </SideMenuButton>
          <SideMenuButton
            tippyPlacement="bottom"
            tippyContent="Change Sort Order"
          >
            <ArrowUpNarrowWideIcon size={18} strokeWidth={1.5} />
          </SideMenuButton>
          <SideMenuButton tippyPlacement="bottom" tippyContent="Expand All">
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
  );
};

export default Explorer;
