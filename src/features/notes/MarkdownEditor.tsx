import {
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { languages } from "@codemirror/language-data";
import {
  EditorView,
  keymap,
  drawSelection,
  rectangularSelection,
} from "@codemirror/view";
import { EditorState, StateEffect } from "@codemirror/state";
import {
  indentWithTab,
  history,
  historyKeymap,
  undo,
  redo,
} from "@codemirror/commands";
import { indentOnInput, foldKeymap, indentUnit } from "@codemirror/language";
import { Table } from "@lezer/markdown";
import richEditor from "./editor/codemirrorMarkdownExtension";
import markdocConfig from "./markdoc";
import { customFoldingExtension } from "./CustomFoldingExtension";

interface EditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export interface MarkdownEditorRef {
  undo: () => void;
  redo: () => void;
}

const MarkdownEditorComponent: ForwardRefRenderFunction<
  MarkdownEditorRef,
  EditorProps
> = ({ initialValue = "", onChange = () => {} }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (viewRef.current) {
        undo(viewRef.current);
      }
    },
    redo: () => {
      if (viewRef.current) {
        redo(viewRef.current);
      }
    },
  }));

  const extensions = [
    richEditor({
      markdoc: markdocConfig,
      lezer: { codeLanguages: languages, extensions: [Table] },
    }),
    drawSelection(),
    rectangularSelection(),
    history(),
    indentOnInput(),
    indentUnit.of("   "),
    customFoldingExtension,
    keymap.of([indentWithTab, ...historyKeymap, ...foldKeymap]),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    }),
  ];

  useEffect(() => {
    if (!editorRef.current) return;
    const startState = EditorState.create({
      doc: initialValue,
      extensions: extensions,
    });
    viewRef.current = new EditorView({
      state: startState,
      parent: editorRef.current,
    });
    return () => viewRef.current?.destroy();
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (initialValue !== current) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: initialValue,
        },
      });
    }
  }, [initialValue]);

  useEffect(() => {
    const view = viewRef.current;
    const listener = EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange(update.state.doc.toString());
    });
    view?.dispatch({ effects: StateEffect.appendConfig.of([listener]) });
  }, [onChange]);

  return <div ref={editorRef} className="cursor-text pb-6" />;
};

const MarkdownEditor = forwardRef(MarkdownEditorComponent);
export default MarkdownEditor;
