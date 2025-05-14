import React from "react";
import NoteEditor from "./NoteEditor";
import MindMap from "./MindMap";
import { useAppContext } from "../../context/AppContext";

type Props = {};

const Notes: React.FC<Props> = () => {
  const { selectedFile, noteView, getMessage } = useAppContext();
  return (
    <section className="content">
      {selectedFile && noteView === "note" ? (
        <NoteEditor />
      ) : noteView === "mindmap" ? (
        <MindMap />
      ) : (
        <h1 className="flex justify-center items-center h-full">
          {getMessage("notes.welcome")}
        </h1>
      )}
    </section>
  );
};

export default Notes;
