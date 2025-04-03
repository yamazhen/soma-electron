import React, { createContext, useContext, useState } from "react";

interface NoteContextType {
  inMindMap: boolean;
  setInMindMap: (value: boolean) => void;
  toggleMindMap: () => void;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [inMindMap, setInMindMap] = useState<boolean>(false);

  const toggleMindMap = () => {
    setInMindMap((prev) => !prev);
    console.log(`MindMap toggled: ${!inMindMap}`);
  };

  const value = {
    inMindMap,
    setInMindMap,
    toggleMindMap,
  };

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
};

export const useNoteContext = (): NoteContextType => {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error("useNoteContext must be used within a NoteProvider");
  }
  return context;
};
