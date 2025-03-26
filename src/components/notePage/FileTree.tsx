import React, { useCallback } from "react";
import { NodeRendererProps, Tree } from "react-arborist";
import { ChevronRight } from "lucide-react";
import { getParentPath } from "../../utils/path";

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
        return moved ? moved.newPath : id;
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
  );
};

export default FileTree;
