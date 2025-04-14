import { useState } from "react";

export const useNoteState = () => {
  const [inMindMap, setInMindMap] = useState<boolean>(false);

  const toggleMindMap = () => {
    setInMindMap((prev) => !prev);
    console.log(`MindMap toggled: ${!inMindMap}`);
  };

  return {
    inMindMap,
    setInMindMap,
    toggleMindMap,
  };
};
