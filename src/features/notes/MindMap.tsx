import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  applyNodeChanges,
  NodeChange,
  Node,
  Edge,
  Position,
  Handle,
  EdgeProps,
  useStore,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAppContext } from "../../context/AppContext";

type NodeData = {
  label: string;
};

const ObsidianNode = ({ data }: { data: NodeData }) => {
  return (
    <div className="relative flex flex-col items-center hover:text-white text-gray">
      <div className="px-2 pb-1 text-xs rounded whitespace-nowrap">
        {data.label}
      </div>
      <div className="w-3 h-3 rounded-full bg-purple-400 hover:bg-purple-500 transition-colors">
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

function MindMap() {
  const { files } = useAppContext();

  // Transform files into nodes only for markdown files
  const generateNodesAndEdges = useCallback(() => {
    const nodes: Node<NodeData>[] = [];
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
      nodes.push({
        id: file.path,
        type: "obsidian",
        data: { label: file.name },
        position: {
          x: 150 + (index % 3) * 200, // Simple grid layout
          y: 100 + Math.floor(index / 3) * 150,
        },
      });
    });

    return { nodes, edges };
  }, [files]);

  // Set up state with generated nodes and edges
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Update nodes and edges when files change
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [files, generateNodesAndEdges]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  return (
    <div className="h-screen w-full">
      <h1 className="text-xl p-4 text-center">Mind Map Mode</h1>
      <div className="h-[calc(100%-4rem)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
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
        ></ReactFlow>
      </div>
    </div>
  );
}

export default MindMap;
