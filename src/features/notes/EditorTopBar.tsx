import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Ellipsis,
  NotebookPen,
  NotebookText,
  Save,
  SquareAsterisk,
  WandSparkles,
} from "lucide-react";
import SideMenuButton from "../../components/ui/buttons/SideMenuButton";
import { useAppContext } from "../../context/AppContext";

type Props = {
  isSaving: boolean;
  isEditing: boolean;
  toggleEditing: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

const generateDropdownItems = [
  {
    items: [
      {
        label: "Generate Quiz Set",
        onClick: () => console.log("Generate Quiz Set"),
        icon: <ClipboardList size={16} strokeWidth={1} />,
      },
      {
        label: "Generate Flashcards",
        onClick: () => console.log("Generate Flashcards"),
        icon: <SquareAsterisk size={16} strokeWidth={1} />,
      },
    ],
  },
];

const EditorTopBar: React.FC<Props> = ({
  isSaving,
  isEditing,
  toggleEditing,
  onUndo,
  onRedo,
}) => {
  const { fileName } = useAppContext();
  return (
    <div
      id="editorTopBar"
      className="flex justify-between items-center py-2 px-4"
    >
      <div id="undoWindow" className="flex gap-3">
        <SideMenuButton
          tippyPlacement="bottom"
          tippyContent="Undo"
          onClick={onUndo}
        >
          <ArrowLeft size={16} strokeWidth={1} />
        </SideMenuButton>
        <SideMenuButton
          tippyPlacement="bottom"
          tippyContent="Redo"
          onClick={onRedo}
        >
          <ArrowRight size={16} strokeWidth={1} />
        </SideMenuButton>
      </div>
      <div id="filename" className="flex gap-2 items-center">
        <p>{fileName}</p>
        <Save
          size={16}
          strokeWidth={2}
          className={`text-soma-lightest transition-opacity duration-100 ${
            isSaving ? "opacity-100 animate-pulse" : "opacity-0"
          }`}
        />
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
        <SideMenuButton
          tippyContent="Generate Content"
          tippyPlacement="bottom"
          dropdownItems={generateDropdownItems}
        >
          <WandSparkles size={16} strokeWidth={2} />
        </SideMenuButton>
        <SideMenuButton tippyContent="More" tippyPlacement="bottom">
          <Ellipsis size={16} strokeWidth={2} />
        </SideMenuButton>
      </div>
    </div>
  );
};

export default EditorTopBar;
