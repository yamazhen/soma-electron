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
	RefreshCw,
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
	path: string;
	linkCount: number;
	nodeType: "note" | "orphan";
}

interface GraphLink {
	source: string;
	target: string;
	value: number;
}

interface GraphData {
	nodes: GraphNode[];
	links: GraphLink[];
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
	const [loading, setLoading] = useState(false);
	const [graphData, setGraphData] = useState<GraphData>({
		nodes: [],
		links: [],
	});

	// Build graph data with relationships
	const buildGraphData = async (): Promise<GraphData> => {
		const nodes: GraphNode[] = [];
		const links: GraphLink[] = [];
		const nodeMap = new Map<string, GraphNode>();
		const linkCounts = new Map<string, number>();

		// First pass: create all nodes
		const processFiles = (items: FileItem[]) => {
			items.forEach((item) => {
				if (!item.isDirectory) {
					const node: GraphNode = {
						id: item.path,
						name: item.name,
						path: item.path,
						linkCount: 0,
						nodeType: "note",
					};
					nodes.push(node);
					nodeMap.set(item.path, node);
					nodeMap.set(item.name, node); // Also map by name for lookup
					linkCounts.set(item.path, 0);
				} else if (item.children) {
					processFiles(item.children);
				}
			});
		};

		processFiles(files);

		// Second pass: get link relationships for each note
		for (const node of nodes) {
			try {
				const result = await window.linksApi?.getOutgoingLinks(node.path);
				if (result?.success && result.links) {
					for (const link of result.links) {
						if (link.resolved && link.targetPath) {
							const targetNode = nodeMap.get(link.targetPath);
							if (targetNode) {
								// Create link
								const existingLink = links.find(
									(l) =>
										(l.source === node.id && l.target === targetNode.id) ||
										(l.source === targetNode.id && l.target === node.id),
								);

								if (existingLink) {
									existingLink.value += 1;
								} else {
									links.push({
										source: node.id,
										target: targetNode.id,
										value: 1,
									});
								}

								// Update link counts
								linkCounts.set(node.path, (linkCounts.get(node.path) || 0) + 1);
								linkCounts.set(
									targetNode.path,
									(linkCounts.get(targetNode.path) || 0) + 1,
								);
							}
						}
					}
				}
			} catch (error) {
				console.error(`Error getting links for ${node.name}:`, error);
			}
		}

		// Update node link counts and mark orphans
		nodes.forEach((node) => {
			node.linkCount = linkCounts.get(node.path) || 0;
			node.nodeType = node.linkCount === 0 ? "orphan" : "note";
		});

		return { nodes, links };
	};

	// Load graph data
	const loadGraphData = async () => {
		setLoading(true);
		try {
			const data = await buildGraphData();
			setGraphData(data);
		} catch (error) {
			console.error("Error building graph data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadGraphData();
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
			// Center nodes with connected nodes having stronger attraction
			graphRef.current.d3Force("x", d3.forceX(0).strength(0.1));
			graphRef.current.d3Force("y", d3.forceY(0).strength(0.1));

			// Collision detection with variable radius based on connections
			graphRef.current.d3Force(
				"collide",
				d3
					.forceCollide()
					.radius((d: any) => {
						const baseRadius = 25;
						const linkBonus = Math.min(d.linkCount * 3, 15);
						if (selectedNode?.id === d.id) return baseRadius + linkBonus + 10;
						if (hoverNode?.id === d.id) return baseRadius + linkBonus + 5;
						return baseRadius + linkBonus;
					})
					.strength(0.8)
					.iterations(2),
			);

			// Charge force - connected nodes repel less
			graphRef.current.d3Force(
				"charge",
				d3
					.forceManyBody()
					.strength((d: any) => {
						const baseStrength = -100;
						const linkReduction = Math.min(d.linkCount * 10, 50);
						if (selectedNode?.id === d.id) return baseStrength - 50;
						return baseStrength + linkReduction;
					})
					.distanceMin(20)
					.distanceMax(400),
			);

			// Link force
			graphRef.current.d3Force(
				"link",
				d3
					.forceLink(graphData.links)
					.id((d: any) => d.id)
					.distance(80)
					.strength(0.3),
			);

			const simulation = graphRef.current.d3Force();
			if (simulation) {
				simulation.alphaDecay(0.015);
				simulation.velocityDecay(0.4);
			}
		}
	}, [graphData, dimensions, selectedNode, hoverNode]);

	const getNodeColor = (node: GraphNode) => {
		if (selectedNode?.id === node.id) return "#0071e3";
		if (hoverNode?.id === node.id) return "#bf5af2";
		if (
			searchTerm &&
			node.name.toLowerCase().includes(searchTerm.toLowerCase())
		) {
			return "#50bb50";
		}
		if (node.nodeType === "orphan") return "#ff453a";
		if (node.linkCount > 5) return "#ff9f0a";
		if (node.linkCount > 2) return "#30d158";
		return "#48484a";
	};

	const getNodeSize = (node: GraphNode) => {
		const baseSize = 4;
		const linkBonus = Math.min(node.linkCount * 0.8, 4);
		if (selectedNode?.id === node.id) return baseSize + linkBonus + 3;
		if (hoverNode?.id === node.id) return baseSize + linkBonus + 2;
		return baseSize + linkBonus;
	};

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

