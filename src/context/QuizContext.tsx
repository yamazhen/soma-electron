import React, { createContext, useContext } from 'react'

const QuizContext = createContext(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
})

export const useQuizContext = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuizContext must be used within an AppProvider");
  }
  return context;
}
