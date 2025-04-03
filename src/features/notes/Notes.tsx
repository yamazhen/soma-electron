import React from "react";
import NoteEditor from "./NoteEditor";
import { useFileContext } from "../../context/FileContext";

type Props = {};

const Notes: React.FC<Props> = () => {
  const { selectedFile } = useFileContext();
  return (
    <section className="content">
      {selectedFile ? (
        <NoteEditor />
      ) : (
        <h1 className="flex justify-center items-center h-full">
          Welcome to Your Notes
        </h1>
      )}
    </section>
  );
};

export default Notes;