	const handleRefresh = () => {
		loadGraphData();
	};

	const filteredData = {
		nodes: graphData.nodes.filter(
			(node) =>
				!searchTerm ||
				node.name.toLowerCase().includes(searchTerm.toLowerCase()),
		),
		links: graphData.links.filter((link) => {
			if (!searchTerm) return true;
			const sourceNode = graphData.nodes.find((n) => n.id === link.source);
			const targetNode = graphData.nodes.find((n) => n.id === link.target);
			return (
				sourceNode?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				targetNode?.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}),
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
							{graphData.nodes.length} notes • {graphData.links.length}{" "}
							connections
						</span>
						{loading && (
							<div className="flex items-center gap-2 text-sm text-soma-accent1">
								<RefreshCw className="animate-spin" size={16} />
								Loading relationships...
							</div>
						)}
					</div>

					{/* Search and Controls */}
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
								content="Refresh Links"
								placement="bottom"
								theme="custom"
								arrow={true}
								delay={200}
							>
								<button
									onClick={handleRefresh}
									disabled={loading}
									className="p-2 hover:bg-soma-light/30 rounded-lg transition-colors disabled:opacity-50"
								>
									<RefreshCw
										size={18}
										className={`text-soma-text-secondary ${loading ? "animate-spin" : ""}`}
									/>
								</button>
							</Tippy>
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

			{/* Legend */}
			<div className="bg-soma-dark/50 px-6 py-2 border-b border-soma-light/10">
				<div className="flex items-center gap-6 text-xs text-soma-text-secondary">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-[#ff453a]"></div>
						<span>Orphaned (no links)</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-[#48484a]"></div>
						<span>Few connections</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-[#30d158]"></div>
						<span>Well connected</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-[#ff9f0a]"></div>
						<span>Hub (many links)</span>
					</div>
				</div>
			</div>

			{/* Graph Container */}
			<div className="flex-1 relative" ref={containerRef}>
				<ForceGraph2D
					ref={graphRef}
					width={dimensions.width}
					height={dimensions.height}
					graphData={filteredData}
					backgroundColor="transparent"
					nodeColor={getNodeColor}
					nodeVal={getNodeSize}
					nodeLabel={() => ""}
					linkColor={() => "rgba(255, 255, 255, 0.1)"}
					linkWidth={(link: any) => Math.sqrt(link.value)}
					linkDirectionalParticles={2}
					linkDirectionalParticleSpeed={0.002}
					linkDirectionalParticleWidth={2}
					linkDirectionalParticleColor={() => "rgba(191, 90, 242, 0.6)"}
					nodeCanvasObjectMode={() => "after"}
					onNodeHover={(node: GraphNode | null) => {
						setHoverNode(node);
						document.body.style.cursor = node ? "pointer" : "default";
					}}
					onNodeClick={(node: GraphNode) => {
						if (selectedNode?.id === node.id) {
							// Double click - open note
							setSelectedFile(node.path);
							setNoteView("note");
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
						const fontSize = 12 / globalScale;
						ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
						ctx.textAlign = "center";
						ctx.textBaseline = "top";
						const textWidth = ctx.measureText(label).width;
						const padding = 4 / globalScale;
						const x = node.x || 0;
						const y = node.y || 0;

						let textOffset = 8;
						if (selectedNode?.id === node.id) {
							textOffset = 12;
							ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
						} else if (hoverNode?.id === node.id) {
							textOffset = 10;
						}

						// Draw background for text
						ctx.fillStyle = "rgba(28, 28, 30, 0.8)";
						ctx.fillRect(
							x - textWidth / 2 - padding,
							y + textOffset,
							textWidth + padding * 2,
							fontSize + padding * 2,
						);

						// Draw text
						ctx.fillStyle = getNodeColor(node);
						ctx.fillText(label, x, y + textOffset + padding);

						// Draw link count if node has connections
						if (node.linkCount > 0) {
							const countText = node.linkCount.toString();
							const countFontSize = 8 / globalScale;
							ctx.font = `${countFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
							ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
							ctx.fillText(countText, x, y - textOffset);
						}
					}}
				/>

				{/* Selected Node Info */}
				{selectedNode && (
					<div
						className="absolute bottom-6 left-6 bg-soma-dark rounded-lg shadow-xl p-4 border border-soma-light/10 max-w-xs transition-all hover:scale-105 hover:shadow-2xl hover:border-soma-accent1/30 cursor-pointer"
						onClick={() => {
							setSelectedFile(selectedNode.path);
							setNoteView("note");
						}}
					>
						<h3 className="font-medium text-soma-text-primary mb-1">
							{selectedNode.name}
						</h3>
						<p className="text-sm text-soma-text-secondary truncate mb-2">
							{selectedNode.path}
						</p>
						<div className="flex items-center justify-between">
							<span className="text-xs text-soma-lightest">
								{selectedNode.linkCount} connections
							</span>
							<span
								className={`text-xs px-2 py-1 rounded-full ${
									selectedNode.nodeType === "orphan"
										? "bg-soma-error/20 text-soma-error"
										: "bg-soma-success/20 text-soma-success"
								}`}
							>
								{selectedNode.nodeType === "orphan" ? "Orphaned" : "Connected"}
							</span>
						</div>
						<p className="text-xs text-soma-accent1 mt-2">
							Click to open • Double-click node to open
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default MindMap;
