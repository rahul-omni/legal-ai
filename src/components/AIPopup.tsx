"use client";

import { useState, useEffect } from "react";
//import { X, ArrowUpCircle } from 'lucide-react'
import { AIWaveform } from "./AIWaveform";
import { X, ArrowUpCircle, FilePlus, Upload, FolderIcon, FileIcon } from "lucide-react";
// add this import
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import mammoth from "mammoth";
import { FileData } from "@/lib/fileService";
import { fetchAllNodes, fetchNodes, readFile } from "@/app/apiServices/nodeServices";

import { FileSystemNode } from "@/types/fileSystem";
 
import TreeNode from "./TreeNode";
 
const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

interface AIPopupProps {
  userId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onGenerate: (text: string) => void;
  currentContent: string;
  selectedText: string;
  documents: any[]; // new prop
  files: FileSystemNode[];
}
const MAX_TOKENS = 16000;

export const estimateTokenCount = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  const tokens = Math.round(words + chars / 4);
  return tokens;
};

export function AIPopup({
  userId,
  position,
  onClose,
  onGenerate,
  currentContent,
  selectedText,
  documents,
  files
}: AIPopupProps) {
  useEffect(() => {
    console.log("Documents received in AIPopup:", documents);
  }, [documents]);

  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [tree, setTree] = useState<FileSystemNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileNodes, setFileNodes] = useState<FileSystemNode[]>([]);
  const [showContext, setShowContext] = useState(false);
  const [nodes, setNodes] = useState<FileSystemNode[]>([]);
  
  
   const [isPopupOpen, setIsPopupOpen] = useState(false);
  // const [document, setDocument] = useState<FileSystemNode | null>(null);
  const [document, setDocument] = useState<FileSystemNode[]>([]); // Array to store multiple files

  const handleDocumentSelect = (file: FileSystemNode) => {
    // setDocument(file); // Do something with the selected document
    setDocument((prevDocuments) => [...prevDocuments, file]); // Adds selected file to the array
  };
   console.log("document--",document);
   
  const handleAddContextClick = () => {
    alert("working")
    setShowContext(true);
   // setIsPopupOpen(true); // Open the popup when the button is clicked
  };

   
 
    useEffect(() => {
      const fetchData = async () => {
        try {
          const data = await fetchNodes(userId);
          setNodes(data);
        } catch (error) {
          console.error("Error fetching nodes:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [userId]);
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
  
  
  const buildTree = (flatNodes: FileSystemNode[]): FileSystemNode[] => {
    const map = new Map<string, FileSystemNode>();
    const roots: FileSystemNode[] = [];
  
    flatNodes.forEach(node => {
      map.set(node.id, { ...node, children: node.children ?? [] }); // ✅ preserve existing children
    });
  
    flatNodes.forEach(node => {
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
  
  const getAllFiles = (nodes: FileSystemNode[]): FileSystemNode[] => {
    let result: FileSystemNode[] = [];
  
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
     
console.log("📦 Flat fetched data:", data); // <-- Add this

        const treeData = buildTree(data); 
        console.log("🌲 Built tree:", treeData)  // convert to nested
        setTree(treeData);
  
        const allFiles = getAllFiles(treeData); // collect deeply nested files
        console.log("📄 All files (nested + flat):", allFiles); 
        setFileNodes(allFiles); // store them in state
      } catch (error) {
        console.error("Failed to fetch tree:", error);
      } finally {
        setLoading(false);
      }
    };
  
    getTree();
  }, []);
  console.log("tree", tree);
  console.log("fileNodes", fileNodes); // now should show all files, nested or not!
  
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };
  console.log("uploadfile", uploadedFiles);
  console.log("documenttre--",document);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
  
    if (!prompt.trim()) return;
  
    try {
      setIsLoading(true);
      let fileText = "";
  
      // 1. Handle uploaded files (File[])
      const fileReadPromises = uploadedFiles.map((file) => {
        if (file.type === "application/pdf") {
          return extractTextFromPDF(file);
        } else if (file.name.endsWith(".docx")) {
          return extractTextFromDocx(file);
        } else {
          return file.text(); // fallback for .txt or others
        }
      });
  
      // 2. Handle documents (FileSystemNode[])
      const treeFileReadPromises = document.map(async (fileNode) => {
        try {
          const { content, name } = await readFile(fileNode.id);
          const extension = name.split(".").pop()?.toLowerCase();
          const file = new File([content], name);
          if (extension === "pdf") {
            return await extractTextFromPDF(file);
          } else if (extension === "docx") {
            return await extractTextFromDocx(file);
          } else {
            return await content.text(); // ✅ handle .txt or unknown text files
          }
        } catch (err) {
          console.error("Error reading server file:", fileNode.name, err);
          return "";
        }
      });
      
      // Combine results
      const results = await Promise.all([...fileReadPromises, ...treeFileReadPromises]);
      fileText = results.join("\n\n");
      console.log("🧾 Results:", results);

      const fullText = `${currentContent}\n\n${fileText}`;
      //console.log("📦 Final prompt:", fullText);

      const finalPrompt = selectedText
        ? `Given this text: "${selectedText}", ${prompt}`
        : prompt;
  
      const tokenCount = estimateTokenCount(fullText + finalPrompt);
  
      // if (tokenCount > MAX_TOKENS) {
      //   setError(`Combined input exceeds the token limit (${tokenCount} tokens).`);
      //   return;
      // }
      const MAX_ALLOWED_TOKENS = MAX_TOKENS - 500; // Buffer for model response

if (tokenCount > MAX_TOKENS) {
  const allowedChars = Math.floor(MAX_ALLOWED_TOKENS * 4); // Approx 4 chars per token
  const trimmedFileText = fileText.slice(0, allowedChars);
  const trimmedFullText = `${currentContent}\n\n${trimmedFileText}`;

  const retryTokenCount = estimateTokenCount(trimmedFullText + finalPrompt);

  if (retryTokenCount > MAX_TOKENS) {
    setError(`Even after trimming, input exceeds token limit (${retryTokenCount}). Please reduce file size.`);
    return;
  }

  fileText = trimmedFileText;
}

  
      // Optional: show log
      console.log("Calling API with combined file + server document content");
  
      // Make API call
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullText,
          prompt: finalPrompt,
        }),
      });
  
      //const data = await response.json();
      //if (!response.ok) throw new Error(data.error);
 
      //console.log("🧪 Final prompt:", finalPrompt);
      
      //onGenerate(data.summary);
      const summary = await response.text();
if (!response.ok) throw new Error(summary);

onGenerate(summary);
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong while processing files.");
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
  

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-xl w-72 p-[1px] overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: "linear-gradient(to right, #0EA5E9, #6366F1)",
        boxShadow: "0 0 20px rgba(99, 102, 241, 0.15)",
      }}
    >
      <div className="bg-white rounded-lg w-full h-full">
        <div className="p-2.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-sm font-medium bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-1.5">
            {selectedText ? (
              "Edit Selected Text"
            ) : (
              <>
                AI Assistant
                <AIWaveform />
              </>
            )}
          </h3>
          <button
       className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition"
        onClick={handleAddContextClick}
      >
        ➕ {showContext ? "Hide Files" : "Add Context"}
      </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-2.5 bg-white">
          {selectedText && (
            <div className="mb-2 text-sm text-gray-500 line-clamp-1">
              Selected: "{selectedText}"
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {/* File upload icon */}
            <label className="cursor-pointer text-gray-500 hover:text-indigo-600">
              <FilePlus className="w-5 h-5" />
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

            </label>
           <label>
 
           </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                selectedText
                  ? "How should I modify this?"
                  : "Type your request..."
              }
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="p-1.5 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
            >
              <ArrowUpCircle
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 px-2">{error}</p>}
          {/* {isPopupOpen && (
        <Popup
          userId="yourUserId" // Pass user ID
          onClose={handleClosePopup}
          onDocumentSelect={handleDocumentSelect}
          setDocuments={setDocument}
        />
      )} */}
      {showContext && (
  <div className="mt-4 p-2 border rounded bg-white max-h-[400px] overflow-y-auto">
    {tree.map((node) => (
      <TreeNode key={node.id} node={node} onSelect={handleDocumentSelect} />
    ))}
  </div>
)}

          {/* Show uploaded files */}
          {document.length > 0 && (
  <div>
    <h4 className="text-sm font-semibold">Selected Documents</h4>
    {document.map((file, idx) => (
      <div
        key={`document-${idx}`}
        className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 my-1"
      >
        <span className="truncate max-w-[160px]">{file.name}</span>
        <button
          onClick={() => handleRemoveDocument(idx)}
          className="text-red-500 hover:text-red-700"
        >
          ❌
        </button>
      </div>
    ))}
  </div>
)}

          {uploadedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded text-xs text-gray-700"
            >
              <span className="truncate max-w-[160px]">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(idx)}
                className="text-red-500 hover:text-red-700"
              >
                ❌
              </button>
            </div>
          ))}
              

          
        </form>
      </div>
    </div>
  );
}
