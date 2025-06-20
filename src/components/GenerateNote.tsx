import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Loader,
  Brain,
  Sparkles,
} from "lucide-react";
import { apiHelperService } from "@/services/apiService";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";

interface UploadedFile {
  id: string;
  file: File;
  type: "image" | "pdf";
}

const GenerateNote: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadNotes } = useAppContext();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      setUploadedFile({
        id: Math.random().toString(36).substring(2, 11),
        file,
        type: file.type.startsWith("image/") ? "image" : "pdf",
      });
    }
    // Clear the input value to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleGenerate = async () => {
    if (!uploadedFile) return;

    const fileBuffer = await uploadedFile.file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    const fileData = {
      buffer: Array.from(uint8Array),
      filename: uploadedFile.file.name,
      contentType: uploadedFile.file.type,
    };

    setIsGenerating(true);

    apiHelperService
      .post("/api/ai/v1/notes/upload", fileData)
      .then(async (res) => {
        const noteContent = res.body.note.content;
        const noteTitle = res.body.note.title;

        await window.fileSystem.createMarkdownFile(noteTitle, noteContent);
        toast.success("Notes generated successfully!");
        loadNotes();
        window.ipcRenderer?.closeGenerateNotePopup?.();
        setIsGenerating(false);
      })
      .catch(() => setIsGenerating(false));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <section className="relative w-full h-full bg-soma-darkest flex flex-col overflow-hidden">
      {/* Draggable area */}
      <span
        id="generateNoteDragWindow"
        className="w-full block absolute h-10 drag z-10"
      />

      {/* Close button - absolute positioned */}
      <button
        onClick={() => window.ipcRenderer?.closeGenerateNotePopup?.()}
        className="absolute top-5 right-5 p-2 rounded-lg hover:bg-soma-light/10 transition-colors no-drag z-20 cursor-pointer"
      >
        <X
          size={18}
          className="text-soma-text-secondary hover:text-soma-text-primary"
        />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 p-4 pb-3 pt-6">
        <div className="p-2 bg-soma-accent1/20 rounded-xl">
          <Brain className="text-soma-accent1" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-soma-text-primary">
            Generate Notes
          </h1>
          <p className="text-xs text-soma-text-secondary">
            Upload a file to generate study notes
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-4 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          {/* Combined Upload/File Display Card */}
          <div className="bg-soma-dark rounded-xl p-4 w-full max-w-md">
            <div
              className={`
              border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer h-32 flex flex-col justify-center
              ${
                isDragOver
                  ? "border-soma-accent1 bg-soma-accent1/5"
                  : "border-soma-light/20 hover:border-soma-accent1/50 hover:bg-soma-accent1/5"
              }
            `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {!uploadedFile ? (
                /* No file uploaded state */
                <div className="text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="w-10 h-10 bg-soma-accent1/20 rounded-lg flex items-center justify-center">
                      <Upload size={20} className="text-soma-accent1" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-soma-text-primary mb-1">
                    Drop a file here or click to browse
                  </h3>
                  <p className="text-xs text-soma-text-secondary">
                    Supports images and PDF files
                  </p>
                </div>
              ) : (
                /* File uploaded state */
                <div className="text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="w-10 h-10 bg-soma-accent1/20 rounded-lg flex items-center justify-center">
                      {uploadedFile.type === "image" ? (
                        <ImageIcon size={20} className="text-soma-accent1" />
                      ) : (
                        <FileText size={20} className="text-soma-accent1" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-soma-text-primary mb-1 truncate px-1">
                    {uploadedFile.file.name}
                  </h3>
                  <p className="text-xs text-soma-text-secondary">
                    {formatFileSize(uploadedFile.file.size)} • Click to replace
                  </p>
                </div>
              )}
            </div>

            {/* Remove button - always present, but invisible when no file */}
            <div className="mt-3 flex justify-center h-6">
              {uploadedFile ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="px-3 py-1 text-xs rounded-lg bg-soma-medium hover:bg-soma-light transition-colors text-soma-text-secondary hover:text-red-400 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} />
                  Remove file
                </button>
              ) : (
                /* Invisible placeholder to maintain consistent spacing */
                <div className="h-6"></div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Generate Button Card - Fixed at bottom */}
        <div className="bg-soma-dark rounded-xl p-4 flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={!uploadedFile || isGenerating}
            className={`
            w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
            ${
              uploadedFile && !isGenerating
                ? "bg-soma-accent1 hover:bg-soma-accent1/90 text-white shadow-lg cursor-pointer"
                : "bg-soma-medium text-soma-text-secondary cursor-not-allowed"
            }
          `}
          >
            {isGenerating ? (
              <>
                <Loader size={16} className="animate-spin" />
                Generating Notes...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Notes from File
              </>
            )}
          </button>

          {/* Always show info box - content changes based on state */}
          <div className="mt-3 p-3 bg-soma-accent1/10 rounded-lg">
            {!uploadedFile ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Brain size={14} className="text-soma-accent1" />
                  <span className="text-xs font-medium text-soma-accent1">
                    Getting Started
                  </span>
                </div>
                <p className="text-xs text-soma-text-secondary">
                  Upload a file to generate notes using AI
                </p>
              </>
            ) : isGenerating ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Loader
                    size={14}
                    className="animate-spin text-soma-accent1"
                  />
                  <span className="text-xs font-medium text-soma-accent1">
                    Processing
                  </span>
                </div>
                <p className="text-xs text-soma-text-secondary">
                  AI is analyzing your file...
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Brain size={14} className="text-soma-accent1" />
                  <span className="text-xs font-medium text-soma-accent1">
                    Ready to Generate
                  </span>
                </div>
                <p className="text-xs text-soma-text-secondary">
                  Submit to generate note
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenerateNote;
