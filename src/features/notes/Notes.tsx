import React from "react";
import NoteEditor from "./NoteEditor";
import { useFileContext } from "../../context/FileContext";
import { useNoteContext } from "../../context/NoteContext";
import MindMap from "./MindMap";

type Props = {};

const Notes: React.FC<Props> = () => {
  const { selectedFile } = useFileContext();
  const { inMindMap } = useNoteContext();
  return (
    <section className="content">
      {selectedFile && !inMindMap ? (
        <NoteEditor />
      ) : inMindMap ? (
        <MindMap />
      ) : (
        <h1 className="flex justify-center items-center h-full">
          Welcome to Your Notes
        </h1>
      )}
    </section>
  );
};

export default Notes;
