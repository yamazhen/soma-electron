import React, { useEffect, useRef } from "react";
import {
  EditorView,
  Decoration,
  ViewPlugin,
  WidgetType,
  DecorationSet,
  ViewUpdate,
  keymap,
} from "@codemirror/view";
import {
  EditorState,
  StateField,
  StateEffect,
  RangeSetBuilder,
  Transaction,
} from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { customFoldingExtension } from "./CustomFoldingExtension";
import { tags } from "@lezer/highlight";
import { indentWithTab } from "@codemirror/commands";

interface EditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
}

const MarkdownEditor: React.FC<EditorProps> = ({
  initialValue = "",
  onChange = () => {},
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  // Function to analyze a document and identify code blocks
  const analyzeCodeBlocks = (doc: string) => {
    const lines = doc.split("\n");
    const codeBlocks: {
      [key: number]: { isStart: boolean; isEnd: boolean; language: string };
    } = {};

    let inCodeBlock = false;
    let currentLanguage = "";

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const text = line.trim();

      if (text.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          const langMatch = text.match(/^```([a-zA-Z0-9]*)$/);
          currentLanguage = langMatch ? langMatch[1] : "";
          codeBlocks[lineNumber] = {
            isStart: true,
            isEnd: false,
            language: currentLanguage,
          };
        } else {
          inCodeBlock = false;
          codeBlocks[lineNumber] = {
            isStart: false,
            isEnd: true,
            language: currentLanguage,
          };
        }
      } else if (inCodeBlock) {
        codeBlocks[lineNumber] = {
          isStart: false,
          isEnd: false,
          language: currentLanguage,
        };
      }
    });

    return codeBlocks;
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const focusLineEffect = StateEffect.define<number>();

    // Add effect to update code blocks state directly
    const updateCodeBlocksEffect = StateEffect.define<{
      [key: number]: { isStart: boolean; isEnd: boolean; language: string };
    }>();

    const focusedLineField = StateField.define<number>({
      create() {
        return 0;
      },
      update(value: number, tr: Transaction) {
        for (let effect of tr.effects) {
          if (effect.is(focusLineEffect)) return effect.value;
        }
        if (tr.selection) {
          const line = tr.state.doc.lineAt(tr.selection.main.head);
          return line.number;
        }
        return value;
      },
    });

    const codeBlockField = StateField.define<{
      [key: number]: { isStart: boolean; isEnd: boolean; language: string };
    }>({
      create() {
        // Initialize with code blocks from initial value
        return analyzeCodeBlocks(initialValue);
      },
      update(value, tr) {
        // Check for direct state update
        for (let effect of tr.effects) {
          if (effect.is(updateCodeBlocksEffect)) {
            return effect.value;
          }
        }

        if (tr.docChanged) {
          const newValue: {
            [key: number]: {
              isStart: boolean;
              isEnd: boolean;
              language: string;
            };
          } = {};
          const doc = tr.state.doc;

          let inCodeBlock = false;
          let currentLanguage = "";

          for (let i = 1; i <= doc.lines; i++) {
            const line = doc.line(i);
            const text = line.text.trim();

            if (text.startsWith("```")) {
              if (!inCodeBlock) {
                inCodeBlock = true;
                const langMatch = text.match(/^```([a-zA-Z0-9]*)$/);
                currentLanguage = langMatch ? langMatch[1] : "";
                newValue[i] = {
                  isStart: true,
                  isEnd: false,
                  language: currentLanguage,
                };
              } else {
                inCodeBlock = false;
                newValue[i] = {
                  isStart: false,
                  isEnd: true,
                  language: currentLanguage,
                };
              }
            } else if (inCodeBlock) {
              // Mark all lines within a code block, even empty ones
              newValue[i] = {
                isStart: false,
                isEnd: false,
                language: currentLanguage,
              };
            }
          }
          return newValue;
        }
        return value;
      },
    });

    const simpleMarkdownRender = (
      text: string,
      isInCodeBlock: boolean,
      isCodeStart: boolean,
      isCodeEnd: boolean,
      codeLanguage: string,
    ): string => {
      if (text === "---" || text === "***" || text === "___") {
        return `<hr class="editorHr" style="margin: 0; padding: 0; height: 1px; line-height: inherit;" />`;
      }
      if (text.startsWith(">")) {
        const content = text.substring(1).trim();
        return `<blockquote class="editorBlockquote">${content}</blockquote>`;
      }
      if (isCodeStart) {
        // Replace the header div with an empty pre to match other code lines
        return `<pre class="editorCodeLine">&nbsp;</pre>`;
      }

      // Rest of the function remains unchanged...
      if (isCodeEnd) {
        return `<pre class="editorCodeLine">&nbsp;</pre>`;
      }

      if (isInCodeBlock) {
        const displayText = text.length === 0 ? "&nbsp;" : text;
        return `<pre class="editorCodeLine">${displayText}</pre>`;
      }

      if (text.startsWith("#")) {
        let level = 0;
        while (level < 6 && text[level] === "#") level++;

        if (text[level] === " ") {
          const content = text.substring(level + 1);
          return `<span class="editorHeading${level}">${content}</span>`;
        }
      }

      if (text.match(/^(\s*)\*\s/)) {
        const match = text.match(/^(\s*)\*\s(.*)$/);
        if (match) {
          const originalIndent = match[1];
          const content = match[2].trim();
          return `<span class="editorList" style="display: block;">${originalIndent}• ${content}</span>`;
        }
      }

      let processed = text;

      processed = processed.replace(/<u>(.*?)<\/u>/g, "<u>$1</u>");
      processed = processed.replace(
        /\*\*\*(.*?)\*\*\*/g,
        "<strong><em>$1</em></strong>",
      );
      processed = processed.replace(
        /\_\_\_(.*?)\_\_\_/g,
        "<strong><em>$1</em></strong>",
      );
      processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      processed = processed.replace(/\_\_(.*?)\_\_/g, "<strong>$1</strong>");
      processed = processed.replace(/\_(.*?)\_/g, "<em>$1</em>");
      processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>");
      processed = processed.replace(
        /(?<!``)`([^`\n]+)`(?!`)/g,
        '<code class="editorCode">$1</code>',
      );
      processed = processed.replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="javascript:void(0)" class="editorLink" data-href="$2">$1</a>',
      );
      processed = processed.replace(/~~(.*?)~~/g, "<del>$1</del>");

      return processed;
    };

    class MarkdownWidget extends WidgetType {
      private text: string;
      private lineNumber: number;
      private isCodeBlock: boolean;
      private isCodeStart: boolean;
      private isCodeEnd: boolean;
      private codeLanguage: string;

      constructor(
        text: string,
        lineNumber: number,
        isCodeBlock: boolean = false,
        isCodeStart: boolean = false,
        isCodeEnd: boolean = false,
        codeLanguage: string = "",
      ) {
        super();
        this.text = text;
        this.lineNumber = lineNumber;
        this.isCodeBlock = isCodeBlock;
        this.isCodeStart = isCodeStart;
        this.isCodeEnd = isCodeEnd;
        this.codeLanguage = codeLanguage;
      }

      eq(other: MarkdownWidget): boolean {
        return (
          other.text === this.text &&
          other.lineNumber === this.lineNumber &&
          other.isCodeBlock === this.isCodeBlock &&
          other.isCodeStart === this.isCodeStart &&
          other.isCodeEnd === this.isCodeEnd &&
          other.codeLanguage === this.codeLanguage
        );
      }

      toDOM(view: EditorView): HTMLElement {
        const element = document.createElement("span");
        element.className = this.isCodeBlock
          ? "cm-rendered-code"
          : "cm-rendered-markdown";
        element.dataset.lineNumber = this.lineNumber.toString();
        element.innerHTML = simpleMarkdownRender(
          this.text,
          this.isCodeBlock,
          this.isCodeStart,
          this.isCodeEnd,
          this.codeLanguage,
        );

        if (!this.isCodeBlock) {
          element.querySelectorAll(".editorLink").forEach((link) => {
            link.addEventListener(
              "click",
              (e) => {
                e.preventDefault();

                let href = (link as HTMLElement).dataset.href || "";
                if (href && !href.match(/^[a-zA-Z]+:\/\//)) {
                  href = "https://" + href;
                }

                if (href) {
                  window.ipcRenderer
                    .openExternalLink(href)
                    .then(() => console.log("Link opened successfully"))
                    .catch((err) => console.error("Error opening link:", err));
                }

                return false;
              },
              true,
            );
          });
        }

        element.addEventListener(
          "click",
          (e) => {
            if ((e.target as HTMLElement).closest(".editorLink")) {
              return;
            }

            const line = view.state.doc.line(this.lineNumber);

            const clickedElement = e.target as HTMLElement;
            const offset = getClickOffset(e, clickedElement);

            const linePosition = line.from + offset;

            view.dispatch({
              selection: { anchor: linePosition },
              effects: focusLineEffect.of(this.lineNumber),
            });

            view.focus();
          },
          true,
        );

        return element;
      }
    }

    function getClickOffset(event: MouseEvent, element: HTMLElement): number {
      const textNode = Array.from(element.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE,
      );

      if (!textNode) {
        const fullText = element.textContent || "";
        const rect = element.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const totalWidth = rect.width;

        const relativePosition = offsetX / totalWidth;
        return Math.min(
          Math.max(0, Math.round(relativePosition * fullText.length)),
          fullText.length,
        );
      }

      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, textNode.textContent?.length || 0);

      const rect = range.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const totalWidth = rect.width;

      const relativePosition = offsetX / totalWidth;
      const textLength = textNode.textContent?.length || 0;

      return Math.min(
        Math.max(0, Math.round(relativePosition * textLength)),
        textLength,
      );
    }

    const rawEditorDecorator = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
          if (
            update.docChanged ||
            update.viewportChanged ||
            update.selectionSet
          ) {
            this.decorations = this.buildDecorations(update.view);
          }
        }

        buildDecorations(view: EditorView) {
          const builder = new RangeSetBuilder<Decoration>();
          const focusedLine = view.state.field(focusedLineField);
          const codeBlocks = view.state.field(codeBlockField);

          if (focusedLine <= 0 || focusedLine > view.state.doc.lines)
            return builder.finish();

          const line = view.state.doc.line(focusedLine);
          let text = line.text;

          // Check for headings
          const headingMatch = text.match(/^(#{1,6})\s+(.*)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            builder.add(
              line.from,
              line.to,
              Decoration.mark({
                class: `editorHeading${level}`,
              }),
            );
          }

          // Check if this line is part of a code block
          const codeBlockInfo = codeBlocks[focusedLine];
          if (codeBlockInfo) {
            if (codeBlockInfo.isStart) {
              // Style for code block start - use existing header class
              builder.add(
                line.from,
                line.to,
                Decoration.mark({
                  class: "editorCodeLine",
                }),
              );
            } else if (codeBlockInfo.isEnd) {
              // Style for code block end - use the same class as code line
              builder.add(
                line.from,
                line.to,
                Decoration.mark({
                  class: "editorCodeLine",
                }),
              );
            } else {
              // Style for code block content - use existing code line class
              builder.add(
                line.from,
                line.to,
                Decoration.mark({
                  class: "editorCodeLine",
                }),
              );
            }
          }

          return builder.finish();
        }
      },
      {
        decorations: (v) => v.decorations,
      },
    );

    const markdownRenderPlugin = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
          if (
            update.docChanged ||
            update.viewportChanged ||
            update.selectionSet ||
            update.transactions.some((tr: Transaction) =>
              tr.effects.some(
                (e: StateEffect<unknown>) =>
                  e.is(focusLineEffect) || e.is(updateCodeBlocksEffect),
              ),
            )
          ) {
            this.decorations = this.buildDecorations(update.view);
          }
        }

        buildDecorations(view: EditorView): DecorationSet {
          const builder = new RangeSetBuilder<Decoration>();
          const focusedLine = view.state.field(focusedLineField);
          const doc = view.state.doc;
          const codeBlocks = view.state.field(codeBlockField);

          for (let i = 1; i <= doc.lines; i++) {
            const line = doc.line(i);
            const isEmptyLine = line.text.trim() === "";
            const codeBlockInfo = codeBlocks[i];
            const isInCodeBlock = codeBlockInfo !== undefined;

            // If we're inside a code block and it's either the start or end line,
            // don't hide it when the cursor is on any line of the code block
            if (isInCodeBlock) {
              // Get the currently focused block info
              const focusedBlockInfo = codeBlocks[focusedLine];
              const isFocusedInSameBlock =
                focusedBlockInfo &&
                focusedBlockInfo.language === codeBlockInfo.language;

              // If we're on a start or end line AND the cursor is somewhere in this code block,
              // skip rendering the markdown widget to let the raw backticks be visible
              if (
                (codeBlockInfo.isStart || codeBlockInfo.isEnd) &&
                isFocusedInSameBlock
              ) {
                continue;
              }
            }

            // Skip current line if it's focused (continue default behavior)
            if (i === focusedLine) continue;

            // Skip empty lines that aren't in code blocks
            if (isEmptyLine && !isInCodeBlock) continue;

            // Add decoration for non-focused lines as before
            const deco = Decoration.replace({
              widget: new MarkdownWidget(
                line.text,
                i,
                isInCodeBlock,
                isInCodeBlock && codeBlockInfo.isStart,
                isInCodeBlock && codeBlockInfo.isEnd,
                isInCodeBlock ? codeBlockInfo.language : "",
              ),
              inclusive: true,
            });

            builder.add(line.from, line.to, deco);
          }

          return builder.finish() as DecorationSet;
        }
      },
      {
        decorations: (v) => v.decorations,
      },
    );

    const myHighlightStyle = HighlightStyle.define([
      { tag: tags.processingInstruction, color: "#a86e89" },
    ]);

    const editorStyles = EditorView.theme({
      "&": {
        fontSize: "14px",
        outline: "none !important",
      },
      ".cm-content": {
        caretColor: "#a86e89 !important",
      },
      ".cm-content ::selection": {
        backgroundColor: "#a86e89 !important",
      },
      ".cm-gutters": {
        backgroundColor: "transparent",
        border: "none",
        width: "10px",
        minWidth: "10px",
        maxWidth: "10px",
      },
      ".cm-rendered-markdown": {
        userSelect: "text",
        cursor: "text",
        pointerEvents: "auto",
        display: "inline-block",
        width: "100%",
        lineHeight: "1.5em",
        overflow: "visible",
        verticalAlign: "top",
      },
      ".cm-rendered-code": {
        userSelect: "text",
        cursor: "text",
        pointerEvents: "auto",
        display: "inline-block",
        width: "100%",
        backgroundColor: "#261c41",
        fontFamily: "monospace",
        color: "#f1f1f1",
      },
      ".editorCodeLine": {
        fontFamily: "monospace",
        margin: "0",
        padding: "0 1rem",
        whiteSpace: "pre",
        color: "#f1f1f1",
        lineHeight: "1.5em",
        minHeight: "1.5em",
        width: "100%",
      },
      ".cm-line": {
        lineHeight: "1.5em",
        overflow: "visible",
      },
      ".editorBlockquote": {
        borderLeft: "3px solid #46206a",
        paddingLeft: "1rem",
        color: "#a0a0a0",
        fontStyle: "italic",
        display: "block",
      },
      ".editorHr": {
        borderTop: "1px solid #46206a",
        margin: "0", // No margin
        padding: "0", // No padding
        width: "100%",
        display: "inline-block", // This is key - match text flow
        height: "1px",
        lineHeight: "inherit", // Match the existing line height
        backgroundColor: "#46206a",
        border: "none",
        verticalAlign: "middle", // Align with text
      },
      ".editorLink": {
        color: "#cdb97c",
        textDecoration: "none",
        cursor: "pointer",
        position: "relative",
        zIndex: "10",
      },
      ".editorLink:hover": {
        textDecoration: "underline",
      },
      ".ͼ7": {
        textDecoration: "none !important",
      },
      ".editorCode": {
        backgroundColor: "#261c41",
        padding: "0 0.25rem",
        borderRadius: "0.25rem",
        fontFamily: "monospace",
        color: "#cdb97c",
      },
      ".editorHeading1": {
        fontSize: "1.875em",
        fontWeight: "bold",
        margin: "0.5em 0",
        paddingBottom: "0.5em",
        display: "inline-block",
        position: "relative",
        width: "100%",
      },
      ".editorHeading1::after": {
        content: "''",
        position: "absolute",
        left: "0",
        bottom: "0",
        height: "2px",
        width: "100%",
        backgroundColor: "#46206a",
      },
      ".editorHeading2": {
        fontSize: "1.5em",
        fontWeight: "bold",
        margin: "0.5em 0",
        display: "inline-block",
      },
      ".editorHeading3": {
        fontSize: "1.25em",
        fontWeight: "bold",
        margin: "0.5em 0",
        display: "inline-block",
      },
      ".editorHeading4": {
        fontSize: "1.125em",
        fontWeight: "bold",
        margin: "0.5em 0",
        display: "inline-block",
      },
      ".editorHeading5": {
        fontSize: "1em",
        fontWeight: "bold",
        margin: "0.5em 0",
        display: "inline-block",
      },
      ".editorHeading6": {
        fontSize: "0.875",
        fontWeight: "bold",
        margin: "0.25em 0",
        display: "inline-block",
        fontFamily: "monospace",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      },
    });

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }

      if (update.selectionSet) {
        const cursorPos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(cursorPos);

        if (update.view.state.field(focusedLineField) !== line.number) {
          update.view.dispatch({
            effects: focusLineEffect.of(line.number),
          });
        }
      }
    });

    const extensions = [
      markdown(),
      syntaxHighlighting(myHighlightStyle),
      customFoldingExtension,
      focusedLineField,
      codeBlockField,
      markdownRenderPlugin,
      rawEditorDecorator,
      updateListener,
      editorStyles,
      EditorView.lineWrapping,
      keymap.of([indentWithTab]),
    ];

    const view = new EditorView({
      state: EditorState.create({
        doc: initialValue,
        extensions,
      }),
      parent: editorRef.current,
    });

    editorViewRef.current = view;

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
      }
    };
  }, []);

  // Update content if initialValue changes from a parent component
  useEffect(() => {
    const view = editorViewRef.current;
    if (view && initialValue !== view.state.doc.toString()) {
      // First, analyze the new content for code blocks
      const codeBlocks = analyzeCodeBlocks(initialValue);

      // Then update both the document and code block state
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: initialValue,
        },
        effects: StateEffect.define<{
          [key: number]: { isStart: boolean; isEnd: boolean; language: string };
        }>().of(codeBlocks),
      });
    }
  }, [initialValue]);

  return <div className="markdownEditor" ref={editorRef} />;
};

export default MarkdownEditor;
