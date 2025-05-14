import React, { useRef, useState } from "react";
import SideMenuButton from "../buttons/Button";
import {
  ArrowDownNarrowWideIcon,
  ArrowUpDownIcon,
  ArrowUpNarrowWideIcon,
  ChevronsDownUp,
  ChevronsUpDown,
  FilePenLine,
  FolderPlus,
  NotepadTextDashed,
} from "lucide-react";
import FileTree from "./FileTree";
import { useAppContext } from "../../../context/AppContext";

type Props = {
  explorerExpanded: boolean;
};

interface TreeNode {
  id: string;
  name: string;
  isFolder: boolean;
  children?: TreeNode[];
  data: DirectoryItem | MarkdownItem;
}

const Explorer: React.FC<Props> = ({ explorerExpanded }) => {
  const {
    files,
    handleCreateNote,
    handleCreateFolder,
    changeSortMethod,
    sortMethod,
    getMessage,
  } = useAppContext();

  const [folderExpanded, setFolderExpanded] = useState<boolean>(false);

  let sortTippyMessage = null;
  switch (sortMethod) {
    case "asc":
      sortTippyMessage = getMessage("notes.sortAsc");
      break;
    case "desc":
      sortTippyMessage = getMessage("notes.sortDesc");
      break;
    case "custom":
      sortTippyMessage = getMessage("notes.sortCustom");
      break;
  }

  const cycleSortMethod = () => {
    const methods = ["asc", "desc", "custom"] as const;
    const currentIndex = methods.indexOf(
      sortMethod as (typeof methods)[number],
    );
    const nextIndex = (currentIndex + 1) % methods.length;
    changeSortMethod(methods[nextIndex]);
  };

  const transformToTreeData = (items: DirectoryContents): TreeNode[] => {
    return items.map((item) => ({
      id: item.path,
      name: item.name,
      isFolder: item.isDirectory,
      children: item.isDirectory
        ? transformToTreeData(item.children)
        : undefined,
      data: item,
    }));
  };

  const treeData = transformToTreeData(files);

  const fileTreeRef = useRef<FileTreeHandle>(null);

  return (
    <section
      className={`
        explorerContainer h-full bg-soma-darkest/90 transition-all duration-300
        ${explorerExpanded ? "expanded w-64" : "collapsed w-0"}
      `}
    >
      <div className="explorer h-full flex flex-col">
        <div className="explorerActionBar p-2 border-b border-soma-light/10 bg-soma-dark/50 flex items-center gap-1">
          <SideMenuButton
            tippyPlacement="bottom"
            tippyContent={getMessage("notes.newNote")}
            onClick={() => handleCreateNote()}
          >
            <FilePenLine size={18} strokeWidth={1.5} />
          </SideMenuButton>
          <SideMenuButton
            tippyPlacement="bottom"
            tippyContent={getMessage("notes.newFolder")}
            onClick={handleCreateFolder}
          >
            <FolderPlus size={18} strokeWidth={1.5} />
          </SideMenuButton>
          <SideMenuButton
            tippyPlacement="bottom"
            tippyContent={sortTippyMessage}
            onClick={cycleSortMethod}
          >
            {sortMethod === "asc" ? (
              <ArrowUpNarrowWideIcon size={18} strokeWidth={1.5} />
            ) : sortMethod === "desc" ? (
              <ArrowDownNarrowWideIcon size={18} strokeWidth={1.5} />
            ) : (
              <ArrowUpDownIcon size={18} strokeWidth={1.5} />
            )}
          </SideMenuButton>
          {folderExpanded ? (
            <SideMenuButton
              tippyPlacement="bottom"
              tippyContent={getMessage("common.collapseAll")}
              onClick={() => {
                setFolderExpanded(false);
                fileTreeRef.current?.collapseAllFolders();
              }}
            >
              <ChevronsDownUp size={18} strokeWidth={1.5} />
            </SideMenuButton>
          ) : (
            <SideMenuButton
              tippyPlacement="bottom"
              tippyContent={getMessage("common.expandAll")}
              onClick={() => {
                setFolderExpanded(true);
                fileTreeRef.current?.expandAllFolders();
              }}
            >
              <ChevronsUpDown size={18} strokeWidth={1.5} />
            </SideMenuButton>
          )}
        </div>

        {/* File Tree Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {files.length > 0 ? (
            <FileTree treeData={treeData} ref={fileTreeRef} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted p-8 opacity-70 h-full">
              <NotepadTextDashed
                size={48}
                className="mb-2 text-soma-lightest"
              />
              <p className="text-lg text-soma-text-primary">No notes yet</p>
              <p className="text-sm text-soma-text-secondary">
                Start by creating a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Explorer;
