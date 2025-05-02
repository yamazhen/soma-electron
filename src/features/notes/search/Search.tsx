import { SearchIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import Fuse from "fuse.js";

const Search: React.FC = () => {
  const { getAllNotesOnly } = useAppContext();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const flatNotes = useMemo(() => getAllNotesOnly(), [getAllNotesOnly]);
  const fuse = useMemo(
    () =>
      new Fuse(flatNotes, {
        keys: ["name", "path"],
        threshold: 0.4,
      }),
    [flatNotes],
  );

  // reset body class
  useEffect(() => {
    if (location.pathname === "/search") {
      document.body.classList.add("search-mode");
    } else {
      document.body.classList.remove("search-mode");
    }
    inputRef.current?.focus();
  }, [location]);

  // highlight input when search popup is opened
  useEffect(() => {
    const selectText = () => {
      inputRef.current?.select();
    };
    window.ipcRenderer?.on("search-focus-input", selectText);
    return () => {
      window.ipcRenderer?.off("search-focus-input", selectText);
    };
  });

  // esc to close search popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.ipcRenderer.hideSearchPopup();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (inputText.trim().length > 0) {
      window.ipcRenderer.expandSearchPopup(true);
      setExpanded(true);
    } else {
      window.ipcRenderer.expandSearchPopup(false);
      setExpanded(false);
    }
  }, [inputText]);

  const filteredNotes = useMemo(() => {
    const q = inputText.trim();
    return q ? fuse.search(q).map((r) => r.item) : flatNotes;
  }, [inputText, fuse, flatNotes]);

  useEffect(() => {
    setActiveIndex(0);
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!expanded || filteredNotes.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredNotes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const note = filteredNotes[activeIndex];
      if (note) {
        window.ipcRenderer.send("search-open-note", note.path);
        window.ipcRenderer.hideSearchPopup();
      }
    }
  };

  return (
    <main id="search">
      <div
        className={`flex ${expanded ? "h-[50px] border-b border-soma-dark" : "h-full"} items-center px-4 py-2 gap-2`}
      >
        <SearchIcon size={24} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search For Files"
          className="h-full caret-soma-accent2 w-full no-drag"
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          value={inputText}
        />
      </div>
      {expanded && (
        <div
          id="files"
          className="p-4 overflow-auto no-drag flex flex-col gap-1"
        >
          {filteredNotes.map((note, idx) => (
            <div
              key={note.path}
              onClick={() => {
                window.ipcRenderer.send("search-open-note", note.path);
                window.ipcRenderer.hideSearchPopup();
              }}
              className={`
                w-full py-1.5 px-3 rounded-md flex justify-between items-center
                ${idx === activeIndex ? "bg-soma-medium" : "hover:bg-soma-medium"}
              `}
            >
              <p>{note.name}</p>
              <p className="text-xs text-soma-text-secondary">
                {note.createdAt.toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Search;
