"use client";

import { FileSystemNodeProps } from "@/types/fileSystem";
import { ArrowUp, FilePlus, Gavel, Loader2, Paperclip, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import TreeNode from "../../TreeNode";
import { useExplorerContext } from "../reducersContexts/explorerReducerContext";
import type { AssistantMode } from "../assistantTypes";

const suggestions = [
  "Cite a Supreme Court case on the measure of damages for breach of a construction contract where the contractor abandoned work midway.",
  "Cite a Supreme Court case discussing the conditions under which anticipatory bail may be denied in cases involving economic offences.",
];

export interface AIPromptComposerProps {
  assistantMode?: AssistantMode;
  onPromptSubmit: (prompt: string, context: string, files?: string[]) => void;
  selectedText?: string;
  cursorPosition?: { line: number; column: number };
  cursorIndicatorPosition?: {
    coords: { top: number; left: number };
    line: number;
    column: number;
  } | null;
  isFolderPickerOpen?: boolean;
  isLoading?: boolean;
}

export function AIPromptComposer({
  assistantMode = "chat",
  onPromptSubmit,
  selectedText,
  cursorPosition,
  cursorIndicatorPosition,
  isFolderPickerOpen,
  isLoading = false,
}: AIPromptComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [showContext, setShowContext] = useState(false);
  const { explorerState } = useExplorerContext();
  const [close, setClose] = useState(false);
  const [citationModal, setCitationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const citationModalRef = useRef<HTMLDivElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<FileSystemNodeProps[]>([]);

  const fetchCitations = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/citation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setResults(data.results.results || []);
    } catch (err) {
      console.error("Error fetching citations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setClose(false);
  }, [selectedText]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (citationModalRef.current && !citationModalRef.current.contains(event.target as Node)) {
        setCitationModal(false);
      }
    };
    if (citationModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [citationModal]);

  const handleDocumentSelect = (file: FileSystemNodeProps) => {
    const isAlreadySelected = selectedDocuments.some((doc) => doc.id === file.id);
    if (isAlreadySelected) return;
    setSelectedDocuments((prev) => [...prev, file]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleRemoveDocument = (index: number) => {
    setSelectedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const submitPrompt = () => {
    if (!prompt.trim() || isLoading) return;
    try {
      const selectedFiles = selectedDocuments.map((node) => node.id);
      onPromptSubmit(prompt.trim(), selectedText || "", selectedFiles);
      setPrompt("");
    } catch (err) {
      console.error("Error preparing prompt:", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPrompt();
  };

  /** Enter submits (like chat); Shift+Enter adds a new line — default textarea only does the latter. */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    submitPrompt();
  };

  if (isFolderPickerOpen) {
    return (
      <div className="border-t border-border px-3 py-2.5 text-xs text-muted text-center bg-background-dark shrink-0">
        Finish choosing a save location to continue the conversation.
      </div>
    );
  }

  const showContextBlock =
    (selectedText ||
      selectedDocuments.length > 0 ||
      showContext ||
      uploadedFiles.length > 0 ||
      cursorPosition) &&
    !close;

  return (
    <div className="flex flex-col border-t border-border bg-background-light shrink-0">
      {showContextBlock && (
        <div className="max-h-[min(220px,40vh)] overflow-y-auto border-b border-border p-3 space-y-2 bg-background">
          {selectedText && (
            <div className="relative p-2 border border-dashed border-emerald-300 rounded-md bg-emerald-50/80">
              <button
                type="button"
                onClick={() => setClose(true)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full border border-emerald-500 text-emerald-800 hover:bg-emerald-100"
                aria-label="Clear selected text from context"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="flex items-center justify-between mb-1 pr-6">
                <h4 className="text-xs font-semibold text-emerald-900">Document selection sent with prompt</h4>
                {cursorPosition && (
                  <span className="text-xs text-muted">
                    Line {cursorPosition.line}, col {cursorPosition.column}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-900/90 whitespace-pre-wrap max-h-24 overflow-y-auto">{selectedText}</p>
            </div>
          )}

          {!selectedText && cursorPosition && (
            <div className="p-2 border border-dashed border-blue-300 rounded-md bg-blue-50/80 text-xs">
              <div className="font-semibold text-blue-900">Cursor in document</div>
              <span className="text-blue-800/80">
                Line {cursorPosition.line}, column {cursorPosition.column}
              </span>
              {cursorIndicatorPosition && (
                <div className="mt-1 text-blue-700">
                  Insertion point: line {cursorIndicatorPosition.line}, col {cursorIndicatorPosition.column}
                </div>
              )}
            </div>
          )}

          {selectedDocuments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-light mb-1">Linked files</h4>
              {selectedDocuments.map((file, idx) => (
                <div
                  key={`document-${file.id}`}
                  className="flex items-center justify-between bg-emerald-50/80 px-2 py-1 rounded text-xs text-emerald-900 my-1"
                >
                  <span className="truncate max-w-[240px]">{file.name}</span>
                  <button type="button" onClick={() => handleRemoveDocument(idx)} className="ml-2 text-red-600 hover:text-red-800 shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showContext && (
            <div className="border border-border rounded-md bg-background p-1 max-h-32 overflow-y-auto">
              {explorerState.fileTree.length > 0 ? (
                explorerState.fileTree.map((node) => (
                  <TreeNode key={node.id} node={node} onSelect={handleDocumentSelect} />
                ))
              ) : (
                <p className="text-xs text-muted text-center py-2">No files found.</p>
              )}
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-light mb-1">Attachments</h4>
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-emerald-50/80 px-2 py-1 rounded text-xs my-1"
                >
                  <span className="truncate max-w-[240px]">{file.name}</span>
                  <button type="button" onClick={() => handleRemoveFile(idx)} className="text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            assistantMode === "document"
              ? "Make a draft, create citation entries ..."
              : "Chat with the assistant about this document."
          }
          className="w-full min-h-[72px] max-h-40 p-2.5 text-sm rounded-md border border-border bg-background
                     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder:text-muted resize-y"
          disabled={isLoading}
          rows={3}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <button
              title="Add files from project"
              type="button"
              onClick={() => setShowContext(!showContext)}
              className={`p-2 rounded-md border transition-colors ${
                showContext ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted hover:bg-background-dark"
              }`}
              aria-label="Add files from project"
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <label
              title="Attach files"
              className="p-2 rounded-md border border-transparent text-muted hover:bg-background-dark cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
              <input type="file" onChange={handleFileChange} className="hidden" multiple />
            </label>
            {/* <button
              title="Case law search"
              type="button"
              onClick={() => setCitationModal(!citationModal)}
              className={`p-2 rounded-md border transition-colors ${
                citationModal ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted hover:bg-background-dark"
              }`}
              aria-label="Case law search"
            >
              <Gavel className="w-4 h-4" />
            </button> */}
          </div>
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="p-2.5 bg-primary text-white rounded-full hover:bg-primary-dark disabled:bg-muted disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {citationModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
          <div
            ref={citationModalRef}
            className="w-full max-w-lg max-h-[min(70vh,520px)] overflow-y-auto bg-background rounded-lg shadow-xl border border-border p-4"
          >
            <div className="sticky top-0 z-10 bg-background pb-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Search case law…"
                />
                <button
                  type="button"
                  className="p-2 rounded-md border border-border hover:bg-background-dark transition"
                  onClick={() => fetchCitations()}
                  disabled={searchQuery.length === 0 || loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </button>
              </div>
              {!(searchQuery && searchQuery.length) && (
                <div className="flex flex-col gap-2 mt-3 max-h-40 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="text-left p-2 rounded-md bg-background-dark hover:bg-background-medium text-sm text-text"
                      onClick={() => setSearchQuery(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              results?.length > 0 ? (
                <div className="mt-4 space-y-3 border-t border-border pt-3">
                  {results.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border text-sm">
                      <div className="text-text line-clamp-3">{item?.content}</div>
                      <div className="flex flex-wrap gap-2 text-xs mt-2 text-muted">
                        {item.metadata?.judgment_url && (
                          <a
                            href={item.metadata.judgment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View judgment
                          </a>
                        )}
                        <span>Diary: {item.metadata?.diary_number || "—"}</span>
                        <span>Bench: {item.metadata?.bench || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            )}
            <button
              type="button"
              className="mt-4 w-full py-2 text-sm text-muted hover:text-text border border-border rounded-md"
              onClick={() => setCitationModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
