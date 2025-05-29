import Markdoc from "@markdoc/markdoc";
import React, { useEffect, useRef } from "react";
import markdocConfig, { processWikiLinks } from "./markdoc";
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
			// Check if linksApi is available
			if (!window.linksApi) {
				console.warn("linksApi not available");
				return;
			}

			// First try to resolve the link
			const result = await window.linksApi.resolveTarget(noteName);

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

		try {
			// Process wiki links first
			const processedContent = processWikiLinks(content);

			// Parse and transform
			const ast = Markdoc.parse(processedContent);
			const transformed = Markdoc.transform(ast, markdocConfig);
			const html = Markdoc.renderers.html(transformed);

			container.current.innerHTML = html;

			// Add click event listeners to wiki links
			const wikiLinks = container.current.querySelectorAll(".cm-soma-wikilink");
			wikiLinks.forEach((link) => {
				const handleClick = async (e: Event) => {
					e.preventDefault();
					const noteEl = e.currentTarget as HTMLElement;
					const note =
						noteEl.getAttribute("data-note") || noteEl.textContent || "";

					if (onWikiLinkClick) {
						onWikiLinkClick(note);
					} else {
						await handleWikiLinkClick(note);
					}
				};

				link.addEventListener("click", handleClick);
			});
		} catch (error) {
			console.error("Error processing markdown:", error);
			// Fallback: just show the raw content
			container.current.textContent = content;
		}

		return () => {
			// Cleanup is handled by the next render
		};
	}, [content, onWikiLinkClick, setSelectedFile, setNoteView]);

	return <div ref={container} className="markdownViewer pb-6"></div>;
};

export default MarkdownViewer;
