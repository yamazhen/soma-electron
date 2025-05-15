import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useAppContext } from "../../context/AppContext";
import * as d3 from "d3-force";
import {
  Brain,
  Minimize2,
  Maximize2,
  Search,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from "lucide-react";
import Tippy from "@tippyjs/react";

interface FileItem {
  path: string;
  name: string;
  isDirectory?: boolean;
  children?: FileItem[];
}

interface GraphNode {
  id: string;
  name: string;
}

function MindMap() {
  const { files, setSelectedFile, setNoteView } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
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
      graphRef.current.d3Force("x", d3.forceX(0).strength(0.2));
      graphRef.current.d3Force("y", d3.forceY(0).strength(0.2));

      graphRef.current.d3Force(
        "collide",
        d3
          .forceCollide()
          .radius((d: any) => {
            if (selectedNode?.id === d.id) return 40;
            if (hoverNode?.id === d.id) return 35;
            return 30;
          })
          .strength(0.7)
          .iterations(3),
      );

      graphRef.current.d3Force(
        "charge",
        d3
          .forceManyBody()
          .strength((d: any) => {
            if (selectedNode?.id === d.id) return -150;
            if (hoverNode?.id === d.id) return -100;
            return -50;
          })
          .distanceMin(20)
          .distanceMax(300),
      );

      const simulation = graphRef.current.d3Force();
      if (simulation) {
        simulation.alphaDecay(0.02);
        simulation.velocityDecay(0.3);
      }
    }
  }, [graphData, dimensions, selectedNode, hoverNode]);

  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.2);
    }
  };
  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 0.8);
    }
  };

  const handleCenter = () => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 1000);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`h-full w-full bg-soma-darkest flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
    >
      {/* Header */}
      <div className="bg-soma-dark border-b border-soma-light/10">
        <div className="px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isFullscreen && <div className="w-14" />}
            <Brain className="text-soma-accent2" size={24} />
            <h1 className="text-xl font-semibold text-soma-text-primary">
              Mind Map
            </h1>
            <span className="text-sm text-soma-text-secondary">
              {graphData.nodes.length} notes
            </span>
          </div>
          {/* Search bar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-soma-text-secondary"
              />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-soma-darkest border border-soma-light/20 rounded-lg text-sm text-soma-text-primary placeholder:text-soma-text-secondary focus:outline-none focus:ring-2 focus:ring-soma-accent1 focus:border-transparent"
              />
            </div>
            {/* Controls */}
            <div className="flex items-center gap-1">
              <Tippy
                content="Zoom In"
                placement="bottom"
                theme="custom"
                arrow={true}
                delay={200}
              >
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-soma-light/30 rounded-lg transition-colors"
                >
                  <ZoomIn size={18} className="text-soma-text-secondary" />
                </button>
              </Tippy>
              <Tippy
                content="Zoom Out"
                placement="bottom"
                theme="custom"
                arrow={true}
                delay={200}
              >
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-soma-light/30 rounded-lg transition-colors"
                >
                  <ZoomOut size={18} className="text-soma-text-secondary" />
                </button>
              </Tippy>
              <Tippy
                content="Center"
                placement="bottom"
                theme="custom"
                arrow={true}
                delay={200}
              >
                <button
                  onClick={handleCenter}
                  className="p-2 hover:bg-soma-light/30 rounded-lg transition-colors"
                >
                  <Crosshair size={18} className="text-soma-text-secondary" />
                </button>
              </Tippy>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-soma-light/30 rounded-lg transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 size={18} className="text-soma-text-secondary" />
                ) : (
                  <Maximize2 size={18} className="text-soma-text-secondary" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Graph Container */}
      <div className="flex-1 relative" ref={containerRef}>
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          linkVisibility={false}
          backgroundColor="transparent"
          nodeColor={(node: GraphNode) => {
            if (selectedNode?.id === node.id) return "#5856d6";
            if (hoverNode?.id === node.id) return "#007aff";
            if (
              searchTerm &&
              node.name.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
              return "#34c759";
            }
            return "#48484a";
          }}
          nodeVal={(node: GraphNode) => {
            if (selectedNode?.id === node.id) return 8;
            if (hoverNode?.id === node.id) return 6;
            return 4;
          }}
          nodeLabel={() => ""}
          nodeCanvasObjectMode={() => "after"}
          onNodeHover={(node: GraphNode | null) => {
            setHoverNode(node);
            document.body.style.cursor = node ? "pointer" : "default";
          }}
          onNodeClick={(node: GraphNode) => {
            if (selectedNode?.id === node.id) {
              setSelectedNode(null);
            } else {
              setSelectedNode(node);
            }
          }}
          onBackgroundClick={() => {
            setSelectedNode(null);
          }}
          nodeCanvasObject={(
            node: any,
            ctx: CanvasRenderingContext2D,
            globalScale: number,
          ) => {
            const label = node.name;
            const fontSize = 14 / globalScale;
            ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            const textWidth = ctx.measureText(label).width;
            const padding = 4 / globalScale;
            const x = node.x || 0;
            const y = node.y || 0;

            let nodeRadius = 4;
            let textOffset = 8;

            if (selectedNode?.id === node.id) {
              nodeRadius = 8;
              textOffset = 12;
            } else if (hoverNode?.id === node.id) {
              nodeRadius = 6;
              textOffset = 10;
            }

            ctx.fillStyle = "transparent";
            ctx.fillRect(
              x - textWidth / 2 - padding,
              y + textOffset,
              textWidth + padding * 2,
              fontSize + padding * 2,
            );

            if (selectedNode?.id === node.id) {
              ctx.fillStyle = "#5856d6";
              ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            } else if (hoverNode?.id === node.id) {
              ctx.fillStyle = "#007aff";
            } else if (
              searchTerm &&
              node.name.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
              ctx.fillStyle = "#34c759";
            } else {
              ctx.fillStyle = "#f2f2f7";
            }

            ctx.fillText(label, x, y + textOffset + padding);
          }}
        />
        {/* Selected Node Info */}
        {selectedNode && (
          <div
            className="absolute bottom-6 left-6 bg-soma-dark rounded-lg shadow-xl p-4 border border-soma-light/10 max-w-xs transition-all hover:scale-105 hover:shadow-2xl hover:border-soma-accent1/30"
            onClick={() => {
              setSelectedFile(selectedNode.id);
              setNoteView("note");
            }}
          >
            <h3 className="font-medium text-soma-text-primary mb-1">
              {selectedNode.name}
            </h3>
            <p className="text-sm text-soma-text-secondary truncate">
              {selectedNode.id}
            </p>
            <p className="text-xs text-soma-accent1 mt-2 cursor-pointer">
              Click to open
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MindMap;
