import { useState } from "react";

export const useNoteState = () => {
  const [inMindMap, setInMindMap] = useState<boolean>(false);

  return {
    inMindMap,
    setInMindMap,
  };
};
