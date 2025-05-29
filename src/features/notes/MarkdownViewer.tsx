import Markdoc from "@markdoc/markdoc";
import type React from "react";
import { useEffect, useRef } from "react";
import markdocConfig from "./markdoc";
import { useAppContext } from "../../context/AppContext";

type Props = {
	content: string;
	onWikiLinkClick?: (note: string) => void;
};

const MarkdownViewer: React.FC<Props> = ({ content, onWikiLinkClick }) => {
	const container = useRef<HTMLDivElement>(null);
	const { setSelectedFile, setNoteView } = useAppContext();

	const handleWikiLinkClick = async (noteName: string) => {
		try {
			// First try to resolve the link
			const result = await window.ipcRenderer.invoke(
				"links:resolve-target",
				noteName,
			);

			if (result.success && result.targetPath) {
				setSelectedFile(result.targetPath);
				setNoteView("note");
			} else {
				// Note doesn't exist, offer to create it
				const shouldCreate = confirm(
					`Note "${noteName}" doesn't exist. Would you like to create it?`,
				);
				if (shouldCreate) {
					const newNote = await window.fileSystem.createMarkdownFile(noteName);
					if (newNote) {
						setSelectedFile(newNote.path);
						setNoteView("note");
					}
				}
			}
		} catch (error) {
			console.error("Error handling wiki link click:", error);
		}
	};

	useEffect(() => {
		if (!container.current) return;

		// Process content to convert @@note@@ syntax to Markdoc tags
		const processedContent = content.replace(
			/@@([^@\n]+)@@/g,
			(_, noteName) => {
				return `{% wikilink note="${noteName}" %}`;
			},
		);

		const ast = Markdoc.parse(processedContent);
		const transformed = Markdoc.transform(ast, markdocConfig);
		const html = Markdoc.renderers.html(transformed);

		container.current.innerHTML = html;

		// Add click event listeners to wiki links
		const wikiLinks = container.current.querySelectorAll(".cm-soma-wikilink");
		for (const link of wikiLinks) {
			link.addEventListener("click", async (e) => {
				e.preventDefault();
				const noteEl = e.currentTarget as HTMLElement;
				const note =
					noteEl.getAttribute("data-note") || noteEl.textContent || "";

				if (onWikiLinkClick) {
					onWikiLinkClick(note);
				} else {
					await handleWikiLinkClick(note);
				}
			});
		}

		return () => {
			// Cleanup event listeners
			if (container.current) {
				const wikiLinks =
					container.current.querySelectorAll(".cm-soma-wikilink");
				for (const link of wikiLinks) {
					link.removeEventListener("click", () => {});
				}
			}
		};
	}, [content, onWikiLinkClick, setSelectedFile, setNoteView]);

	return <div ref={container} className="markdownViewer pb-6" />;
};

export default MarkdownViewer;
