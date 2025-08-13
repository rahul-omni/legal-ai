"use client";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { ArrowUp, FilePlus, Gavel, Loader2, Paperclip, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import TreeNode from "../../TreeNode";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";

const suggestions = [
  "Cite a Supreme Court case on the measure of damages for breach of a construction contract where the contractor abandoned work midway.",
  "Cite a Supreme Court case discussing the conditions under which anticipatory bail may be denied in cases involving economic offences.",
  "Cite a Supreme Court case on the measure of damages for breach of a construction contract where the contractor abandoned work midway.",
  "Cite a Supreme Court case discussing the conditions under which anticipatory bail may be denied in cases involving economic offences.",
  "Cite a Supreme Court case on the measure of damages for breach of a construction contract where the contractor abandoned work midway.",
]


// Type definitions
interface AIPopupProps {
  selectedText?: string;
  onPromptSubmit: (_prompt: string, _context: string, files?: string[]) => void;
  cursorPosition?: {
    line: number;
    column: number;
  };
  cursorIndicatorPosition?: {
    coords: { top: number; left: number };
    line: number;
    column: number;
  } | null;
  isFolderPickerOpen?: boolean;
}

export function AIPopup({
  onPromptSubmit,
  selectedText,
  cursorPosition,
  cursorIndicatorPosition,
  isFolderPickerOpen,
}: AIPopupProps) {
  // Core state
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const { explorerState } = useExplorerContext();
  const [close, setClose] = useState(false);
  const [citationModal, setCitationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  
  // Ref for citation modal
  const citationModalRef = useRef<HTMLDivElement>(null);

  // File handling state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<
    FileSystemNodeProps[]
  >([]);

  const fetchCitations = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/citation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await res.json();
      setResults(data.results.results || []);
    } catch (err) {
      console.error("Error fetching citations:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setClose(false);
  }, [selectedText])

  // Close citation modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (citationModalRef.current && !citationModalRef.current.contains(event.target as Node)) {
        setCitationModal(false);
      }
    };

    if (citationModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [citationModal]);

  // Document selection handler
  const handleDocumentSelect = (file: FileSystemNodeProps) => {
    const isAlreadySelected = selectedDocuments.some(
      (doc) => doc.id === file.id
    );
    if (isAlreadySelected) return;
    setSelectedDocuments((prev) => [...prev, file]);
  };

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  // Remove handlers
  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleRemoveDocument = (index: number) => {
    setSelectedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setIsLoading(true);

      const selectedFiles = selectedDocuments.map((node) => node.id);

      // Submit to parent
      onPromptSubmit(prompt.trim(), selectedText || "", selectedFiles);
      setPrompt("");
    } catch (err) {
      console.error("Error preparing prompt:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip rendering if folder picker is open
  if (isFolderPickerOpen) return null;

  return (
    <div
      className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-40 w-[90%] shadow-[0_15px_30px_-8px_rgba(0,0,0,0.3)] 
                 bg-background-light rounded-lg border border-primary"
    >
      {/* Main prompt form */}
      <form onSubmit={handleSubmit} className="flex items-center flex-col gap-3 p-4">
        {/* Prompt input field */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your request..."
          className="flex-1 w-full p-1 text-sm border-0 rounded-lg resize-none 
                   focus:outline-none focus:ring-0 focus:border-0 
                   bg-transparent text-text placeholder-muted"
          rows={1}
          disabled={isLoading}
        />

        <div className="flex items-center justify-between gap-2 w-full">
          {/* Control buttons */}
        <div className="flex gap-2">
          <button
            title="Use Files"
            type="button"
            onClick={() => setShowContext(!showContext)}
            className="p-1.5 bg-transparent border-0 text-muted hover:text-text-light 
                     transition-colors flex-shrink-0"
            aria-label="Add Context"
          >
            <FilePlus className="w-4 h-4" />
          </button>

          <label
            title="Add New File"
            className="p-1.5 bg-transparent text-muted hover:text-text-light 
                     transition-colors flex-shrink-0 cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
          </label>

          <button
            title="Add Citation"
            type="button"
            onClick={() => setCitationModal(!citationModal)}
            className="p-1.5 bg-transparent border-0 text-muted hover:text-text-light 
                     transition-colors flex-shrink-0"
            aria-label="Add Context"
          >
            <Gavel className="w-4 h-4" />
          </button>
        </div>

        

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="p-2 bg-primary text-white 
                   rounded-full hover:bg-primary-dark 
                   disabled:bg-muted disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {isLoading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
        </div>
        
      </form>

      {/* Context panel - appears above the form */}
      {((selectedText ||
        selectedDocuments.length > 0 ||
        showContext ||
        uploadedFiles.length > 0 ||
        cursorPosition) && !close) && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[300px] overflow-y-auto">
            <div className="p-3">
              {/* Selected Text */}
              {selectedText && (
                <div className="mb-2 p-2 border border-dashed border-green-300 rounded bg-green-50">
                  <button
                    onClick={() => setClose(true)}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full border border-green-500 text-green-800 hover:bg-green-100 hover:text-red-500 transition"
                    aria-label="Close selected text"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-green-800">
                      Using Selected Text:
                    </h4>
                    {cursorPosition && (
                      <span className="text-xs text-gray-500">
                        Line {cursorPosition.line}, Column {cursorPosition.column}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-green-700 whitespace-pre-wrap">
                    {selectedText}
                  </p>
                </div>
              )}

              {/* Cursor Position (when no text is selected) */}
              {!selectedText && cursorPosition && (
                <div className="mb-2 p-2 border border-dashed border-blue-300 rounded bg-blue-50">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-blue-800">
                        Current Cursor:
                      </h4>
                      <span className="text-xs text-gray-500">
                        Line {cursorPosition.line}, Column {cursorPosition.column}
                      </span>
                    </div>
                    {cursorIndicatorPosition && (
                      <div className="flex items-center justify-between border-t border-blue-200 pt-1 mt-1">
                        <h4 className="text-xs font-semibold text-blue-600">
                          Insertion Point:
                        </h4>
                        <span className="text-xs text-blue-600">
                          Line {cursorIndicatorPosition.line}, Column{" "}
                          {cursorIndicatorPosition.column}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Documents */}
              {selectedDocuments.length > 0 && (
                <div className="mb-2">
                  <h4 className="text-xs font-semibold text-gray-600 mb-1">
                    Selected Documents:
                  </h4>
                  {selectedDocuments.map((file, idx) => (
                    <div
                      key={`document-${file.id}`}
                      className="flex items-center justify-between bg-green-50 px-2 py-1 rounded text-xs text-green-800 my-1"
                    >
                      <span className="truncate max-w-[250px]">{file.name}</span>
                      <button
                        onClick={() => handleRemoveDocument(idx)}
                        className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* File Tree Context */}
              {showContext && (
                <div className="mb-2 border border-gray-200 rounded bg-white">
                  {explorerState.fileTree.length > 0 ? (
                    explorerState.fileTree.map((node) => (
                      <TreeNode
                        key={node.id}
                        node={node}
                        onSelect={handleDocumentSelect}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">
                      No files found.
                    </p>
                  )}
                </div>
              )}

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 mb-1">
                    Uploaded Files:
                  </h4>
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-green-50 px-2 py-1 rounded text-xs text-green-800 my-1"
                    >
                      <span className="truncate max-w-[250px]">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      {citationModal && (
        <div 
          ref={citationModalRef}
          className="absolute bottom-full left-0 w-full min-h-[40vh] mb-2 bg-white rounded-lg shadow-lg border border-solid border-border max-h-[300px] overflow-y-auto p-4"
        >
          <div className="sticky top-0 z-10 bg-white">
            <div className="flex items-center gap-2 bg-white shadow-sm rounded-lg p-2 border w-full mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type your legal question here..."
              />

              <button
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition"
                onClick={() => {
                  fetchCitations();
                }}
                disabled={searchQuery.length==0 || loading}
              >
                {loading ? "🔍.." : "🔍" }
              </button>
            </div>


            {!(searchQuery && searchQuery.length) && <div className="flex flex-col gap-3 overflow-y-auto flex-1 mt-3">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer text-sm text-gray-800"
                  onClick={()=>{setSearchQuery(suggestion)}}
                >
                  {suggestion}
                </div>
              ))}
            </div>}
          </div>
          {loading ? <Loader2 className="w-4 h-5 animate-spin"/> : results?.length > 0 && (
            <div className="mt-6 border-t pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {results.map((item, idx) => (
                <div key={idx} className="relative p-3 bg-white rounded-lg border shadow-sm text-sm hover:shadow-md transition mr-4">
                  {/* Content (clamped) */}
                  <div className="text-gray-800 line-clamp-2 pr-8">{item?.content}</div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs mt-2 items-center">
                    <div className="flex flex-col">
                      {item.metadata?.judgment_url && (
                      <a
                        href={item.metadata.judgment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white/70 backdrop-blur-sm text-center text-blue-600 
                              rounded hover:bg-white transition-colors flex-shrink-0"
                      >
                        View Judgment
                      </a>
                    )}
                    <button
                      type="button"
                      className="p-1.5 bg-white/70 backdrop-blur-sm text-center text-blue-600 
                              rounded hover:bg-white transition-colors flex-shrink-0"
                    > View Summary</button>
                    </div>
                    <span>Diary Number: {item.metadata?.diary_number || "-"}</span>
                    <span>Bench: {item.metadata?.bench || "-"}</span>
                  </div>

                  {/* Right Arrow Button */}
                  <button
                    className="absolute top-1/2 right-3 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full border border-blue-400 text-gray-700 hover:border-gray-600 hover:text-black transition"
                    onClick={() => {
                      console.log("Clicked card index:", idx);
                    }}
                  >
                    →
                  </button>
                </div>

              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
