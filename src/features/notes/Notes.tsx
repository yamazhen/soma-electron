import React from "react";
import NoteEditor from "./NoteEditor";
import { useFileContext } from "../../context/FileContext";
import { useNoteContext } from "../../context/NoteContext";

type Props = {};

const Notes: React.FC<Props> = () => {
  const { selectedFile } = useFileContext();
  const { inMindMap } = useNoteContext();
  return (
    <section className="content">
      {selectedFile && !inMindMap ? (
        <NoteEditor />
      ) : inMindMap ? (
        <h1 className="flex justify-center items-center h-full">
          Mind Map Mode
        </h1>
      ) : (
        <h1 className="flex justify-center items-center h-full">
          Welcome to Your Notes
        </h1>
      )}
    </section>
  );
};

export default Notes;
