"use client";
import { fetchAllNodes, readFile } from "@/app/apiServices/nodeServices";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { ArrowUp, FilePlus, Paperclip, X } from "lucide-react";
import mammoth from "mammoth";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { useEffect, useState } from "react";
import TreeNode from "../../TreeNode";

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

// Type definitions
interface AIPopupProps {
  currentContent: string;
  selectedText: string;
  documents: any[];
  onPromptSubmit: (prompt: string, context: string) => void;
  files: FileSystemNodeProps[];
  cursorPosition?: {
    line: number;
    column: number;
  };
  cursorIndicatorPosition?: {
    coords: { top: number; left: number };
    line: number;
    column: number;
  } | null;
  onTreeUpdate: (tree: FileSystemNodeProps[]) => void;
  isFolderPickerOpen?: boolean;
}

// Utility functions for document processing
const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    fullText += `\n\nPage ${i}:\n${text}`;
  }

  return fullText;
};

// Tree building utility
const buildTree = (flatNodes: FileSystemNodeProps[]): FileSystemNodeProps[] => {
  const map = new Map<string, FileSystemNodeProps>();
  const roots: FileSystemNodeProps[] = [];

  flatNodes.forEach((node) => {
    map.set(node.id, { ...node, children: node.children ?? [] });
  });

  flatNodes.forEach((node) => {
    if (node.parentId) {
      const parent = map.get(node.parentId);
      if (parent) {
        parent.children!.push(map.get(node.id)!);
      }
    } else {
      roots.push(map.get(node.id)!);
    }
  });

  return roots;
};

// Get all files from a nested tree structure
const getAllFiles = (nodes: FileSystemNodeProps[]): FileSystemNodeProps[] => {
  let result: FileSystemNodeProps[] = [];

  for (const node of nodes) {
    if (node.type === "FILE") {
      result.push(node);
    }

    if (node.type === "FOLDER" && node.children && node.children.length > 0) {
      result = result.concat(getAllFiles(node.children));
    }
  }

  return result;
};

export function AIPopup({
  onPromptSubmit,
  currentContent,
  selectedText,
  files,
  cursorPosition,
  cursorIndicatorPosition,
  isFolderPickerOpen,
  onTreeUpdate,
}: AIPopupProps) {
  // Core state
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);

  // File handling state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<
    FileSystemNodeProps[]
  >([]);

  // Tree state
  const [tree, setTree] = useState<FileSystemNodeProps[]>([]);
  const [loading, setLoading] = useState(true);

  // Load file system tree on mount
  useEffect(() => {
    const loadFileTree = async () => {
      try {
        const data = await fetchAllNodes();
        const treeData = buildTree(data);
        setTree(treeData);
        onTreeUpdate(treeData);
      } catch (error) {
        console.error("Failed to fetch file tree:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFileTree();
  }, [onTreeUpdate]);

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

      // Process uploaded files
      const uploadedTexts = await Promise.all(
        uploadedFiles.map(async (file) => {
          if (file.type === "application/pdf") return extractTextFromPDF(file);
          if (file.name.endsWith(".docx")) return extractTextFromDocx(file);
          return file.text();
        })
      );

      // Process selected documents from tree
      const treeTexts = await Promise.all(
        selectedDocuments.map(async (node) => {
          try {
            const { content, name } = await readFile(node.id);
            const file = new File([content], name);

            if (name.endsWith(".pdf")) return extractTextFromPDF(file);
            if (name.endsWith(".docx")) return extractTextFromDocx(file);
            return content.text();
          } catch (err) {
            console.error("Failed to read file:", node.name, err);
            return "";
          }
        })
      );

      const fileText = [...uploadedTexts, ...treeTexts]
        .filter(Boolean)
        .join("\n\n");

      // Build primary context
      let primary = "";
      if (selectedText) primary = `Selected Text:\n"""\n${selectedText}\n"""`;
      else if (currentContent)
        primary = `Document Content:\n"""\n${currentContent}\n"""`;

      // Merge primary + files
      const separator =
        primary && fileText ? "\n\n---\n\nAdditional Context Files:\n" : "";
      const fullText = primary + separator + fileText;

      // Submit to parent
      onPromptSubmit(prompt.trim(), fullText);
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
      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-40 w-[750px] 
                 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] 
                 bg-gradient-to-r from-blue-50/80 via-blue-100/50 to-blue-50/80 
                 backdrop-blur-sm rounded-full"
    >
      {/* Main prompt form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
        {/* Control buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowContext(!showContext)}
            className="p-1.5 bg-white/70 backdrop-blur-sm border border-blue-100 text-blue-600 
                     rounded hover:bg-white transition-colors flex-shrink-0"
            aria-label="Add Context"
          >
            <FilePlus className="w-4 h-4" />
          </button>

          <label
            className="p-1.5 bg-white/70 backdrop-blur-sm text-blue-600 
                     border border-blue-100 rounded hover:bg-white transition-colors flex-shrink-0 cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
          </label>
        </div>

        {/* Prompt input field */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your request..."
          className="flex-1 px-3 py-2 text-sm border border-blue-100 rounded-md resize-none 
                   focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 
                   bg-white/70 backdrop-blur-sm text-gray-700"
          rows={2}
          disabled={isLoading}
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="p-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white 
                   rounded-md hover:from-blue-500 hover:to-blue-600 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0
                   shadow-lg shadow-blue-400/25"
        >
          {isLoading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Context panel - appears above the form */}
      {(selectedText ||
        selectedDocuments.length > 0 ||
        showContext ||
        uploadedFiles.length > 0 ||
        cursorPosition) && (
        <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[300px] overflow-y-auto">
          <div className="p-3">
            {/* Selected Text */}
            {selectedText && (
              <div className="mb-2 p-2 border border-dashed border-green-300 rounded bg-green-50">
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
                {loading ? (
                  <p className="text-xs text-gray-500 text-center py-2">
                    Loading files...
                  </p>
                ) : tree.length > 0 ? (
                  tree.map((node) => (
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
    </div>
  );
}
