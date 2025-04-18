import { useState } from "react";

export const useNoteState = () => {
  const [inMindMap, setInMindMap] = useState<boolean>(false);

  const clickMindMap = () => {
    setInMindMap(true);
  };

  return {
    inMindMap,
    setInMindMap,
    clickMindMap,
  };
};
