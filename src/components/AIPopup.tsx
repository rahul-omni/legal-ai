"use client";
import {
  fetchAllNodes,
  fetchNodes,
  readFile,
} from "@/app/apiServices/nodeServices";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { ArrowUp, FilePlus, Paperclip, X } from "lucide-react";
import mammoth from "mammoth";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { useEffect, useState } from "react";
import TreeNode from "./TreeNode";

const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

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
}
const MAX_TOKENS = 16000;

export const estimateTokenCount = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  const tokens = Math.round(words + chars / 4);
  return tokens;
};

export function AIPopup({
  onPromptSubmit,
  currentContent,
  selectedText,
  documents,
  files,
  cursorPosition,
  cursorIndicatorPosition,
  onTreeUpdate
}: AIPopupProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [tree, setTree] = useState<FileSystemNodeProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileNodes, setFileNodes] = useState<FileSystemNodeProps[]>([]);
  const [showContext, setShowContext] = useState(false);
  const [nodes, setNodes] = useState<FileSystemNodeProps[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [documentall, setDocument] = useState<FileSystemNodeProps[]>([]); // Array to store multiple files
  const [selectedNodeText, setSelectedNodeText] = useState("");

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        setSelectedNodeText(selection.toString());
      }
    };
  
    if (typeof document !== "undefined") {
      document.addEventListener("mouseup", handleSelection);
      document.addEventListener("keyup", handleSelection);
    }
  
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("mouseup", handleSelection);
        document.removeEventListener("keyup", handleSelection);
      }
    };
  }, []);
  
  
   
  
  
  useEffect(() => {
    
      console.log("🔍 Cleaned selectedText sent to AI Prompt:",  selectedText);
     
  }, [selectedText]);
  
  const handleDocumentSelect = (file: FileSystemNodeProps) => {
    const isAlreadySelected =  documentall.some((doc) => doc.id === file.id);

    if (isAlreadySelected) {
      console.warn(`⚠️ File already selected: ${file.name} (id: ${file.id})`);
      return;
    }

    setDocument((prev) => [...prev, file]);
  };


  const handleAddContextClick = () => {
    setShowContext(true);
    // setIsPopupOpen(true); // Open the popup when the button is clicked
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchNodes();
        setNodes(data);
      } catch (error) {
        console.error("Error fetching nodes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const buildTree = (
    flatNodes: FileSystemNodeProps[]
  ): FileSystemNodeProps[] => {
    const map = new Map<string, FileSystemNodeProps>();
    const roots: FileSystemNodeProps[] = [];

    flatNodes.forEach((node) => {
      map.set(node.id, { ...node, children: node.children ?? [] }); // ✅ preserve existing children
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

  useEffect(() => {
    const getTree = async () => {
      try {
        const data = await fetchAllNodes(); // flat array

        //console.log("📦 Flat fetched data:", data); // <-- Add this

        const treeData = buildTree(data);
        //console.log("🌲 Built tree:", treeData); // convert to nested
        setTree(treeData);
        onTreeUpdate(treeData);
        const allFiles = getAllFiles(treeData); // collect deeply nested files
        //console.log("📄 All files (nested + flat):", allFiles);
        setFileNodes(allFiles); // store them in state
      } catch (error) {
        console.error("Failed to fetch tree:", error);
      } finally {
        setLoading(false);
      }
    };

    getTree();
  }, []);
  //console.log("tree", tree);
  //console.log("fileNodes", fileNodes); // now should show all files, nested or not!

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };
  //console.log("uploadfile", uploadedFiles);
  //console.log("documenttre--", documentall);
  /** ------------------------------------------------------------------
 *  handleSubmit  –  replace the one that’s currently in AIPopup.tsx
 *  ------------------------------------------------------------------
 *  ‑ Builds the *fullText* exactly like before
 *  ‑ NO network fetch here
 *  ‑ Hands everything to the parent (DocumentPane) through
 *      onPromptSubmit(prompt, fullText)
 * ------------------------------------------------------------------ */
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  /* guard clause – empty prompt */
  if (!prompt.trim()) return;

  try {
    setIsLoading(true);

    /* ───────────────────────────
     * 1.  Read uploaded files
     * ─────────────────────────── */
    const uploadedTexts = await Promise.all(
      uploadedFiles.map(async (file) => {
        if (file.type === "application/pdf")   return extractTextFromPDF(file);
        if (file.name.endsWith(".docx"))        return extractTextFromDocx(file);
        return file.text();                     // txt / fallback
      })
    );

    /* ───────────────────────────
     * 2.  Read tree‑selected docs
     * ─────────────────────────── */
    const treeTexts = await Promise.all(
      documentall.map(async (node) => {
        try {
          const { content, name } = await readFile(node.id);
          const file = new File([content], name);

          if (name.endsWith(".pdf"))  return extractTextFromPDF(file);
          if (name.endsWith(".docx")) return extractTextFromDocx(file);
          return await content.text();
        } catch (err) {
          console.error("readFile failed:", node.name, err);
          return "";
        }
      })
    );

    const fileText = [...uploadedTexts, ...treeTexts]
      .filter(Boolean)
      .join("\n\n");

    /* ───────────────────────────
     * 3.  Build PRIMARY context
     * ─────────────────────────── */
    let primary = "";
    if (selectedText)   primary = `Selected Text:\n"""\n${selectedText}\n"""`;
    else if (currentContent)
      primary = `Document Content:\n"""\n${currentContent}\n"""`;
    

    /* ───────────────────────────
     * 4.  Merge primary + files
     * ─────────────────────────── */
    const separator =
      primary && fileText ? "\n\n---\n\nAdditional Context Files:\n" : "";
    const fullText = primary + separator + fileText;

    /* ───────────────────────────
     * 5.  Hand off to parent
     * ─────────────────────────── */
    onPromptSubmit(prompt.trim(), fullText);

    /* optional: clear the input */
    setPrompt("");
  } catch (err) {
    console.error("AIPopup handleSubmit error:", err);
    setError("Something went wrong while preparing the prompt.");
  } finally {
    setIsLoading(false);
  }
};


  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
  const handleRemoveDocument = (index: number) => {
    setDocument((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearText = () => {
    setSelectedNodeText('');
  };
  

  return (
    <div
      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-40 w-[750px] 
                    shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] 
                    bg-gradient-to-r from-blue-50/80 via-blue-100/50 to-blue-50/80 
                    backdrop-blur-sm rounded-full"
    >
      {/* Main form with fixed height - Always visible */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
        {/* Left side buttons */}
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

          <button
            type="button"
            className="p-1.5 bg-white/70 backdrop-blur-sm text-blue-600 
                       border border-blue-100 rounded hover:bg-white transition-colors flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>

        {/* Textarea */}
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

      {/* Expandable context panel - Appears above the form */}
      {(selectedText ||
         documentall.length > 0 ||
        showContext ||
        uploadedFiles.length > 0 ||
        cursorPosition) && (
        <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[300px] overflow-y-auto">
          <div className="p-3">
            {/* Selected Text with Cursor Position */}
            {selectedText || selectedNodeText ? (
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
                   {/* Cross Icon */}
        {selectedNodeText && (
          <button
            onClick={handleClearText}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Clear Text"
          >
            <X className="h-4 w-4" />
          </button>
        )}
                </div>
                <p className="text-xs text-green-700 whitespace-pre-wrap">
                  { selectedNodeText}
                </p>
              </div>
            ) : (
              cursorPosition && (
                <div className="mb-2 p-2 border border-dashed border-blue-300 rounded bg-blue-50">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-blue-800">
                        Current Cursor:
                      </h4>
                      <span className="text-xs text-gray-500">
                        Line {cursorPosition.line}, Column{" "}
                        {cursorPosition.column}
                        {cursorIndicatorPosition && (
                          <span className="ml-2 text-gray-400">
                            (x:{" "}
                            {Math.round(cursorIndicatorPosition.coords.left)},
                            y: {Math.round(cursorIndicatorPosition.coords.top)})
                          </span>
                        )}
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
                          <span className="ml-2 text-gray-500">
                            (x:{" "}
                            {Math.round(cursorIndicatorPosition.coords.left)},
                            y: {Math.round(cursorIndicatorPosition.coords.top)})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Selected Documents */}
            { documentall.length > 0 && (
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-gray-600 mb-1">
                  Selected Documents:
                </h4>
                { documentall.map((file, idx) => (
                  <div
                    key={`document-${idx}`}
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

            {/* Context/File Display */}
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
