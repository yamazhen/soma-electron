import React, { useCallback, useEffect, useRef, useState } from "react";
import { NodeRendererProps, Tree } from "react-arborist";
import { ChevronRight } from "lucide-react";
import { getParentPath } from "../../utils/path";
import "react-contexify/ReactContexify.css";
import { Item, ItemParams, Menu, useContextMenu } from "react-contexify";

interface MovedItem {
  oldPath: string;
  newPath: string | undefined;
}

interface TreeNode {
  id: string;
  name: string;
  isFolder: boolean;
  children?: TreeNode[];
  data: DirectoryItem | MarkdownItem;
}

interface FileTreeProps {
  treeData: TreeNode[];
  selectedFile: string | null;
  setSelectedFile: (path: string) => void;
  designatedRoot: string;
  refreshFiles: () => Promise<any>;
}

const FileTree: React.FC<FileTreeProps> = ({
  treeData,
  selectedFile,
  setSelectedFile,
  designatedRoot,
  refreshFiles,
}) => {
  const [renamingNode, setRenamingNode] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const MENU_ID = "fileTreeContextMenu";

  const { show } = useContextMenu({
    id: MENU_ID,
  });

  const handleRename = async (nodeId: string, newNodeName: string) => {
    if (!newNodeName.trim()) {
      setRenamingNode(null);
      setNewName("");
      return;
    }

    const result = await window.ipcRenderer.renameFileOrFolder(
      nodeId,
      newNodeName,
    );
    if (result.success && result.newPath) {
      if (selectedFile === nodeId) {
        setSelectedFile(result.newPath);
      }
      await refreshFiles();
    }

    setRenamingNode(null);
    setNewName("");
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, nodeId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRename(nodeId, newName);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setRenamingNode(null);
      setNewName("");
    }
  };

  const handleMove = useCallback(
    async (args: {
      dragIds: string[];
      dragNodes: any[];
      parentId: string | null;
      parentNode: any | null;
      index: number;
    }) => {
      const { dragIds, parentId, parentNode, index } = args;
      const newParentPath = parentId != null ? parentId : designatedRoot;
      const movedItems: MovedItem[] = [];

      for (const dragId of dragIds) {
        const findItemInTree = (items: TreeNode[]): TreeNode | null => {
          for (const item of items) {
            if (item.id === dragId) return item;
            if (item.children) {
              const found = findItemInTree(item.children);
              if (found) return found;
            }
          }
          return null;
        };

        const treeItem = findItemInTree(treeData);
        if (!treeItem) continue;

        const currentParentPath = getParentPath(dragId);
        if (currentParentPath !== newParentPath) {
          const result = await window.ipcRenderer.moveFile(
            dragId,
            newParentPath,
          );
          if (result.success) {
            movedItems.push({ oldPath: dragId, newPath: result.newPath });
          }
        }
      }

      const updatedDragIds = dragIds.map((id) => {
        const moved = movedItems.find((item) => item.oldPath === id);
        return moved && moved.newPath ? moved.newPath : id;
      });

      let currentOrder: string[] = [];
      if (parentNode) {
        currentOrder = parentNode.children.map((node: any) => node.id);
      } else {
        currentOrder = treeData.map((node) => node.id);
      }

      const isSameDirectory = !movedItems.length;
      const originalIndices = updatedDragIds.map((id) =>
        currentOrder.indexOf(id),
      );

      const withoutDragged = currentOrder.filter(
        (id) => !updatedDragIds.includes(id),
      );

      let targetIndex = index;
      if (isSameDirectory) {
        const itemsBefore = originalIndices.filter((i) => i < index).length;
        targetIndex = Math.max(0, index - itemsBefore);
      }

      const safeIndex = Math.min(targetIndex, withoutDragged.length);
      withoutDragged.splice(safeIndex, 0, ...updatedDragIds);

      const ordersToUpdate = withoutDragged.map((path, i) => ({
        path,
        parentPath: newParentPath,
        index: i,
      }));

      await window.ipcRenderer.updateFileOrders(ordersToUpdate);
      await refreshFiles();
    },
    [treeData, designatedRoot, refreshFiles],
  );

  useEffect(() => {
    if (renamingNode && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingNode]);

  const Node = useCallback(
    ({ node, style, dragHandle }: NodeRendererProps<TreeNode>) => {
      const folder = node.data.isFolder;
      const isSelected = !folder && selectedFile === node.data.data.path;
      const levelClass = `fileLevel-${node.level}`;
      const isRenaming = renamingNode === node.id;
      const nodeName = node.data.name;

      const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        show({
          event: e,
          props: {
            nodeId: node.id,
            nodeName: node.data.name,
            isFolder: folder,
          },
        });
      };

      return (
        <div
          style={style}
          ref={dragHandle}
          className={`flex items-center ${isSelected ? "activeNote" : "inactiveNote"} ${levelClass} ${isRenaming ? "border border-soma-light !bg-soma-darkest" : ""}`}
          onClick={() => {
            if (folder) {
              node.toggle();
            } else setSelectedFile(node.data.data.path);
          }}
          onContextMenu={handleContextMenu}
        >
          <div className="flex items-center h-4 gap-1">
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
          {isRenaming ? (
            <input
              className="bg-transparent z-10"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onBlur={() => handleRename(node.id, newName)}
              onChange={(e) => {
                e.stopPropagation();
                setNewName(e.target.value);
              }}
              value={newName}
              ref={renameInputRef}
              onKeyDown={(e) => {
                e.stopPropagation();
                handleRenameKeyDown(e, node.id);
              }}
              autoFocus
            />
          ) : (
            <span>{nodeName}</span>
          )}
        </div>
      );
    },
    [
      selectedFile,
      setSelectedFile,
      renamingNode,
      newName,
      show,
      handleRename,
      handleRenameKeyDown,
    ],
  );

  return (
    <>
      <Tree<TreeNode>
        data={treeData}
        indent={16}
        openByDefault={false}
        rowHeight={26}
        width="100%"
        onMove={renamingNode ? undefined : handleMove}
      >
        {Node}
      </Tree>
      <Menu id={MENU_ID}>
        <Item
          onClick={(args: ItemParams<any, any>) => {
            const { props } = args;
            if (props) {
              setRenamingNode(props.nodeId);
              setNewName(props.nodeName);
            }
          }}
        >
          Rename
        </Item>
      </Menu>
    </>
  );
};

export default FileTree;
