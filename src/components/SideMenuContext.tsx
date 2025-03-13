import React, { createContext, useContext, useState, ReactNode } from "react";

type SideMenuContextType = {
  explorerExpanded: boolean;
  toggleExplorer: () => void;
  setExplorerExpanded: (expanded: boolean) => void;
};

const SideMenuContext = createContext<SideMenuContextType | undefined>(
  undefined,
);

export const SideMenuProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [explorerExpanded, setExplorerExpanded] = useState(true);

  const toggleExplorer = () => {
    setExplorerExpanded((prev) => !prev);
  };

  return (
    <SideMenuContext.Provider
      value={{
        explorerExpanded,
        toggleExplorer,
        setExplorerExpanded,
      }}
    >
      {children}
    </SideMenuContext.Provider>
  );
};

export const useSideMenu = (): SideMenuContextType => {
  const context = useContext(SideMenuContext);
  if (context === undefined) {
    throw new Error("useSideMenu must be used within a SideMenuProvider");
  }
  return context;
};
