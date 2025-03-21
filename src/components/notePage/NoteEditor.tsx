import React, { useEffect, useRef, useState } from "react";
import { useFileContext } from "../context/FileContext";
import ReactMarkdown from "react-markdown";

const NoteEditor: React.FC = () => {
  const { selectedFile } = useFileContext();
  const [noteContent, setNoteContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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
          setError("Could not load note content");
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
    if (!selectedFile || !noteContent || loading) return;
    const saveTimeout = setTimeout(async () => {
      try {
        setSaveStatus("Saving...");
        const success = await window.ipcRenderer.writeMarkdownFile(
          selectedFile,
          noteContent,
        );

        if (success) {
          setSaveStatus("Saved");
          setTimeout(() => setSaveStatus(""), 2000);
        } else {
          setSaveStatus("Failed to save");
        }
      } catch (error) {
        console.error("Error saving note:", error);
        setSaveStatus("Failed to save");
      }
    }, 500);
    return () => clearTimeout(saveTimeout);
  }, [noteContent, selectedFile, loading]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsEditing(true);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    setIsEditing(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(e.target.value);
    setSaveStatus("Unsaved changes");
  };

  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [isEditing]);

  // other statuses
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

  // main editor
  return (
    <div className="noteEditor">
      <p>{saveStatus}</p>
      {isEditing ? (
        <textarea
          ref={textAreaRef}
          value={noteContent}
          onChange={handleContentChange}
          onMouseLeave={handleMouseLeave}
          className="textEditor"
        />
      ) : (
        <>
          <div onMouseEnter={handleMouseEnter} className="max-w-prose">
            <ReactMarkdown>{noteContent}</ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
};

export default NoteEditor;
