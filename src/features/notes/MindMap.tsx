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
	linkCount?: number; // Add link count for node sizing
}

interface GraphLink {
	source: string;
	target: string;
	value: number;
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
	const [loading, setLoading] = useState(true);
	const [graphData, setGraphData] = useState<{
		nodes: GraphNode[];
		links: GraphLink[];
	}>({
		nodes: [],
		links: [],
	});

	// Load graph data from your LinkService
	useEffect(() => {
		const loadGraphData = async () => {
			setLoading(true);
			try {
				// Get all links from your LinkService
				const linksResult = await window.ipcRenderer.invoke(
					"links:get-all-links",
				);

				if (!linksResult.success) {
					console.error("Failed to load links:", linksResult.error);
					return;
				}

				const links: GraphLink[] = linksResult.links;

				// Create nodes from files and calculate link counts
				const nodeMap = new Map<string, GraphNode>();
				const linkCounts = new Map<string, number>();

				// Process files to create initial nodes
				const processFiles = (items: FileItem[]) => {
					items.forEach((item) => {
						if (!item.isDirectory) {
							nodeMap.set(item.path, {
								id: item.path,
								name: item.name,
								linkCount: 0,
							});
							linkCounts.set(item.path, 0);
						} else if (item.children) {
							processFiles(item.children);
						}
					});
				};
				processFiles(files);

				// Calculate link counts for node sizing
				links.forEach((link) => {
					const sourceCount = linkCounts.get(link.source) || 0;
					const targetCount = linkCounts.get(link.target) || 0;
					linkCounts.set(link.source, sourceCount + link.value);
					linkCounts.set(link.target, targetCount + link.value);
				});

				// Update nodes with link counts
				const nodes: GraphNode[] = Array.from(nodeMap.values()).map((node) => ({
					...node,
					linkCount: linkCounts.get(node.id) || 0,
				}));

				// Filter out nodes that don't exist in files (orphaned links)
				const validLinks = links.filter(
					(link) => nodeMap.has(link.source) && nodeMap.has(link.target),
				);

				setGraphData({ nodes, links: validLinks });
			} catch (error) {
				console.error("Error loading graph data:", error);
			} finally {
				setLoading(false);
			}
		};

		if (files.length > 0) {
			loadGraphData();
		}
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
		if (graphRef.current && graphData.nodes.length > 0) {
			// Enhanced force simulation for better layout
			graphRef.current.d3Force("x", d3.forceX(0).strength(0.1));
			graphRef.current.d3Force("y", d3.forceY(0).strength(0.1));

			graphRef.current.d3Force(
				"collide",
				d3
					.forceCollide()
					.radius((d: any) => {
						const baseRadius = Math.sqrt((d.linkCount || 0) * 3) + 15;
						if (selectedNode?.id === d.id) return baseRadius + 10;
						if (hoverNode?.id === d.id) return baseRadius + 5;
						return baseRadius;
					})
					.strength(0.8)
					.iterations(3),
			);

			graphRef.current.d3Force(
				"charge",
				d3
					.forceManyBody()
					.strength((d: any) => {
						const strength = -50 - (d.linkCount || 0) * 5;
						if (selectedNode?.id === d.id) return strength * 2;
						if (hoverNode?.id === d.id) return strength * 1.5;
						return strength;
					})
					.distanceMin(30)
					.distanceMax(400),
			);

			// Link force for connected nodes
			graphRef.current.d3Force(
				"link",
				d3
					.forceLink(graphData.links)
					.id((d: any) => d.id)
					.distance((d: any) => 50 + d.value * 10)
					.strength((d: any) => Math.min(d.value * 0.1, 0.5)),
			);

			const simulation = graphRef.current.d3Force();
			if (simulation) {
				simulation.alphaDecay(0.015);
				simulation.velocityDecay(0.4);
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

	// Filter nodes and links based on search
	const filteredData = {
		nodes: graphData.nodes.filter(
			(node) =>
				!searchTerm ||
				node.name.toLowerCase().includes(searchTerm.toLowerCase()),
		),
		links: searchTerm
			? graphData.links.filter((link) => {
					const sourceNode = graphData.nodes.find((n) => n.id === link.source);
					const targetNode = graphData.nodes.find((n) => n.id === link.target);
					return (
						sourceNode?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
						targetNode?.name.toLowerCase().includes(searchTerm.toLowerCase())
					);
				})
			: graphData.links,
	};

	if (loading) {
		return (
			<div className="h-full w-full bg-soma-darkest flex items-center justify-center">
				<div className="text-soma-text-secondary">Loading mind map...</div>
			</div>
		);
	}

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
					graphData={filteredData}
					backgroundColor="transparent"
					// Link styling
					linkVisibility={true}
					linkColor={() => "#48484a"}
					linkWidth={(link: GraphLink) => Math.sqrt(link.value)}
					linkDirectionalParticles={2}
					linkDirectionalParticleSpeed={0.005}
					linkDirectionalParticleWidth={2}
					// Node styling
					nodeColor={(node: GraphNode) => {
						if (selectedNode?.id === node.id) return "#5856d6";
						if (hoverNode?.id === node.id) return "#007aff";
						if (
							searchTerm &&
							node.name.toLowerCase().includes(searchTerm.toLowerCase())
						) {
							return "#34c759";
						}
						// Color by connection count
						const linkCount = node.linkCount || 0;
						if (linkCount > 5) return "#ff9500"; // Orange for highly connected
						if (linkCount > 2) return "#30d158"; // Green for moderately connected
						return "#48484a"; // Gray for isolated
					}}
					nodeVal={(node: GraphNode) => {
						const baseSize = Math.sqrt((node.linkCount || 0) * 2) + 4;
						if (selectedNode?.id === node.id) return baseSize * 1.5;
						if (hoverNode?.id === node.id) return baseSize * 1.2;
						return baseSize;
					}}
					nodeLabel={(node: GraphNode) =>
						`${node.name}\n${node.linkCount || 0} connections`
					}
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
						const fontSize = 12 / globalScale;
						ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
						ctx.textAlign = "center";
						ctx.textBaseline = "top";
						const textWidth = ctx.measureText(label).width;
						const padding = 4 / globalScale;
						const x = node.x || 0;
						const y = node.y || 0;

						let textOffset = Math.sqrt((node.linkCount || 0) * 2) + 8;

						if (selectedNode?.id === node.id) {
							textOffset *= 1.5;
						} else if (hoverNode?.id === node.id) {
							textOffset *= 1.2;
						}

						// Background for text
						ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
						ctx.fillRect(
							x - textWidth / 2 - padding,
							y + textOffset,
							textWidth + padding * 2,
							fontSize + padding * 2,
						);

						// Text color based on state
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
						className="absolute bottom-6 left-6 bg-soma-dark rounded-lg shadow-xl p-4 border border-soma-light/10 max-w-xs transition-all hover:scale-105 hover:shadow-2xl hover:border-soma-accent1/30 cursor-pointer"
						onClick={() => {
							setSelectedFile(selectedNode.id);
							setNoteView("note");
						}}
					>
						<h3 className="font-medium text-soma-text-primary mb-1">
							{selectedNode.name}
						</h3>
						<p className="text-sm text-soma-text-secondary truncate mb-2">
							{selectedNode.id}
						</p>
						<div className="flex items-center justify-between">
							<span className="text-xs text-soma-text-secondary">
								{selectedNode.linkCount || 0} connections
							</span>
							<span className="text-xs text-soma-accent1">Click to open</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default MindMap;
