import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { DragPreviewProps, NodeRendererProps, Tree } from "react-arborist";
import { getParentPath } from "../../../utils/path";
import "react-contexify/dist/ReactContexify.css";
import { Item, ItemParams, Menu, useContextMenu } from "react-contexify";
import useResizeObserver from "use-resize-observer";
import { ChevronRight } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";

function FileTree(
  { treeData }: FileTreeProps,
  forwardedRef: React.Ref<FileTreeHandle>,
) {
  const {
    selectedFile,
    setSelectedFile,
    loadNotesWithoutCheck,
    sortMethod,
    loadNotes,
    setNoteView,
  } = useAppContext();

  const [designatedRoot, setDesignatedRoot] = useState<string>("");
  const treeRef = useRef<any>(null);
  const [renamingNode, setRenamingNode] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null);

  const createDragPreview = useCallback(() => {
    return ({ dragIds, mouse, isDragging }: DragPreviewProps) => {
      if (!isDragging || !mouse) return null;

      const count = dragIds.length;
      let fileName = "";

      if (count === 1 && dragIds[0]) {
        const findNodeById = (nodes: TreeNode[]): TreeNode | null => {
          for (const node of nodes) {
            if (node.id === dragIds[0]) return node;
            if (node.children) {
              const found = findNodeById(node.children);
              if (found) return found;
            }
          }
          return null;
        };

        const node = findNodeById(treeData);
        if (node) {
          fileName = node.data.name;
        }
      }

      return (
        <div
          className="dragPreview"
          style={{
            left: mouse.x + 15,
            top: mouse.y + 10,
          }}
        >
          <div className="dragPreviewContent">
            {count === 1 ? (
              <span>Moving file: {fileName}</span>
            ) : (
              <span>Moving {count} items</span>
            )}
          </div>
        </div>
      );
    };
  }, [treeData]);

  useEffect(() => {
    window.ipcRenderer.getNotesDir().then((root: string) => {
      setDesignatedRoot(root);
    });
  }, []);

  const flattenTree = useCallback((nodes: TreeNode[]) => {
    let result: TreeNode[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.children) {
        result = result.concat(flattenTree(node.children));
      }
    }
    return result;
  }, []);

  const expandAllFolders = useCallback(() => {
    if (treeRef.current) {
      treeRef.current.openAll();
    }
  }, []);

  const collapseAllFolders = useCallback(() => {
    if (treeRef.current) {
      treeRef.current.closeAll();
    }
  }, []);

  useImperativeHandle(forwardedRef, () => ({
    expandAllFolders,
    collapseAllFolders,
  }));

  const handleShiftSelection = useCallback(
    (nodeId: string) => {
      if (!lastSelectedItem) {
        setSelectedItems([nodeId]);
        setLastSelectedItem(nodeId);
        return;
      }
      const allNodes = flattenTree(treeData);
      const allNodeIds = allNodes.map((node) => node.id);

      const currentIndex = allNodeIds.indexOf(nodeId);
      const lastIndex = allNodeIds.indexOf(lastSelectedItem);

      if (currentIndex === -1 || lastIndex === -1) return;

      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);

      const rangeSelection = allNodeIds.slice(start, end + 1);
      setSelectedItems(rangeSelection);
    },
    [lastSelectedItem, treeData, flattenTree],
  );

  const handleCtrlSelection = useCallback(
    (nodeId: string) => {
      setLastSelectedItem(nodeId);
      if (selectedItems.includes(nodeId)) {
        setSelectedItems(selectedItems.filter((id) => id !== nodeId));
      } else {
        setSelectedItems([...selectedItems, nodeId]);
      }
    },
    [selectedItems],
  );

  const handleNodeClick = useCallback(
    (e: React.MouseEvent, node: any) => {
      const nodeId = node.id;

      if (node.data.isFolder) {
        node.toggle();
        return;
      }

      if (e.shiftKey) {
        handleShiftSelection(nodeId);
      } else if (e.ctrlKey || e.metaKey) {
        handleCtrlSelection(nodeId);
      } else {
        setSelectedItems([nodeId]);
        setLastSelectedItem(nodeId);
        setSelectedFile(node.data.data.path);
        setNoteView("note");
      }
    },
    [
      handleShiftSelection,
      handleCtrlSelection,
      setSelectedFile,
      setNoteView,
      setSelectedItems,
      setLastSelectedItem,
    ],
  );

  const handleDeleteMultiple = async () => {
    if (selectedItems.length === 0) return;

    for (const nodeId of selectedItems) {
      const result = await window.ipcRenderer.deleteFileOrFolder(nodeId);
      if (result.success) {
        if (selectedFile === nodeId) {
          setSelectedFile("");
        }
      }
    }

    setSelectedItems([]);
    await loadNotes();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (e.key === "Delete" && selectedItems.length > 0 && !isInputElement) {
        handleDeleteMultiple();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItems, handleDeleteMultiple]);

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
        await loadNotesWithoutCheck();
      }
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
      await loadNotes();
    },
    [treeData, designatedRoot, loadNotes],
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
      const isFileSelected = !folder && selectedFile === node.data.data.path;
      const isItemSelected = selectedItems.includes(node.id);
      const levelClass = `fileLevel-${node.level}`;
      const isRenaming = renamingNode === node.id;
      const nodeName = node.data.name;

      const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!selectedItems.includes(node.id)) {
          setSelectedItems([node.id]);
          setLastSelectedItem(node.id);
        }
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
          className={`flex items-center ${isFileSelected ? "activeNote" : "inactiveNote"} ${
            isItemSelected && selectedItems.length > 1 ? "!bg-soma-accent1" : ""
          } ${levelClass} ${isRenaming ? "border border-soma-light !bg-soma-darkest" : ""}`}
          onClick={(e) => handleNodeClick(e, node)}
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
            <span className="truncate overflow-hidden text-ellipsis whitespace-nowrap">
              {nodeName}
            </span>
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

  const { ref: resizeRef, height = 0 } = useResizeObserver();
  return (
    <>
      <div ref={resizeRef} className="treeContainer">
        {height > 0 && (
          <Tree<TreeNode>
            ref={treeRef}
            data={treeData}
            indent={30}
            openByDefault={false}
            rowHeight={26}
            height={height}
            width="100%"
            onMove={renamingNode ? undefined : handleMove}
            disableDrag={sortMethod === "asc" || sortMethod === "desc"}
            renderCursor={Cursor}
            renderDragPreview={createDragPreview()}
          >
            {Node}
          </Tree>
        )}
      </div>
      <Menu id={MENU_ID} theme="my-custom-theme">
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
        <Item
          onClick={(args: ItemParams<any, any>) => {
            const { props } = args;
            if (props && props.nodeId) {
              handleDeleteMultiple();
            }
          }}
        >
          Delete{" "}
          {selectedItems.length > 1 ? `(${selectedItems.length} items)` : ""}
        </Item>
      </Menu>
    </>
  );
}

function Cursor({ top, left }: CursorProps) {
  return (
    <div
      className="dragDrop"
      style={{ top, left, width: `calc(100% - ${left}px)` }}
    ></div>
  );
}

export default React.forwardRef(FileTree);
