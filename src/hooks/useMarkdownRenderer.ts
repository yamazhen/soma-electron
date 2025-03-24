import { RefObject, useRef } from "react";
import MarkdownIt from "markdown-it";

export const useMarkdownRenderer = () => {
  const md = useRef(
    new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true,
    }),
  );

  const renderMarkdown = (ref: RefObject<HTMLDivElement>, content: string) => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.innerHTML = md.current.render(content);
      }
    }, 0);
  };

  return { md: md.current, renderMarkdown };
};
