import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  applyNodeChanges,
  NodeChange,
  Node,
  Edge,
  Position,
  Handle,
  EdgeProps,
  useStore,
  NodeDragHandler,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAppContext } from "../../context/AppContext";

type NodeData = {
  label: string;
};

const ObsidianNode = ({ data }: { data: NodeData }) => {
  return (
    <div className="relative flex flex-col items-center hover:text-white text-gray group">
      <div className="px-2 pb-1 text-xs rounded whitespace-nowrap group:hover:text-white">
        {data.label}
      </div>
      <div className="w-3 h-3 rounded-full bg-soma-lightest group-hover:bg-soma-accent2 transition-colors duration-200">
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ visibility: "hidden" }}
        />
        <Handle
          type="target"
          position={Position.Top}
          style={{ visibility: "hidden" }}
        />
      </div>
    </div>
  );
};

const CircleConnectingEdge = ({
  id,
  source,
  target,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const sourceNode = useStore((state) => state.nodeInternals.get(source));
  const targetNode = useStore((state) => state.nodeInternals.get(target));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const nodeWidth = sourceNode.width || 0;
  const nodeHeight = sourceNode.height || 0;

  const sourceX = sourceNode.position.x + nodeWidth / 2;
  const sourceY = sourceNode.position.y + nodeHeight - 6; // 6px is half of w-3 (12px)

  const targetX = targetNode.position.x + (targetNode.width || 0) / 2;
  const targetY = targetNode.position.y + (targetNode.height || 0) - 6;

  const edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      style={style}
      markerEnd={markerEnd}
    />
  );
};

const nodeTypes = {
  obsidian: ObsidianNode,
};

const edgeTypes = {
  circleEdge: CircleConnectingEdge,
};

interface FloatingNode extends Node<NodeData> {
  dragging?: boolean;
}

interface PositionMap {
  [key: string]: XYPosition;
}

interface XYPosition {
  x: number;
  y: number;
}

