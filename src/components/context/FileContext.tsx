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
  loadNotes: () => Promise<void>;
  setSelectedFile: (path: string | null) => void;
  handleCreateNote: () => Promise<void>;
  handleCreateFolder: () => Promise<void>;
  refreshFiles: () => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [files, setFiles] = useState<DirectoryContents>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const loadedFiles = await window.ipcRenderer.loadExistingNotes();
      setFiles(loadedFiles);
      return loadedFiles;
    } catch (error) {
      return [];
    }
  }, []);

  useEffect(() => {
    refreshFiles();
    const unsubscribe = window.ipcRenderer.onFileSystemChanged(refreshFiles);
    return () => {
      unsubscribe();
    };
  }, [refreshFiles]);

  const findFileInNotes = (
    notes: DirectoryContents,
    filePath: string,
  ): boolean => {
    for (const item of notes) {
      if (item.path === filePath) {
        return true;
      }
      if (item.isDirectory) {
        if (findFileInNotes(item.children, filePath)) {
          return true;
        }
      }
    }
    return false;
  };

  const loadNotes = async () => {
    try {
      const notes = await window.ipcRenderer.loadExistingNotes();
      setFiles(notes);
      if (selectedFile) {
        const stillExists = findFileInNotes(notes, selectedFile);
        if (!stillExists) {
          setSelectedFile(null);
        }
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const handleCreateNote = async () => {
    try {
      const result = await window.ipcRenderer.createMarkdownFile();
      if (result) {
        await loadNotes();
        setSelectedFile(result.path);
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

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

  // Load notes on initial render
  useEffect(() => {
    loadNotes();
  }, []);

  // Set up file system change listener
  useEffect(() => {
    const removeListener = window.ipcRenderer.onFileSystemChanged(() => {
      loadNotes();
    });

    return () => {
      removeListener();
    };
  }, [selectedFile]);

  // The context value
  const value = {
    files,
    selectedFile,
    setSelectedFile,
    loadNotes,
    handleCreateNote,
    handleCreateFolder,
    refreshFiles,
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};

// Custom hook to use the file context
export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
};
