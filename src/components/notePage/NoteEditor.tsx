import React, { useEffect, useRef, useState } from "react";
import { useFileContext } from "../context/FileContext";
import { EditorView } from "codemirror";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import EditorTopBar from "./EditorTopBar";
import { createEditorSetup } from "../../utils/editorConfig";
import { useMarkdownRenderer } from "../../hooks/useMarkdownRenderer";
import { useNoteAutosave } from "../../hooks/useNoteAutosave";

const NoteEditor: React.FC = () => {
  const { selectedFile } = useFileContext();
  const [noteContent, setNoteContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const markdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<string>("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { renderMarkdown } = useMarkdownRenderer();
  const customSetup = createEditorSetup();

  useNoteAutosave({
    selectedFile,
    noteContent,
    loading,
    setSaveStatus,
  });

  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
  };

  useEffect(() => {
    if (isEditing && editorRef.current) {
      if (!editorViewRef.current) {
        const state = EditorState.create({
          doc: noteContent,
          extensions: [
            customSetup,
            markdown(),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                contentRef.current = update.state.doc.toString();
                if (saveTimeoutRef.current) {
                  clearTimeout(saveTimeoutRef.current);
                }
                saveTimeoutRef.current = setTimeout(() => {
                  setNoteContent(contentRef.current);
                  setSaveStatus("Unsaved changes");
                }, 1000);
              }
            }),
          ],
        });

        editorViewRef.current = new EditorView({
          state,
          parent: editorRef.current,
        });
      }
    } else if (!isEditing && editorViewRef.current) {
      contentRef.current = editorViewRef.current.state.doc.toString();
      setNoteContent(contentRef.current);

      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isEditing]);

  useEffect(() => {
    if (editorViewRef.current && selectedFile) {
      const currentDoc = editorViewRef.current.state.doc.toString();

      if (noteContent !== currentDoc && noteContent !== contentRef.current) {
        const state = EditorState.create({
          doc: noteContent,
          extensions: [
            customSetup,
            markdown(),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                contentRef.current = update.state.doc.toString();
                if (saveTimeoutRef.current) {
                  clearTimeout(saveTimeoutRef.current);
                }
                saveTimeoutRef.current = setTimeout(() => {
                  setNoteContent(contentRef.current);
                  setSaveStatus("Unsaved changes");
                }, 1000);
              }
            }),
          ],
        });

        editorViewRef.current.setState(state);
      }
    }
  }, [selectedFile, noteContent]);

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
      <div
        ref={editorRef}
        className={`textEditor ${isEditing ? "visible" : "hidden"}`}
      />
      <div
        ref={markdownRef}
        className={`textEditor ${isEditing ? "hidden" : "visible"}`}
        onClick={toggleEditing}
      ></div>
    </div>
  );
};

export default NoteEditor;
