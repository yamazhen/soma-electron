import React, { useCallback, useEffect, useState } from "react";
import SideMenuButton from "./SideMenuButton";
import {
  ArrowUpNarrowWideIcon,
  ChevronRight,
  ChevronsUpDown,
  FilePenLine,
  FolderPlus,
} from "lucide-react";
import { useFileContext } from "../context/FileContext";
import { NodeRendererProps, Tree } from "react-arborist";

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

function getParentPath(filePath: string) {
  const lastSlashIndex = filePath.lastIndexOf("/");
  if (lastSlashIndex <= 0) return filePath;
  return filePath.substring(0, lastSlashIndex);
}

function getBaseName(filePath: string) {
  const parts = filePath.replace(/\\/g, "/").split("/");
  return parts.pop() || "";
}

function joinPaths(parentPath: string, childPath: string): string {
  if (parentPath.endsWith("/") || parentPath.endsWith("\\")) {
    return parentPath + childPath;
  } else {
    return parentPath + "/" + childPath;
  }
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
  });

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

  const handleMove = useCallback(
    async (args: {
      dragIds: string[];
      dragNodes: any[];
      parentId: string | null;
      parentNode: any | null;
      index: number;
    }) => {
      const { dragIds, parentId, index } = args;
      const newParentPath = parentId != null ? parentId : designatedRoot;

      for (const dragId of dragIds) {
        const item = files.find((f) => f.path === dragId);
        if (!item) continue;
        const currentParentPath = getParentPath(item.path);
        if (currentParentPath !== newParentPath) {
          const newPath = joinPaths(newParentPath, getBaseName(item.path));
          await window.ipcRenderer.moveFile(item.path, newPath);
        }
      }

      const itemsInDirectory = files.filter(
        (item) => getParentPath(item.path) === newParentPath,
      );

      let newOrder = itemsInDirectory.map((item) => item.path);
      newOrder = newOrder.filter((path) => !dragIds.includes(path));
      newOrder.splice(index, 0, ...dragIds);

      const ordersToUpdate = newOrder.map((path, i) => ({
        path,
        parentPath: newParentPath,
        index: i,
      }));
      console.log("New order:", ordersToUpdate);

      window.ipcRenderer.updateFileOrders(ordersToUpdate).then(() => {
        setTimeout(() => {
          refreshFiles();
        }, 100);
      });
    },
    [refreshFiles, files],
  );

  const Node = useCallback(
    ({ node, style, dragHandle }: NodeRendererProps<TreeNode>) => {
      const folder = node.data.isFolder;
      const isSelected = !folder && selectedFile === node.data.data.path;
      const levelClass = `fileLevel-${node.level}`;
      return (
        <div
          style={style}
          ref={dragHandle}
          className={`flex items-center gap-1 ${isSelected ? "activeNote" : "inactiveNote"} ${levelClass}`}
          onClick={() => {
            if (folder) {
              node.toggle();
            } else setSelectedFile(node.data.data.path);
          }}
        >
          <div className="flex items-center h-4">
            {Array.from({ length: node.level }).map((_, index) => (
              <span key={index} className="w-4 fileIndentList"></span>
            ))}
            {folder ? (
              <ChevronRight
                strokeWidth={1.5}
                className={`w-4 transition-transform duration-200 ${node.isOpen ? "rotate-90" : "rotate-0"}`}
              />
            ) : (
              <span className="w-4"></span>
            )}
          </div>
          <span>{node.data.name}</span>
        </div>
      );
    },
    [selectedFile, setSelectedFile],
  );

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
          <Tree<TreeNode>
            data={treeData}
            indent={16}
            openByDefault={false}
            rowHeight={26}
            width="100%"
            onMove={handleMove}
          >
            {Node}
          </Tree>
        ) : (
          <p>No notes</p>
        )}
      </div>
    </section>
  );
};

export default Explorer;
