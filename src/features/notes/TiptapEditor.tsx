import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, {
  useEffect,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
} from "react";
import { Markdown } from "tiptap-markdown";

type Props = {
  noteContent: string;
  onChange: (newContent: string) => void;
  className?: string;
};

const extensions = [
  StarterKit.configure({
    bulletList: false,
  }),
  Markdown.configure({
    bulletListMarker: "-",
    html: true,
    breaks: true,
    linkify: true,
    transformPastedText: true,
    transformCopiedText: true,
  }),
];

const TiptapEditorComponent: ForwardRefRenderFunction<
  TiptapEditorRef,
  Props
> = ({ noteContent, onChange, className }, ref: React.Ref<TiptapEditorRef>) => {
  const editor = useEditor({
    content: noteContent,
    extensions: extensions,
    onUpdate: ({ editor }) => {
      const markdownOutput = editor.storage.markdown.getMarkdown();
      onChange(markdownOutput);
    },
  });

  useImperativeHandle(ref, () => ({
    undo: () => editor?.commands.undo(),
    redo: () => editor?.commands.redo(),
  }));

  useEffect(() => {
    if (editor && noteContent) {
      const currentContent = editor.storage.markdown.getMarkdown();
      if (currentContent !== noteContent) {
        editor.commands.setContent(noteContent);
      }
    }
  }, [noteContent, editor]);

  return (
    <>
      <EditorContent editor={editor} className={className} />
    </>
  );
};

const TiptapEditor = forwardRef(TiptapEditorComponent);
export default TiptapEditor;
