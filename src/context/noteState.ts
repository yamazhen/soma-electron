import { useState } from "react";

export const useNoteState = () => {
  const [noteView, setNoteView] = useState<"mindmap" | "note">("note");
  const [explorerExpanded, setExplorerExpanded] = useState(true);

  return {
    noteView,
    setNoteView,
    explorerExpanded,
    setExplorerExpanded,
  };
};
