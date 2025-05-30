import { SearchIcon, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import Fuse from "fuse.js";
import { useThemeListener } from "../../../hooks/themeHooks";

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

  useThemeListener();

  useEffect(() => {
    if (location.pathname === "/search") {
      document.body.classList.add("search-mode");
    } else {
      document.body.classList.remove("search-mode");
    }
    inputRef.current?.focus();
  }, [location]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => {
          inputRef.current?.select();
        }, 10);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const selectText = () => {
      inputRef.current?.select();
    };
    window.ipcRenderer?.on("search-focus-input", selectText);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.ipcRenderer?.off("search-focus-input", selectText);
    };
  }, []);

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

  useEffect(() => {
    if (expanded && filteredNotes.length > 0) {
      const activeElement = document.querySelector(
        `[data-index="${activeIndex}"]`,
      );
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [activeIndex, expanded, filteredNotes.length]);

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
    <main className="bg-soma-darkest h-full flex flex-col">
      {/* Search Bar */}
      <div
        className={`
        bg-soma-dark/80 backdrop-blur-sm transition-all duration-200
        ${
          expanded
            ? "shadow-lg border-b border-soma-light/10"
            : "h-full flex items-center"
        }
      `}
      >
        <div className="h-16 flex items-center px-6 gap-4">
          <SearchIcon
            size={20}
            className="text-soma-text-secondary flex-shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes..."
            className="
              flex-1 bg-transparent text-soma-text-primary text-lg
              placeholder:text-soma-text-secondary/60
              focus:outline-none caret-soma-accent1
              no-drag
            "
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            value={inputText}
          />
          {inputText && (
            <button
              onClick={() => setInputText("")}
              className="text-soma-text-secondary hover:text-soma-text-primary transition-colors p-1 rounded"
            >
              <span className="text-xs">
                <X size={16} />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {expanded && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {filteredNotes.length > 0 ? (
            <>
              <div className="px-6 py-3 text-sm text-soma-text-secondary border-b border-soma-light/10">
                {filteredNotes.length} result
                {filteredNotes.length !== 1 ? "s" : ""} found
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 space-y-1">
                  {filteredNotes.map((note, idx) => (
                    <div
                      data-index={idx}
                      key={note.path}
                      onClick={() => {
                        window.ipcRenderer.send("search-open-note", note.path);
                        window.ipcRenderer.hideSearchPopup();
                      }}
                      className={`
                        group cursor-pointer rounded-lg transition-all duration-150
                        ${
                          idx === activeIndex
                            ? "bg-soma-accent1 text-white shadow-lg"
                            : "hover:bg-soma-dark/60"
                        }
                      `}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`
                              font-medium truncate
                              ${
                                idx === activeIndex
                                  ? "text-white"
                                  : "text-soma-text-primary"
                              }
                            `}
                            >
                              {note.name}
                            </h3>
                            <p
                              className={`
                              text-sm mt-1 truncate
                              ${
                                idx === activeIndex
                                  ? "text-white/80"
                                  : "text-soma-text-secondary"
                              }
                            `}
                            >
                              {note.path}
                            </p>
                          </div>
                          <span
                            className={`
                            text-xs whitespace-nowrap flex-shrink-0 mt-1
                            ${
                              idx === activeIndex
                                ? "text-white/60"
                                : "text-soma-text-secondary"
                            }
                          `}
                          >
                            {note.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-soma-text-secondary text-lg mb-2">
                  No results found
                </p>
                <p className="text-soma-text-secondary/60 text-sm">
                  Try a different search term
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Search;
