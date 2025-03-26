import React, { useEffect, useState } from "react";
import SideMenuButton from "./SideMenuButton";
import {
  ArrowUpNarrowWideIcon,
  ChevronsUpDown,
  FilePenLine,
  FolderPlus,
} from "lucide-react";
import { useFileContext } from "../context/FileContext";
import FileTree from "../notePage/FileTree";

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
    selectedFile,
    setSelectedFile,
    handleCreateNote,
    handleCreateFolder,
    refreshFiles,
  } = useFileContext();
  const [designatedRoot, setDesignatedRoot] = useState<string>("");

  useEffect(() => {
    window.ipcRenderer.getNotesDir().then((root: string) => {
      setDesignatedRoot(root);
    });
  }, []);

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
        {files.length > 0 ? (
          <FileTree
            treeData={treeData}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            designatedRoot={designatedRoot}
            refreshFiles={refreshFiles}
          />
        ) : (
          <p>No notes</p>
        )}
      </div>
    </section>
  );
};

export default Explorer;
