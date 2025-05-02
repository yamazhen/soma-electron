import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useAppContext } from "../../context/AppContext";
import * as d3 from "d3-force";

interface FileItem {
  path: string;
  name: string;
  isDirectory?: boolean;
  children?: FileItem[];
}

interface AppContextType {
  files: FileItem[];
}

interface GraphNode {
  id: string;
  name: string;
}

function MindMap() {
  const { files } = useAppContext() as AppContextType;
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    links: any[];
  }>({
    nodes: [],
    links: [],
  });

  useEffect(() => {
    const nodes: GraphNode[] = [];

    const processFiles = (items: FileItem[]) => {
      items.forEach((item) => {
        if (!item.isDirectory) {
          nodes.push({ id: item.path, name: item.name });
        } else if (item.children) {
          processFiles(item.children);
        }
      });
    };

    processFiles(files);
    setGraphData({ nodes, links: [] });
  }, [files]);

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("x", d3.forceX(0).strength(0.5));
      graphRef.current.d3Force("y", d3.forceY(0).strength(0.5));

      graphRef.current.d3Force("collide", d3.forceCollide(20));

      graphRef.current.d3Force("charge", d3.forceManyBody().strength(-10));
    }
  }, [graphData, dimensions]);

  return (
    <div className="h-screen w-full">
      <h1 className="text-xl p-4 text-center">Mind Map Mode</h1>
      <div className="h-[calc(100%-4rem)] w-full" ref={containerRef}>
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          linkVisibility={false}
          nodeColor={(node: GraphNode) =>
            hoverNode?.id === node.id ? "#a86e89" : "#bdb5cc"
          }
          nodeLabel={() => ""}
          nodeCanvasObjectMode={() => "after"}
          onNodeHover={(node: GraphNode | null) => {
            setHoverNode(node);
          }}
          nodeCanvasObject={(
            node: any,
            ctx: CanvasRenderingContext2D,
            globalScale: number,
          ) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = hoverNode?.id === node.id ? "#9085b3" : "#3a2c5c";

            const x = node.x || 0;
            const y = node.y || 0;

            ctx.fillText(label, x, y + 6);
          }}
        />
      </div>
    </div>
  );
}

export default MindMap;
