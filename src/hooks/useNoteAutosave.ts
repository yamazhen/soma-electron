import { useEffect } from "react";

interface Props {
  selectedFile: string | null;
  noteContent: string;
  loading: boolean;
  setSaveStatus: (status: string) => void;
}

export const useNoteAutosave = ({
  selectedFile,
  noteContent,
  loading,
  setSaveStatus,
}: Props) => {
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
        setSaveStatus("Failed to save");
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [noteContent, selectedFile, loading, setSaveStatus]);
};
