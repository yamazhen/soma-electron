import React, { useEffect, useRef, useState } from "react";
import EditorTopBar from "./EditorTopBar";
import { useNoteAutosave } from "../../hooks/notes/useNoteAutosave";
import { useAppContext } from "../../context/AppContext";
import MarkdownEditor, { MarkdownEditorRef } from "./MarkdownEditor";
import MarkdownViewer from "./MarkdownViewer";

const NoteEditor: React.FC = () => {
  const { selectedFile, files } = useAppContext();
  const [noteContent, setNoteContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const editorRef = useRef<MarkdownEditorRef>(null);

  useNoteAutosave({
    selectedFile,
    noteContent,
    loading,
    setIsSaving,
  });

  const handleUndo = () => {
    if (editorRef.current && isEditing) {
      editorRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (editorRef.current && isEditing) {
      editorRef.current.redo();
    }
  };

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
        if (files.length === 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

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
  }, [selectedFile, files.length]);

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
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <div className="editorArea">
        {isEditing ? (
          <MarkdownEditor
            initialValue={noteContent}
            onChange={handleContentChange}
            ref={editorRef}
          />
        ) : (
          <MarkdownViewer content={noteContent} />
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
