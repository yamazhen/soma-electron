import { useCallback, useEffect, useState } from "react";

export const useFileState = (onFileSelected?: (filePath: string) => void) => {
  const [files, setFiles] = useState<DirectoryContents>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [sortMethod, setSortMethod] = useState<SortMethod>("custom");

  const fileName = selectedFile
    ? selectedFile
        .split("/")
        .pop()
        ?.replace(/\.[^/.]+$/, "") || null
    : null;

  // function to change file sorting method
  const changeSortMethod = (method: SortMethod) => {
    setSortMethod(method);
    loadNotes();
  };

  const handleOpen = useCallback(
    (filePath: string) => {
      setSelectedFile(filePath);
      onFileSelected?.(filePath);
    },
    [setSelectedFile, onFileSelected],
  );

  // listening to open note requests from search window
  useEffect(() => {
    window.ipcRenderer.onSearchOpenNote(handleOpen);
    return () => {
      window.ipcRenderer.offSearchOpenNote(handleOpen);
    };
  }, [handleOpen]);

  // function to check if the file still exists
  const fileExists = (notes: DirectoryContents, filePath: string): boolean => {
    for (const item of notes) {
      if (item.path === filePath) {
        return true;
      }
      if (item.isDirectory) {
        if (fileExists(item.children, filePath)) {
          return true;
        }
      }
    }
    return false;
  };

  // function to load notes without checking (for rename)
  const loadNotesWithoutCheck = useCallback(async () => {
    try {
      const loadedFiles = await window.ipcRenderer.loadExistingNotes(
        sortMethod,
        true,
      );
      setFiles(loadedFiles);
      return loadedFiles;
    } catch (error) {
      return [];
    }
  }, [selectedFile, sortMethod]);

  // function to load notes
  const loadNotes = useCallback(async () => {
    try {
      const loadedFiles = await window.ipcRenderer.loadExistingNotes(
        sortMethod,
        true,
      );
      setFiles(loadedFiles);
      if (selectedFile) {
        const stillExists = fileExists(loadedFiles, selectedFile);
        if (!stillExists) {
          setSelectedFile(null);
        }
      }
      return loadedFiles;
    } catch (error) {
      return [];
    }
  }, [sortMethod]);

  const createOrOpenTodaysNote = async () => {
    const today = new Date();
    const options = {
      day: "numeric" as const,
      month: "long" as const,
      year: "numeric" as const,
    };
    const dateString = today.toLocaleDateString("en-US", options);
    const existingFile = files.find(
      (file) => !file.isDirectory && file.name === dateString,
    );
    if (existingFile) {
      setSelectedFile(existingFile.path);
    } else {
      await handleCreateNote(dateString);
    }
  };

  // function to create a new note
  const handleCreateNote = async (customFileName?: string) => {
    try {
      const result =
        await window.ipcRenderer.createMarkdownFile(customFileName);
      if (result) {
        await loadNotes();
        setSelectedFile(result.path);
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const getAllNotesOnly = (): MarkdownItem[] => {
    const flatten = (items: DirectoryContents): MarkdownItem[] => {
      const result: MarkdownItem[] = [];
      for (const item of items) {
        if (item.isDirectory && item.children) {
          result.push(...flatten(item.children));
        } else {
          result.push(item as MarkdownItem);
        }
      }
      return result;
    };

    return flatten(files);
  };

  // function to create a new folder
  const handleCreateFolder = async () => {
    try {
      const result = await window.ipcRenderer.createFolder();
      if (result) {
        await loadNotes();
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  // initial note load and file system change listener
  useEffect(() => {
    loadNotes();

    const unsubscribe = window.ipcRenderer.onFileSystemChanged(loadNotes);
    return () => {
      unsubscribe();
    };
  }, [loadNotes]);

  // the context value
  return {
    files,
    selectedFile,
    setSelectedFile,
    handleCreateNote,
    handleCreateFolder,
    loadNotes,
    fileName,
    sortMethod,
    changeSortMethod,
    createOrOpenTodaysNote,
    loadNotesWithoutCheck,
    getAllNotesOnly,
  };
};
