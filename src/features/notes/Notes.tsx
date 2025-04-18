import React from "react";
import NoteEditor from "./NoteEditor";
import MindMap from "./MindMap";
import { useAppContext } from "../../context/AppContext";

type Props = {};

const Notes: React.FC<Props> = () => {
  const { selectedFile, inMindMap, getMessage } = useAppContext();
  return (
    <section className="content">
      {selectedFile && !inMindMap ? (
        <NoteEditor />
      ) : inMindMap ? (
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
