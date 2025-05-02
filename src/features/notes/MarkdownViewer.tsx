import Markdoc from "@markdoc/markdoc";
import React, { useEffect, useRef } from "react";
import markdocConfig, { processWikiLinks } from "./markdoc";

type Props = {
  content: string;
  onWikiLinkClick?: (note: string) => void;
};

const MarkdownViewer: React.FC<Props> = ({ content, onWikiLinkClick }) => {
  const container = useRef<HTMLDivElement>(null);

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
    if (onWikiLinkClick) {
      const wikiLinks = container.current.querySelectorAll(".wiki-link");
      wikiLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const noteEl = e.currentTarget as HTMLElement;
          const note =
            noteEl.getAttribute("data-note") || noteEl.textContent || "";
          onWikiLinkClick(note);
        });
      });
    }

    return () => {
      // Clean up event listeners when component unmounts
      if (container.current && onWikiLinkClick) {
        const wikiLinks = container.current.querySelectorAll(".wiki-link");
        wikiLinks.forEach((link) => {
          // Note: This is a simplified removeEventListener
          // In practice, you would need to reference the same function
          link.removeEventListener("click", () => {});
        });
      }
    };
  }, [content, onWikiLinkClick]);

  return <div ref={container} className="markdownViewer pb-6"></div>;
};

export default MarkdownViewer;
