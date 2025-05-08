import React, { createContext, useContext } from "react";
import { useFileState } from "./fileState";
import { useNoteState } from "./noteState";
import { usePageState } from "./pageState";
import { useQuizState } from "./quizState";
import { useFlashCardState } from "./flashCardState";
import { useLanguageState } from "./languageState";
import { useSettingState } from "./settingsState";

type AppContextType = ReturnType<typeof useFileState> &
  ReturnType<typeof useNoteState> &
  ReturnType<typeof usePageState> &
  ReturnType<typeof useQuizState> &
  ReturnType<typeof useFlashCardState> &
  ReturnType<typeof useLanguageState> &
  ReturnType<typeof useSettingState>;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const fileState = useFileState();
  const noteState = useNoteState();
  const pageState = usePageState();
  const quizState = useQuizState();
  const flashCardState = useFlashCardState();
  const languageState = useLanguageState();
  const settingState = useSettingState();

  const value = {
    ...fileState,
    ...noteState,
    ...pageState,
    ...quizState,
    ...flashCardState,
    ...languageState,
    ...settingState,
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
