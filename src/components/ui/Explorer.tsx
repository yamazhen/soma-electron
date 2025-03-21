import React from "react";
import SideMenuButton from "./SideMenuButton";
import {
  ArrowUpNarrowWideIcon,
  ChevronsUpDown,
  FilePenLine,
  FolderPlus,
} from "lucide-react";
import { useFileContext } from "../context/FileContext";

type Props = {
  explorerExpanded: boolean;
};

const Explorer: React.FC<Props> = ({ explorerExpanded }) => {
  const {
    files,
    selectedFile,
    setSelectedFile,
    handleCreateNote,
    handleCreateFolder,
  } = useFileContext();

  const findFileInNotes = (
    notes: DirectoryContents,
    filePath: string,
  ): boolean => {
    for (const item of notes) {
      if (item.path === filePath) {
        return true;
      }
      if (item.isDirectory) {
        if (findFileInNotes(item.children, filePath)) {
          return true;
        }
      }
    }
    return false;
  };

  const renderItems = (items: DirectoryContents) => {
    return items.map((item) => {
      if (item.isDirectory) {
        return (
          <li key={item.path}>
            📁 {item.name}
            <ul className="ml-4">{renderItems(item.children)}</ul>
          </li>
        );
      } else {
        return (
          <li
            key={item.path}
            className={
              selectedFile === item.path ? "activeNote" : "inactiveNote"
            }
            onClick={() => setSelectedFile(item.path)}
          >
            {item.name}
          </li>
        );
      }
    });
  };
  return (
    <section
      className={`explorerContainer ${explorerExpanded ? "expanded" : "collapsed"}`}
    >
      <div className="explorer">
        <div className="flex justify-center items-center gap-1 mb-2">
          <SideMenuButton
            tippyPlacement="bottom"
            tippyContent="New Note"
            onClick={handleCreateNote}
          >
            <FilePenLine size={18} strokeWidth={1.5} />
          </SideMenuButton>
          <SideMenuButton
            tippyPlacement="bottom"
            tippyContent="New Folder"
            onClick={handleCreateFolder}
          >
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
          {files.length > 0 ? renderItems(files) : <li>No notes</li>}
        </ul>
      </div>
    </section>
  );
};

export default Explorer;
