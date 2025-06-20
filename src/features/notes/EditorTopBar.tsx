import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  SquareAsterisk,
  WandSparkles,
  MoreVertical,
  Eye,
  Edit3,
} from "lucide-react";
import SideMenuButton from "../../components/ui/buttons/Button";
import { useAppContext } from "../../context/AppContext";
import { toast } from "sonner";

type Props = {
  isEditing: boolean;
  toggleEditing: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  noteContent: string;
};

const EditorTopBar: React.FC<Props> = ({
  isEditing,
  toggleEditing,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  noteContent,
}) => {
  const {
    fileName,
    setActivePage,
    fetchQuizzes,
    fetchDecks,
    setQuizView,
    setCardView,
    loggedIn,
  } = useAppContext();

  const generateDropdownItems = [
    {
      items: [
        {
          label: "Generate Quiz Set",
          disabled: !loggedIn,
          onClick: async () => {
            toast.info("Generating quiz set...");
            const res: IpcResponseData<{ isExisting: boolean }> =
              await window.quizIpc.generateQuizFromNote(noteContent);
            if (res.success) {
              setActivePage("quiz");
              setQuizView("listing");
              fetchQuizzes();

              if (res.data?.isExisting) {
                toast.success("New question added to existing quiz");
              } else {
                toast.success("Flashcards generated successfully");
              }
            } else {
              toast.error("Error generating quiz set");
            }
          },
          icon: <ClipboardList size={16} strokeWidth={1.5} />,
        },
        {
          label: "Generate Flashcards",
          disabled: !loggedIn,
          onClick: async () => {
            toast.info("Generating flashcards...");
            const res: IpcResponseData<{ isExisting: boolean }> =
              await window.deckIpc.generateDeckFromNote(noteContent);
            if (res.success) {
              setActivePage("flashcard");
              setCardView("listing");
              fetchDecks();

              if (res.data?.isExisting) {
                toast.success("New card added to existing deck");
              } else {
                toast.success("Flashcards generated successfully");
              }
            } else {
              toast.error("Error generating flashcards");
            }
          },
          icon: <SquareAsterisk size={16} strokeWidth={1.5} />,
        },
      ],
    },
  ];

  return (
    <header className=" border-b border-soma-light/10 bg-soma-dark/50">
      <div className="h-14 px-6 flex items-center justify-between">
        {/* Left section - Undo/Redo */}
        <div className="flex items-center gap-5">
          <div className="flex items-center rounded-lg bg-soma-darkest/50 p-1 gap-1">
            <button
              onClick={onUndo}
              className="px-3 py-1.5 rounded-md hover:bg-soma-light/10 text-soma-text-secondary hover:text-soma-text-primary transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-soma-text-secondary"
              title="Undo"
              disabled={!canUndo || !isEditing}
            >
              <ArrowLeft size={16} strokeWidth={2} />
            </button>
            <div className="w-px h-4 bg-soma-light/20" />
            <button
              onClick={onRedo}
              disabled={!canRedo || !isEditing}
              className="px-3 py-1.5 rounded-md hover:bg-soma-light/10 text-soma-text-secondary hover:text-soma-text-primary transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-soma-text-secondary"
              title="Redo"
            >
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
          <h1 className="hidden lg:block text-base font-medium text-soma-text-primary">
            {fileName || "Untitled Document"}
          </h1>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-soma-darkest/50 p-1">
            <button
              onClick={toggleEditing}
              className={`
                px-4 py-1.5 rounded-md transition-all font-medium text-sm
                ${
                  isEditing
                    ? "bg-soma-accent1 text-white"
                    : "hover:bg-soma-light/10 text-soma-text-secondary"
                }
              `}
            >
              <span className="flex items-center gap-2">
                <Edit3 size={14} />
                Edit
              </span>
            </button>
            <button
              onClick={toggleEditing}
              className={`
                px-4 py-1.5 rounded-md transition-all font-medium text-sm
                ${
                  !isEditing
                    ? "bg-soma-accent1 text-white"
                    : "hover:bg-soma-light/10 text-soma-text-secondary"
                }
              `}
            >
              <span className="flex items-center gap-2">
                <Eye size={14} />
                Preview
              </span>
            </button>
          </div>

          <div className="w-px h-6 bg-soma-light/20" />

          <SideMenuButton
            tippyContent="Generate with AI"
            tippyPlacement="bottom"
            dropdownItems={generateDropdownItems}
            className="p-2 rounded-lg hover:bg-soma-light/10 text-soma-text-secondary hover:text-soma-text-primary transition-all"
          >
            <WandSparkles size={20} strokeWidth={2} />
          </SideMenuButton>

          <SideMenuButton
            tippyContent="More Options"
            tippyPlacement="bottom"
            className="p-2 rounded-lg hover:bg-soma-light/10 text-soma-text-secondary hover:text-soma-text-primary transition-all"
          >
            <MoreVertical size={20} strokeWidth={2} />
          </SideMenuButton>
        </div>
      </div>
    </header>
  );
};

export default EditorTopBar;
