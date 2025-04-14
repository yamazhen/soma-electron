import { useState } from "react";

export const usePageState = () => {
  const [activePage, setActivePage] = useState<string>("home");

  return {
    activePage,
    setActivePage,
  };
};
