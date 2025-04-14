import React, { createContext, useContext } from "react";
import { useFileState } from "./fileState";
import { useNoteState } from "./noteState";
import { usePageState } from "./pageState";

type AppContextType = ReturnType<typeof useFileState> &
  ReturnType<typeof useNoteState> &
  ReturnType<typeof usePageState>;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const fileState = useFileState();
  const noteState = useNoteState();
  const pageState = usePageState();

  const value = {
    ...fileState,
    ...noteState,
    ...pageState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
