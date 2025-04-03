import { useEffect } from "react";

interface Props {
  selectedFile: string | null;
  noteContent: string;
  loading: boolean;
  setIsSaving: (saving: boolean) => void;
}

export const useNoteAutosave = ({
  selectedFile,
  noteContent,
  loading,
  setIsSaving,
}: Props) => {
  useEffect(() => {
    if (!selectedFile || !noteContent || loading) return;

    const saveTimeout = setTimeout(async () => {
      try {
        const success = await window.ipcRenderer.writeMarkdownFile(
          selectedFile,
          noteContent,
        );

        if (success) {
          setIsSaving(true);
          setTimeout(() => setIsSaving(false), 1000);
        } else {
          setIsSaving(false);
        }
      } catch (error) {
        setIsSaving(false);
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [noteContent, selectedFile, loading, setIsSaving]);
};
