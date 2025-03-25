import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import { Markdown } from "tiptap-markdown";

type Props = {
  noteContent: string;
  onChange: (newContent: string) => void;
  className?: string;
};

const extensions = [
  StarterKit,
  Markdown.configure({
    html: true,
    transformPastedText: true,
  }),
];

const TiptapEditor: React.FC<Props> = ({
  noteContent,
  onChange,
  className,
}) => {
  const editor = useEditor({
    content: noteContent,
    extensions: extensions,
    editorProps: {
      transformPastedText: (text) => text,
      handleKeyDown: (view, event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          if (event.shiftKey) {
            return true;
          } else {
            view.dispatch(view.state.tr.insertText("  "));
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const markdownOutput = editor.storage.markdown.getMarkdown();
      onChange(markdownOutput);
    },
  });

  return <EditorContent editor={editor} className={className} />;
};

export default TiptapEditor;
