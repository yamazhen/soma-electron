import React, { createContext, useContext } from "react";
import { useFileState } from "./fileState";
import { useNoteState } from "./noteState";
import { usePageState } from "./pageState";
import { useQuizState } from "./quizState";
import { useFlashCardState } from "./flashCardState";

type AppContextType = ReturnType<typeof useFileState> &
  ReturnType<typeof useNoteState> &
  ReturnType<typeof usePageState> &
  ReturnType<typeof useQuizState> &
  ReturnType<typeof useFlashCardState>;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const fileState = useFileState();
  const noteState = useNoteState();
  const pageState = usePageState();
  const quizState = useQuizState();
  const flashCardState = useFlashCardState();

  const value = {
    ...fileState,
    ...noteState,
    ...pageState,
    ...quizState,
    ...flashCardState,
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
