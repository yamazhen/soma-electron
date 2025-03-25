import React, { useEffect, useRef, useState } from "react";
import { useFileContext } from "../context/FileContext";
import EditorTopBar from "./EditorTopBar";
import { useMarkdownRenderer } from "../../hooks/useMarkdownRenderer";
import { useNoteAutosave } from "../../hooks/useNoteAutosave";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import TiptapEditor from "./TiptapEditor";

const NoteEditor: React.FC = () => {
  const { selectedFile } = useFileContext();
  const [noteContent, setNoteContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const markdownRef = useRef<HTMLDivElement>(null);

  const { renderMarkdown } = useMarkdownRenderer();

  useNoteAutosave({
    selectedFile,
    noteContent,
    loading,
    setSaveStatus,
  });

  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
  };

  const handleContentChange = (newContent: string) => {
    setNoteContent(newContent);
    setSaveStatus("Saving...");
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
          console.log("Loaded note content:", result.content);
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
    setIsEditing(false);
  }, [selectedFile]);

  useEffect(() => {
    if (markdownRef.current && !isEditing) {
      renderMarkdown(markdownRef, noteContent);
    }
  }, [noteContent, isEditing, renderMarkdown]);

  if (!selectedFile) return null;
  if (loading) {
    return (
      <div className="noteEditor">
        <p>Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="noteEditor">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="noteEditor">
      <EditorTopBar
        selectedFile={selectedFile}
        saveStatus={saveStatus}
        isEditing={isEditing}
        toggleEditing={toggleEditing}
      />
      <SimpleBar className="editorArea" autoHide={false} scrollbarMaxSize={200}>
        <TiptapEditor
          noteContent={noteContent}
          onChange={handleContentChange}
          className={`textEditor ${isEditing ? "visible" : "hidden"}`}
        />
        <div
          ref={markdownRef}
          className={`textEditor cursor-text ${isEditing ? "hidden" : "visible"}`}
        ></div>
      </SimpleBar>
    </div>
  );
};

export default NoteEditor;