function MindMap() {
  const { files } = useAppContext();
  const animationRef = useRef<number | null>(null);
  const initialPositionsRef = useRef<PositionMap>({});
  const targetPositionsRef = useRef<PositionMap>({});
  const [initialAnimationComplete, setInitialAnimationComplete] =
    useState(false);
  const animationProgressRef = useRef(0);

  const onInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    // Small delay to ensure nodes are rendered
    setTimeout(() => {
      reactFlowInstance.fitView({
        padding: 0.4,
        includeHiddenNodes: true,
        duration: 800,
      });
    }, 500);
  }, []);

  // Transform files into nodes only for markdown files
  const generateNodesAndEdges = useCallback(() => {
    const nodes: FloatingNode[] = [];
    const edges: Edge[] = [];

    // Helper function to get all markdown files, ignoring folder structure
    const getAllMarkdownFiles = (items: DirectoryContents): MarkdownItem[] => {
      let markdownFiles: MarkdownItem[] = [];

      items.forEach((item) => {
        if (!("isDirectory" in item) || !item.isDirectory) {
          // This is a file
          markdownFiles.push(item as MarkdownItem);
        } else {
          // This is a directory, get files from its children
          markdownFiles = [
            ...markdownFiles,
            ...getAllMarkdownFiles(item.children),
          ];
        }
      });

      return markdownFiles;
    };

    const markdownFiles = getAllMarkdownFiles(files);

    // Create nodes for each markdown file
    markdownFiles.forEach((file, index) => {
      // This will be the target (origin) position
      const targetPosition = {
        x: 150 + (index % 3) * 200, // Simple grid layout
        y: 100 + Math.floor(index / 3) * 150,
      };

      // Generate starting position - closer to target with small random offset
      // Use a smaller deviation - only 50px in any direction
      const offsetRange = 50;
      const startX = targetPosition.x + (Math.random() * 2 - 1) * offsetRange;
      const startY = targetPosition.y + (Math.random() * 2 - 1) * offsetRange;

      nodes.push({
        id: file.path,
        type: "obsidian",
        data: { label: file.name },
        position: {
          x: startX,
          y: startY,
        },
      });

      // Store initial position
      initialPositionsRef.current[file.path] = { x: startX, y: startY };

      // Store target position (where the node should end up)
      targetPositionsRef.current[file.path] = { ...targetPosition };
    });

    return { nodes, edges };
  }, [files]);

  // Set up state with generated nodes and edges
  const [nodes, setNodes] = useState<FloatingNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Update nodes and edges when files change
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges();
    setNodes(newNodes);
    setEdges(newEdges);
    // Reset animation state when files change
    setInitialAnimationComplete(false);
    animationProgressRef.current = 0;
  }, [files, generateNodesAndEdges]);

  // Floating animation effect
  useEffect(() => {
    if (nodes.length === 0) return;

    const applyFloatingEffect = () => {
      // Increase animation progress - slower animation
      if (!initialAnimationComplete) {
        animationProgressRef.current = Math.min(
          1,
          animationProgressRef.current + 0.005,
        );
        if (animationProgressRef.current >= 1) {
          setInitialAnimationComplete(true);
        }
      }

      setNodes((currentNodes) => {
        return currentNodes.map((node) => {
          // Skip nodes being dragged
          if (node.dragging) return node;

          const initialPos = initialPositionsRef.current[node.id];
          const targetPos = targetPositionsRef.current[node.id];

          if (!initialPos || !targetPos) return node;

          let currentX, currentY;

          if (!initialAnimationComplete) {
            // During initial animation: interpolate from initial position to target position
            // Apply easing function for smoother animation (cubic easing)
            const easeProgress =
              1 - Math.pow(1 - animationProgressRef.current, 3);
            currentX =
              initialPos.x + (targetPos.x - initialPos.x) * easeProgress;
            currentY =
              initialPos.y + (targetPos.y - initialPos.y) * easeProgress;
          } else {
            // After initial animation: just stay at target position
            currentX = targetPos.x;
            currentY = targetPos.y;
          }

          return {
            ...node,
            position: {
              x: currentX,
              y: currentY,
            },
          };
        });
      });

      // Only continue animation if not complete
      if (!initialAnimationComplete) {
        animationRef.current = requestAnimationFrame(applyFloatingEffect);
      }
    };

    animationRef.current = requestAnimationFrame(applyFloatingEffect);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, initialAnimationComplete]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Node dragging handlers
  const onNodeDragStart: NodeDragHandler = useCallback((event, node) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === node.id ? { ...n, dragging: true } : n)),
    );
  }, []);

  const onNodeDragStop: NodeDragHandler = useCallback((event, node) => {
    // Update target position to new dragged position
    targetPositionsRef.current[node.id] = { ...node.position };

    setNodes((nds) =>
      nds.map((n) => (n.id === node.id ? { ...n, dragging: false } : n)),
    );
  }, []);

  useEffect(() => {
    // Re-fit view when nodes change significantly
    if (initialAnimationComplete && nodes.length > 0) {
      const timer = setTimeout(() => {
        document
          .querySelector(".react-flow__controls-fitview")
          ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [nodes.length, initialAnimationComplete]);

  return (
    <div className="h-screen w-full">
      <h1 className="text-xl p-4 text-center">Mind Map Mode</h1>
      <div className="h-[calc(100%-4rem)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{
            padding: 0.4,
            includeHiddenNodes: true,
          }}
          onInit={onInit}
          minZoom={0.2}
          maxZoom={2}
          connectionLineStyle={{
            stroke: "rgba(180, 155, 255, 0.4)",
            strokeWidth: 1,
          }}
          defaultEdgeOptions={{
            style: { stroke: "rgba(180, 155, 255, 0.4)", strokeWidth: 1 },
            type: "circleEdge",
          }}
          proOptions={{ hideAttribution: true }}
          connectOnClick={false}
          nodesConnectable={true}
          zoomOnScroll={true}
          panOnScroll={true}
          panOnDrag={true}
          // Add controls to make the fit view button available
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          controls={true}
        />
      </div>
    </div>
  );
}

export default MindMap;
