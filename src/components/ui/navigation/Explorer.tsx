import React, { useRef, useState } from "react";
import SideMenuButton from "../buttons/SideMenuButton";
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
import { useFileContext } from "../../../context/FileContext";

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
  } = useFileContext();

  const [folderExpanded, setFolderExpanded] = useState<boolean>(false);

  const cycleSortMethod = () => {
    const methods = ["asc", "desc", "custom"];
    const currentIndex = methods.indexOf(sortMethod);
    const nextIndex = (currentIndex + 1) % methods.length;
    changeSortMethod(methods[nextIndex]);
    console.log(`Sort method changed to: ${methods[nextIndex]}`);
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
      className={`explorerContainer ${explorerExpanded ? "expanded border-r-1 border-soma-medium" : "collapsed border-0"}`}
    >
      <div className="explorer">
        <div className="explorerActionBar">
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
              tippyContent="Collapse All"
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
              tippyContent="Expand All"
              onClick={() => {
                setFolderExpanded(true);
                fileTreeRef.current?.expandAllFolders();
              }}
            >
              <ChevronsUpDown size={18} strokeWidth={1.5} />
            </SideMenuButton>
          )}
        </div>
        {files.length > 0 ? (
          <FileTree treeData={treeData} ref={fileTreeRef} />
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted p-8 opacity-70">
            <NotepadTextDashed size={48} className="mb-2" />
            <p className="text-lg">No notes yet</p>
            <p className="text-sm text-muted-foreground">
              Start by creating a new one
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Explorer;
