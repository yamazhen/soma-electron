import React, { useEffect, useRef, useState } from "react";
import { useFileContext } from "../context/FileContext";
import MarkdownIt from "markdown-it";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import {
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  NotebookPen,
  NotebookText,
} from "lucide-react";
import SideMenuButton from "../ui/SideMenuButton";

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
  const md = useRef(
    new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    }),
  );

  useEffect(() => {
    async function loadNoteContent() {
      if (!selectedFile) {
        setNoteContent("");
        contentRef.current = "";
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await window.ipcRenderer.readMarkdownFile(selectedFile);

        if (result && result.content) {
          setNoteContent(result.content);
          contentRef.current = result.content;
        } else {
          setNoteContent("");
          contentRef.current = "";
          setError("Could not load note content");
        }
      } catch (error) {
        console.error("Error loading note content:", error);
        setError("Failed to load note content");
        setNoteContent("");
        contentRef.current = "";
      } finally {
        setLoading(false);
      }
    }

    loadNoteContent();
    setIsEditing(false);
  }, [selectedFile]);

  // Always keep markdown preview updated
  useEffect(() => {
    if (markdownRef.current) {
      markdownRef.current.innerHTML = md.current.render(noteContent);
    }
  }, [noteContent]);

  // Setup autosave
  useEffect(() => {
    const saveContent = async () => {
      if (!selectedFile || !contentRef.current || loading) return;

      try {
        setSaveStatus("Saving...");
        const success = await window.ipcRenderer.writeMarkdownFile(
          selectedFile,
          contentRef.current,
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
    };

    // Set up periodic saving
    const interval = setInterval(saveContent, 2000);

    return () => clearInterval(interval);
  }, [selectedFile, loading]);

  // Initialize CodeMirror once
  useEffect(() => {
    if (editorRef.current && !editorViewRef.current) {
      const state = EditorState.create({
        doc: noteContent,
        extensions: [
          basicSetup,
          markdown(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              // Update the ref without re-rendering
              contentRef.current = update.state.doc.toString();
              // Only update React state occasionally to avoid focus issues
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
              }
              saveTimeoutRef.current = setTimeout(() => {
                setNoteContent(contentRef.current);
                setSaveStatus("Unsaved changes");
              }, 1000); // Update React state less frequently
            }
          }),
        ],
      });

      const view = new EditorView({
        state,
        parent: editorRef.current,
      });

      editorViewRef.current = view;
    }

    // Update editor content only when loading a new file
    if (
      editorViewRef.current &&
      selectedFile &&
      noteContent !== contentRef.current
    ) {
      contentRef.current = noteContent;

      const state = EditorState.create({
        doc: noteContent,
        extensions: [
          basicSetup,
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

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedFile, noteContent]);

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

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

  return (
    <div className="noteEditor">
      <div
        id="topbuttonfunc"
        className="flex justify-between items-center py-2 px-4"
      >
        <div id="leftrightarrow" className="flex gap-3">
          <ArrowLeft size={16} strokeWidth={1} />
          <ArrowRight size={16} strokeWidth={1} />
        </div>
        <div id="filename" className="flex">
          <p>{selectedFile}</p>
          <p>{saveStatus}</p>
        </div>
        <div id="editorpreview" className="flex items-center gap-1">
          {isEditing ? (
            <SideMenuButton
              tippyContent="Preview"
              onClick={toggleEditMode}
              tippyPlacement="bottom"
            >
              <NotebookPen size={16} strokeWidth={2} />
            </SideMenuButton>
          ) : (
            <SideMenuButton
              tippyContent="Edit"
              onClick={toggleEditMode}
              tippyPlacement="bottom"
            >
              <NotebookText size={16} strokeWidth={2} />
            </SideMenuButton>
          )}
          <SideMenuButton tippyContent="More" tippyPlacement="bottom">
            <Ellipsis size={16} strokeWidth={2} />
          </SideMenuButton>
        </div>
      </div>
      <div
        ref={editorRef}
        className={`textEditor ${isEditing ? "visible" : "hidden"}`}
      />
      <div
        ref={markdownRef}
        className={`textEditor ${isEditing ? "hidden" : "visible"}`}
        onClick={toggleEditMode}
      ></div>
    </div>
  );
};

export default NoteEditor;
