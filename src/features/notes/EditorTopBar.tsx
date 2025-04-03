import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  NotebookPen,
  NotebookText,
  Save,
} from "lucide-react";
import SideMenuButton from "../../components/ui/buttons/SideMenuButton";

type Props = {
  isSaving: boolean;
  isEditing: boolean;
  toggleEditing: () => void;
  fileName: string | null;
};

const EditorTopBar: React.FC<Props> = ({
  isSaving,
  isEditing,
  toggleEditing,
  fileName,
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
      <div id="filename" className="flex gap-2 items-center">
        <p>{fileName}</p>
        {isSaving && (
          <Save
            size={16}
            strokeWidth={1}
            className="animate-pulse text-soma-success"
          />
        )}
        <p>{isSaving}</p>
      </div>
      <div id="editorPreview" className="flex items-center gap-1">
        {isEditing ? (
          <SideMenuButton
            tippyContent="Edit"
            onClick={toggleEditing}
            tippyPlacement="bottom"
          >
            <NotebookText size={16} strokeWidth={2} />
          </SideMenuButton>
        ) : (
          <SideMenuButton
            tippyContent="Preview"
            onClick={toggleEditing}
            tippyPlacement="bottom"
          >
            <NotebookPen size={16} strokeWidth={2} />
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
