import Markdoc from "@markdoc/markdoc";
import React, { useEffect, useRef } from "react";
import markdocConfig from "./markdoc";

type Props = {
  content: string;
};

const MarkdownViewer: React.FC<Props> = ({ content }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const ast = Markdoc.parse(content);
    const transformed = Markdoc.transform(ast, markdocConfig);
    const html = Markdoc.renderers.html(transformed);
    container.current.innerHTML = html;
  }, [content]);

  return <div ref={container} className="markdownViewer pb-6"></div>;
};

export default MarkdownViewer;
