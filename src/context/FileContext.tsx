import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface FileContextType {
  files: DirectoryContents;
  selectedFile: string | null;
  setSelectedFile: (path: string | null) => void;
  handleCreateNote: () => Promise<void>;
  handleCreateFolder: () => Promise<void>;
  loadNotes: () => Promise<DirectoryContents>;
  fileName: string | null;
  sortMethod: string;
  changeSortMethod: (method: SortMethod) => void;
  createOrOpenTodaysNote: () => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
  }, [selectedFile, sortMethod]);

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
  const value = {
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
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
};
