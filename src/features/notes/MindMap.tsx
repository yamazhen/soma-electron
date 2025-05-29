import { useEffect, useMemo, useRef, useState } from "react";
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
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
	const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [graphData, setGraphData] = useState<GraphData>({
		nodes: [],
		links: [],
	});

	const buildGraphData = async (): Promise<GraphData> => {
		const nodes: GraphNode[] = [];
		const links: GraphLink[] = [];
		const nodeMap = new Map<string, GraphNode>();
		const linkSet = new Set<string>();

		const processFiles = (items: FileItem[]) => {
			for (const item of items) {
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
					nodeMap.set(item.name, node);
				} else if (item.children) {
					processFiles(item.children);
				}
			}
		};

		processFiles(files);

		if (nodes.length === 0 || !window.linksApi) {
			return { nodes, links };
		}

		try {
			const linkPromises = nodes.map((node) =>
				window.linksApi.getOutgoingLinks(node.path),
			);

			const results = await Promise.allSettled(linkPromises);

			results.forEach((result, index) => {
				if (
					result.status === "fulfilled" &&
					result.value?.success &&
					result.value.links
				) {
					const sourceNode = nodes[index];

					for (const link of result.value.links) {
						const targetNode =
							nodeMap.get(link.targetName) ||
							(link.targetPath ? nodeMap.get(link.targetPath) : null);

						if (targetNode && targetNode.id !== sourceNode.id) {
							const linkKey = [sourceNode.id, targetNode.id].sort().join("->");

							if (!linkSet.has(linkKey)) {
								linkSet.add(linkKey);
								links.push({
									source: sourceNode.id,
									target: targetNode.id,
									value: 1,
								});
								sourceNode.linkCount++;
								targetNode.linkCount++;
							}
						}
					}
				}
			});
		} catch (error) {
			console.error("Error building graph links:", error);
		}

		for (const node of nodes) {
			node.nodeType = node.linkCount === 0 ? "orphan" : "note";
		}

		return { nodes, links };
	};

	const loadGraphData = async () => {
		setLoading(true);
		try {
			const data = await buildGraphData();
			setGraphData(data);
		} catch (error) {
			console.error("Error building graph data:", error);
			setGraphData({ nodes: [], links: [] });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (files.length > 0) {
			loadGraphData();
		}
	}, [files]);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout;

		const resize = () => {
			if (containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect();
				const newWidth = Math.floor(rect.width);
				const newHeight = Math.floor(rect.height);

				setDimensions((prev) => {
					if (prev.width !== newWidth || prev.height !== newHeight) {
						return { width: newWidth, height: newHeight };
					}
					return prev;
				});
			}
		};

		const debouncedResize = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(resize, 16);
		};

		const initialResize = () => {
			requestAnimationFrame(() => {
				requestAnimationFrame(resize);
			});
		};

		initialResize();

		const resizeObserver = new ResizeObserver(debouncedResize);
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		window.addEventListener("resize", debouncedResize);

		return () => {
			clearTimeout(timeoutId);
			resizeObserver.disconnect();
			window.removeEventListener("resize", debouncedResize);
		};
	}, []);

	useEffect(() => {
		if (!graphRef.current || graphData.nodes.length === 0) return;

		const setupForces = () => {
			try {
				const graph = graphRef.current;

				graph.d3Force("x", d3.forceX(0).strength(0.2));
				graph.d3Force("y", d3.forceY(0).strength(0.2));

				graph.d3Force(
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

				graph.d3Force(
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

				if (graphData.links.length > 0) {
					graph.d3Force(
						"link",
						d3
							.forceLink(graphData.links)
							.id((d: any) => d.id)
							.distance(80)
							.strength(0.3),
					);
				}

				const simulation = graph.d3Force();
				if (simulation && graphData.nodes.length > 0) {
					simulation.alphaDecay(0.015).velocityDecay(0.4).restart();
				}
			} catch (error) {
				console.error("Error setting up D3 forces:", error);
			}
		};

		requestAnimationFrame(setupForces);
	}, [graphData, selectedNode, hoverNode, dimensions]);

	const getNodeColor = useMemo(
		() => (node: GraphNode) => {
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
		},
		[selectedNode, hoverNode, searchTerm],
	);

	const getNodeSize = useMemo(
		() => (node: GraphNode) => {
			const baseSize = 4;
			const linkBonus = Math.min(node.linkCount * 0.8, 4);
			if (selectedNode?.id === node.id) return baseSize + linkBonus + 3;
			if (hoverNode?.id === node.id) return baseSize + linkBonus + 2;
			return baseSize + linkBonus;
		},
		[selectedNode, hoverNode],
	);

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

	const filteredData = useMemo(() => {
		if (!searchTerm) return graphData;

		const searchLower = searchTerm.toLowerCase();
		const filteredNodes = graphData.nodes.filter((node) =>
			node.name.toLowerCase().includes(searchLower),
		);

		const nodeIds = new Set(filteredNodes.map((n) => n.id));

		const filteredLinks = graphData.links.filter(
			(link) =>
				nodeIds.has(
					typeof link.source === "string" ? link.source : link.source.id,
				) &&
				nodeIds.has(
					typeof link.target === "string" ? link.target : link.target.id,
				),
		);

		return { nodes: filteredNodes, links: filteredLinks };
	}, [graphData, searchTerm]);

	if (loading) {
		return (
			<div className="h-full w-full bg-soma-darkest flex items-center justify-center">
				<div className="text-center">
					<RefreshCw
						className="animate-spin text-soma-accent1 mx-auto mb-4"
						size={48}
					/>
					<p className="text-soma-text-primary">Loading mind map...</p>
				</div>
			</div>
		);
	}

	if (graphData.nodes.length === 0) {
		return (
			<div className="h-full w-full bg-soma-darkest flex items-center justify-center">
				<div className="text-center">
					<Brain className="text-soma-text-secondary mx-auto mb-4" size={48} />
					<p className="text-soma-text-primary mb-2">No notes found</p>
					<p className="text-soma-text-secondary">
						Create some notes to see your mind map
					</p>
				</div>
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
								className="pl-9 pr-4 py-2 bg-soma-darkest border border-soma-light/20 rounded-lg text-sm text-soma-text-primary placeholder:text-soma-text-secondary focus:outline-none focus:ring-2 focus:ring-soma-accent1 focus:border-transparent no-drag"
							/>
						</div>

						{/* Controls */}
						<div className="flex items-center gap-1 no-drag">
							<Tippy
								content="Refresh Links"
								placement="bottom"
								theme="custom"
								arrow={true}
								delay={200}
							>
								<button
									type="button"
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
									type="button"
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
									type="button"
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
									type="button"
									onClick={handleCenter}
									className="p-2 hover:bg-soma-light/30 rounded-lg transition-colors"
								>
									<Crosshair size={18} className="text-soma-text-secondary" />
								</button>
							</Tippy>
							<button
								type="button"
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
						<div className="w-3 h-3 rounded-full bg-[#ff453a]" />
						<span>Orphaned (no links)</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-[#48484a]" />
						<span>Few connections</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-[#30d158]" />
						<span>Well connected</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-[#ff9f0a]" />
						<span>Hub (many links)</span>
					</div>
				</div>
			</div>

			{/* Graph Container */}
			<div className="flex-1 relative" ref={containerRef}>
				{filteredData.nodes.length > 0 &&
					dimensions.width > 50 &&
					dimensions.height > 50 && (
						<ForceGraph2D
							ref={graphRef}
							width={dimensions.width}
							height={dimensions.height}
							graphData={filteredData}
							backgroundColor="transparent"
							nodeColor={getNodeColor}
							nodeVal={getNodeSize}
							nodeLabel={() => ""}
							linkColor={() => "rgba(191, 90, 242, 0.6)"}
							linkWidth={(link: any) => Math.max(1, Math.sqrt(link.value) * 2)}
							linkDirectionalArrowLength={3.5}
							linkDirectionalArrowRelPos={1}
							linkDirectionalArrowColor={() => "rgba(191, 90, 242, 0.8)"}
							linkDirectionalParticles={1}
							linkDirectionalParticleSpeed={0.006}
							linkDirectionalParticleWidth={4}
							linkDirectionalParticleColor={() => "rgba(191, 90, 242, 0.9)"}
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
								const fontSize = Math.max(8, 12 / globalScale);
								const x = node.x || 0;
								const y = node.y || 0;

								const baseSize = 4;
								const linkBonus = Math.min(node.linkCount * 0.8, 4);
								let nodeRadius = baseSize + linkBonus;

								if (selectedNode?.id === node.id) {
									nodeRadius = baseSize + linkBonus + 3;
								} else if (hoverNode?.id === node.id) {
									nodeRadius = baseSize + linkBonus + 2;
								}

								let textOffset = nodeRadius + 6;
								let fontWeight = "normal";

								if (selectedNode?.id === node.id) {
									textOffset = nodeRadius + 8;
									fontWeight = "bold";
								} else if (hoverNode?.id === node.id) {
									textOffset = nodeRadius + 7;
								}

								ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
								ctx.textAlign = "center";
								ctx.textBaseline = "top";
								ctx.fillStyle = getNodeColor(node);

								ctx.fillText(label, x, y + textOffset + 4 / globalScale);
							}}
						/>
					)}

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
						<p className="text-xs text-soma-accent1 mt-2">Click to open</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default MindMap;
