import React from "react";
import SideMenuButton from "../ui/SideMenuButton";
import {
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  NotebookPen,
  NotebookText,
} from "lucide-react";

type Props = {
  selectedFile: string;
  saveStatus: string;
  isEditing: boolean;
  toggleEditing: () => void;
};

const EditorTopBar: React.FC<Props> = ({
  selectedFile,
  saveStatus,
  isEditing,
  toggleEditing,
}) => {
  return (
    <div
      id="editorTopBar"
      className="flex justify-between items-center py-2 px-4"
    >
      <div id="undoWindow" className="flex gap-3">
        <ArrowLeft size={16} strokeWidth={1} />
        <ArrowRight size={16} strokeWidth={1} />
      </div>
      <div id="filename" className="flex">
        <p>{selectedFile}</p>
        <p>{saveStatus}</p>
      </div>
      <div id="editorPreview" className="flex items-center gap-1">
        {isEditing ? (
          <SideMenuButton
            tippyContent="Preview"
            onClick={toggleEditing}
            tippyPlacement="bottom"
          >
            <NotebookPen size={16} strokeWidth={2} />
          </SideMenuButton>
        ) : (
          <SideMenuButton
            tippyContent="Edit"
            onClick={toggleEditing}
            tippyPlacement="bottom"
          >
            <NotebookText size={16} strokeWidth={2} />
          </SideMenuButton>
        )}
        <SideMenuButton tippyContent="More" tippyPlacement="bottom">
          <Ellipsis size={16} strokeWidth={2} />
        </SideMenuButton>
      </div>
    </div>
  );
};

export default EditorTopBar;
