import Markdoc from "@markdoc/markdoc";
import markdocConfig, { processWikiLinks } from "./markdoc";
import { useAppContext } from "../../context/AppContext";
import type { FC } from "react";
import { useEffect, useRef, useCallback } from "react";

type Props = {
  content: string;
  onWikiLinkClick?: (note: string) => void;
};

const MarkdownViewer: FC<Props> = ({ content, onWikiLinkClick }) => {
  const container = useRef<HTMLDivElement>(null);
  const { setSelectedFile, setNoteView, files } = useAppContext();

  const findNoteByName = useCallback(
    (noteName: string) => {
      const searchFiles = (fileList: any[]): string | null => {
        for (const file of fileList) {
          if (file.isDirectory && file.children) {
            const found = searchFiles(file.children);
            if (found) return found;
          } else {
            const fileName = file.name.replace(/\.md$/, "");
            if (
              fileName === noteName ||
              file.name === noteName ||
              file.name === `${noteName}.md`
            ) {
              return file.path;
            }
          }
        }
        return null;
      };

      return searchFiles(files);
    },
    [files],
  );

  const handleWikiLinkClick = useCallback(
    async (noteName: string) => {
      console.log("handleWikiLinkClick called with:", noteName);

      try {
        const foundPath = findNoteByName(noteName);
        if (foundPath) {
          console.log("Found file in file list:", foundPath);
          setSelectedFile(foundPath);
          setNoteView("note");
          return;
        }

        if (window.linksApi) {
          console.log("Resolving target for:", noteName);
          const result = await window.linksApi.resolveTarget(noteName);
          console.log("Resolve result:", result);

          if (result.success && result.targetPath) {
            console.log("Navigating to:", result.targetPath);
            setSelectedFile(result.targetPath);
            setNoteView("note");
            return;
          }
        }

        console.log("Note doesn't exist, offering to create");
        const shouldCreate = confirm(
          `Note "${noteName}" doesn't exist. Would you like to create it?`,
        );

        if (shouldCreate) {
          const newNote =
            await window.fileSystem?.createMarkdownFile?.(noteName);
          if (newNote) {
            setSelectedFile(newNote.path);
            setNoteView("note");
          } else {
            const fallbackPath = `${noteName}.md`;
            setSelectedFile(fallbackPath);
            setNoteView("note");
          }
        }
      } catch (error) {
        console.error("Error handling wiki link click:", error);
      }
    },
    [setSelectedFile, setNoteView, findNoteByName],
  );

  const handleContainerClick = useCallback(
    async (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const wikiLink = target.closest(".cm-soma-wikilink") as HTMLElement;

      if (wikiLink) {
        e.preventDefault();
        e.stopPropagation();

        const note =
          wikiLink.getAttribute("data-note") || wikiLink.textContent || "";

        if (note) {
          if (onWikiLinkClick) {
            onWikiLinkClick(note);
          } else {
            await handleWikiLinkClick(note);
          }
        }
      }
    },
    [onWikiLinkClick, handleWikiLinkClick],
  );

  useEffect(() => {
    if (!container.current) return;

    try {
      const processedContent = processWikiLinks(content);
      const ast = Markdoc.parse(processedContent);
      const transformed = Markdoc.transform(ast, markdocConfig);
      const html = Markdoc.renderers.html(transformed);

      container.current.innerHTML = html;

      const wikiLinks = container.current.querySelectorAll(".cm-soma-wikilink");
      console.log(`Found ${wikiLinks.length} wiki links`);
    } catch (error) {
      console.error("Error processing markdown:", error);
      if (container.current) {
        container.current.innerHTML = `<div class="error">Error rendering content: ${error}</div><pre>${content}</pre>`;
      }
    }
  }, [content]);

  return (
    <div
      ref={container}
      className="markdownViewer pb-6"
      onClick={handleContainerClick}
    />
  );
};

export default MarkdownViewer;
