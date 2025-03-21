import React from "react";
import { useFileContext } from "../context/FileContext";
import NoteEditor from "./NoteEditor";

type Props = {};

const Notes: React.FC<Props> = () => {
  const { selectedFile } = useFileContext();
  return (
    <section className="content">
      {selectedFile ? <NoteEditor /> : <h1>Welcome to Your Notes</h1>}
    </section>
  );
};

export default Notes;
