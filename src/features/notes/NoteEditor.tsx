import React, { useEffect, useRef, useState } from "react";
import EditorTopBar from "./EditorTopBar";
import TiptapEditor from "./TiptapEditor";
import { useFileContext } from "../../context/FileContext";
import { useMarkdownRenderer } from "../../hooks/ui/useMarkdownRenderer";
import { useNoteAutosave } from "../../hooks/notes/useNoteAutosave";

const NoteEditor: React.FC = () => {
  const { selectedFile, fileName } = useFileContext();
  const [noteContent, setNoteContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(true);

  const markdownRef = useRef<HTMLDivElement>(null);

  const { renderMarkdown } = useMarkdownRenderer();

  useNoteAutosave({
    selectedFile,
    noteContent,
    loading,
    setIsSaving,
  });

  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
  };

  const handleContentChange = (newContent: string) => {
    setNoteContent(newContent);
    setIsSaving(true);
  };

  useEffect(() => {
    async function loadNoteContent() {
      if (!selectedFile) {
        setNoteContent("");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await window.ipcRenderer.readMarkdownFile(selectedFile);

        if (result && result.content) {
          setNoteContent(result.content);
        } else {
          setNoteContent("");
        }
      } catch (error) {
        console.error("Error loading note content:", error);
        setError("Failed to load note content");
        setNoteContent("");
      } finally {
        setLoading(false);
      }
    }

    loadNoteContent();
    setIsEditing(true);
  }, [selectedFile]);

  useEffect(() => {
    if (markdownRef.current && !isEditing) {
      renderMarkdown(markdownRef, noteContent);
    }
  }, [noteContent, isEditing, renderMarkdown]);

  if (!selectedFile) return null;
  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="noteEditor">
      <EditorTopBar
        isEditing={isEditing}
        toggleEditing={toggleEditing}
        isSaving={isSaving}
        fileName={fileName}
      />
      <div className="editorArea">
        <TiptapEditor
          noteContent={noteContent}
          onChange={handleContentChange}
          className="textEditor"
        />
        <div
          ref={markdownRef}
          className={`textEditor cursor-text ${isEditing ? "hidden" : "visible"}`}
        ></div>
      </div>
    </div>
  );
};

export default NoteEditor;
