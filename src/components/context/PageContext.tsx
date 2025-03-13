import { createContext, useContext, useState, ReactNode } from "react";

type PageContextType = {
  activePage: string;
  setActivePage: (page: string) => void;
};

const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageProvider = ({ children }: { children: ReactNode }) => {
  const [activePage, setActivePage] = useState<string>("home");

  return (
    <PageContext.Provider value={{ activePage, setActivePage }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePage = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePage must be used within a PageProvider");
  }
  return context;
};
