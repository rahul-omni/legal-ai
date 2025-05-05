"use client";

import { loadingContext } from "@/context/loadingContext";
import { RiskFinding } from "@/lib/riskAnalyzer";
import {
  OPENAI_LANGUAGES,
  SARVAM_LANGUAGES,
  TranslationVendor,
} from "@/lib/translation/types";
import {
  Save,
  ChevronDown
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { AIPopup } from "./AIPopup";
import { CursorTracker } from "./CursorTracker";
import { SaveDropdown } from "./SaveDropdown";
import { TranslationDropdown } from "./TranslationDropdown";
import { QuillEditor } from './QuillEditor';
import { createNode, CreateNodePayload, fetchAllNodes, fetchNodes, updateNodeContent } from "@/app/apiServices/nodeServices";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { handleApiError } from "@/helper/handleApiError";
import { useToast } from "./ui/toast";
 
interface DocumentPaneProps {
  content: string;
  onContentChange: (content: string) => void;
  fileName: string;
  //onSave: () => Promise<void>;
  onSave: (fileId?: string | null) => void;
  onSaveAs: () => Promise<void>;
  fileId?: string | null;
  onDocumentSelect: (doc: FileSystemNodeProps) => void;
   onFileTreeUpdate: (parentId?: string) => Promise<FileSystemNodeProps[]>;
  //onFileTreeUpdate?: () => Promise<void>;
  node :FileSystemNodeProps[]
  // userId: string;
  // documents: any[];
  // files: any[];
}

// Add this interface to track generation state
interface GenerationState {
  isGenerating: boolean;
  insertPosition?: {
    line: number;
    column: number;
    coords: { left: number; top: number };
  };
}

export function DocumentPane({
  content,
  onContentChange,
  fileName,
  onSave,
  onSaveAs,
  fileId,
  onDocumentSelect,
  onFileTreeUpdate,
  node
  // userId,
  // documents,
  // files,
}: DocumentPaneProps) {
  const [showAIPopup, setShowAIPopup] = useState(true);
  const [selectedText, setSelectedText] = useState("");
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveDropdownRef = useRef<HTMLDivElement>(null);
  const [highlightRange, setHighlightRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [translationVendor, setTranslationVendor] =
    useState<TranslationVendor>("openai");
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const { isLoading, startLoading, stopLoading } = loadingContext();
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
  const translationDropdownRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState<{
    line: number;
    column: number;
    coords?: { left: number; top: number };
  }>();
  const [cursorIndicatorPosition, setCursorIndicatorPosition] = useState<{
    line: number;
    column: number;
    coords: { left: number; top: number };
  } | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false
  });

  const [nodes, setNodes] = useState<FileSystemNodeProps[]>([]);
     const { showToast } = useToast();
     const [selectedNode, setSelectedNode] = useState<FileSystemNodeProps | null>(null);
    
     const [fileTree, setFileTree] = useState<FileSystemNodeProps[]>([]);
     const [currentParentId, setCurrentParentId] = useState<string | null>(null);
       
  // This callback will be passed to AIPopup
  const handleTreeUpdate = (newTree: FileSystemNodeProps[]) => {
    setFileTree(newTree);
    console.log("Tree received in DocumentPane:", newTree);
  };
     
  const fetchUpdatedFileTree = async () => {
    try {
      console.log("Fetching file tree...");  // This log will help us know if the function is being called.
      const tree = await fetchAllNodes();
      console.log("📦 Updated file tree inside DocumentPane:", tree);  // This is where we check the actual tree.
      setFileTree(tree);
    } catch (error) {
      handleApiError(error, showToast);
      console.error("Error fetching file tree:", error);  // Log error if something goes wrong
    }
  };
  
  
  // useEffect(() => {
  //   console.log("Fetching file tree on mount...");
  //   fetchUpdatedFileTree();
  // }, []);
  
  
  //console.log("content",content);
  console.log("filetree---",fileTree);
  console.log("nodes+++++",nodes);
   
  console.log("filesID",fileId);
  // Add this function to DocumentPane.tsx
  const verifyFileInTree = (tree: FileSystemNodeProps[], targetFileId: string) => {
    // Track both the file and its parent folder
    let result = { file: null as FileSystemNodeProps | null, parent: null as FileSystemNodeProps | null };
  
    const findFile = (nodes: FileSystemNodeProps[], parent: FileSystemNodeProps | null): boolean => {
      for (const node of nodes) {
        if (node.id === targetFileId) {
          result.file = node;
          result.parent = parent;
          return true;
        }
        if (node.type === "FOLDER" && node.children) {
          if (findFile(node.children, node)) {
            return true;
          }
        }
      }
      return false;
    };
  
    findFile(tree, null);
    
    if (result.file) {
      console.log("File found:", {
        id: result.file.id,
        name: result.file.name,
        parent: result.parent 
          ? { id: result.parent.id, name: result.parent.name } 
          : "root"
      });
      return result.parent?.id || null;
    }
    
    console.error("File not found in tree");
    return null;
  };

// In DocumentPane.tsx, inside the component
// useEffect(() => {
//   if (fileTree.length > 0 && fileId) {
//     console.log("🔍 Checking fileId in tree...");
//     const parentId = verifyFileInTree(fileTree, fileId);
//     console.log("Parent ID of current file:", parentId);
    
//     // Store the parentId in state
//     setCurrentParentId(parentId);
//   }
// }, [fileTree, fileId]);
  // Handle click outside for save dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(event.target as Node)) {
        setShowSaveDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (translationDropdownRef.current && !translationDropdownRef.current.contains(event.target as Node)) {
        setShowTranslateDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const cursorIndex = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorIndex);
    
    // Split into lines and count up to cursor
    const lines = textBeforeCursor.split('\n');
    
    // Line number (1-based)
    const line = lines.length;
    
    // Get the current line's content
    const currentLine = lines[lines.length - 1] || '';
    
    // Debug logging
    console.log("Cursor position details:", {
      cursorIndex,
      totalLines: lines.length,
      currentLine,
      allLines: lines.map((l, i) => `Line ${i + 1}: "${l}"`)
    });
    
    // Calculate visual column position (1-based)
    let column = 1;
    for (let i = 0; i < currentLine.length; i++) {
      if (currentLine[i] === '\t') {
        column += 4 - (column - 1) % 4;
      } else {
        column++;
      }
    }

    return { line, column };
  };

  const updateCursorIndicator = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const position = calculateCursorPosition(textarea);
    const coordinates = getCaretCoordinates(textarea, textarea.selectionStart);
    
    setCursorIndicatorPosition({
      ...position,
      coords: coordinates
    });
  };

  // Add this to handle scroll events
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleScroll = () => {
      if (!selectedText) {
        updateCursorIndicator();
      }
    };

    textarea.addEventListener('scroll', handleScroll);
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, [selectedText]);

  // Update cursor indicator when cursor position changes
  const handleCursorChange = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== end) {
        const currentSelection = textarea.value.substring(start, end);
        setSelectedText(currentSelection);
        setCursorIndicatorPosition(null);
      } else {
        setSelectedText("");
        const position = calculateCursorPosition(textarea);
        const coords = getCaretCoordinates(textarea, start);
        
        setCursorIndicatorPosition({
          ...position,
          coords: coords
        });
      }
      
      const position = calculateCursorPosition(textarea);
      setCursorPosition(position);
    }
  };

  const handleTranslate = async (vendor: TranslationVendor, language: string) => {
    try {
      startLoading("TRANSLATE_TEXT");
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor,
          sourceText: content,
          targetLanguage: language,
          mode: "formal",
        }),
      });

      if (!response.ok) throw new Error("Translation failed");
      const data = await response.json();
      onContentChange(data.translation);
    } catch (error) {
      console.error("Translation error:", error);
      alert("Failed to translate text");
    } finally {
      stopLoading("TRANSLATE_TEXT");
    }
  };

  const handleGeneratedText = async (prompt: string) => {
    try {
      setGenerationState({
        isGenerating: true,
        insertPosition: cursorIndicatorPosition || undefined
      });

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      // Get Quill instance
      const quillEditor = document.querySelector('.quill')?.querySelector('.ql-editor');
      if (!quillEditor) return;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode and accumulate the chunk
        const chunk = decoder.decode(value);
        accumulatedText += chunk;

        // Create new content by combining existing and new
        const newContent = content + accumulatedText;
        onContentChange(newContent);

         // Scroll to bottom after each update
      quillEditor.scrollTop = quillEditor.scrollHeight;
      }

    } catch (error) {
      console.error('Error generating text:', error);
    } finally {
      setGenerationState({ isGenerating: false });
    }
  };

  const renderContent = () => {
    if (!highlightRange) return content;

    return (
      <>
        {content.slice(0, highlightRange.start)}
        <span className="highlight-new-text">
          {content.slice(highlightRange.start, highlightRange.end)}
        </span>
        {content.slice(highlightRange.end)}
      </>
    );
  };

  const handleRiskClick = (risk: RiskFinding) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        risk.location.start,
        risk.location.end
      );
    }
  };

  const handleSelectionChange = (range: { index: number; length: number } | null) => {
    if (!range) {
      setSelectedText('');
      return;
    }

    if (range.length > 0) {
      // Get selected text from Quill
      setSelectedText(content.slice(range.index, range.index + range.length));
    } else {
      setSelectedText('');
      // Update cursor position
      setCursorPosition({
        line: 1, // Quill doesn't provide line numbers easily
        column: range.index,
        coords: { // We'll need to calculate this differently for Quill
          top: 0,
          left: 0
        }
      });
    }
  };

  const checkDuplicateInTree = (
    nodes: FileSystemNodeProps[],
    name: string,
    type: string
  ): boolean => {
    for (const node of nodes) {
      if (node.name === name && node.type === type) return true;
      if (node.children && checkDuplicateInTree(node.children, name, type)) {
        return true;
      }
    }
    return false;
  };
  

  

  const handleAddDocument = (newDoc: FileSystemNodeProps, parentId: string | null) => {
    // Check the entire tree for a duplicate before adding
    if (checkDuplicateInTree(nodes, newDoc.name, newDoc.type)) {
      console.log("Duplicate found, showing alert and skipping addition.");
      alert(`A document named "${newDoc.name}" already exists somewhere in your tree.`);
      return; // Exit early – don't add duplicate
    }
    console.log("Not duplicate, proceeding to add.");
    const addRecursively = (nodes: FileSystemNodeProps[]): FileSystemNodeProps[] => {
      return nodes.map((node) => {
        if (node.id === parentId && node.type === "FOLDER") {
          const children = node.children || [];
          return {
            ...node,
            children: [...children, newDoc],
          };
        }
        if (node.type === "FOLDER" && node.children?.length) {
          return {
            ...node,
            children: addRecursively(node.children),
          };
        }
        return node;
      });
    };
  
    // Add at root level if no parent
    if (!parentId) {
      setNodes([...nodes, newDoc]);
    } else {
      setNodes(addRecursively(nodes));
    }
  };
  const updateNodeChildren = (
    nodes: FileSystemNodeProps[],
    children: FileSystemNodeProps[],
    parentId: string
  ): FileSystemNodeProps[] => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return { ...node, children };
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeChildren(node.children, children, parentId),
        };
      }
      return node;
    });
  };
     
   
  
 
  const findNodeInTree = (id: string, nodes: FileSystemNodeProps[]): FileSystemNodeProps | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeInTree(id, node.children);
      if (found) return found;
    }
  }
  return null;
};

// Gets the effective parent ID for saving
const getEffectiveParentId = (): string | null => {
  // Case 1: Explicit folder selection
  if (selectedNode?.type === "FOLDER") return selectedNode.id;
  
  // Case 2: Saving existing file (use its parent)
  if (fileId) {
    const originalFile = findNodeInTree(fileId, nodes);
    if (originalFile) return originalFile.parentId ?? null;
  }
  
  // Case 3: File is selected (use its parent)
  if (selectedNode?.type === "FILE") return selectedNode.parentId ?? null;
  
  // Case 4: No selection
  return null;
};
const getAvailableName = (name: string, siblings: FileSystemNodeProps[]) => {
  const base = name.replace(/\..+$/, '');
  const ext = name.split('.').pop() || '';
  let counter = 1;
  
  while (siblings.some(f => f.name === `${base}_${counter}.${ext}`)) {
    counter++;
  }
  
  return `${base}_${counter}.${ext}`;
};
const handleSaveAs1 = async (name?: string) => {
  try {
    if (!fileId) {
      showToast("No file selected to save as", "error");
      return;
    }

    // 1. Get current file's location
    const parentId = verifyFileInTree(fileTree, fileId) ?? null;
    const parentFolder = parentId ? findNodeById(fileTree, parentId) : null;

    // 2. Get and validate filename
    let fileName = name?.trim() || window.prompt("Enter new file name:")?.trim();
    if (!fileName) {
      showToast("File name is required", "error");
      return;
    }

    // 3. Add extension if missing
    if (!fileName.includes(".")) {
      const originalExt = selectedNode?.name.split('.').pop() || "docx";
      fileName = `${fileName}.${originalExt}`;
    }

    // 4. Check for duplicates
    const siblings = parentId 
      ? parentFolder?.children || []
      : fileTree.filter(node => node.type === "FILE");

    if (siblings.some(f => f.name === fileName)) {
      const availableName = getAvailableName(fileName, siblings);
      const useSuggestedName = window.confirm(
        `"${fileName}" exists in ${parentFolder?.name || "root"}.\nUse "${availableName}"?`
      );
      if (!useSuggestedName) return;
      fileName = availableName;
    }

    // 5. Create new file
    const newFile = await createNode({
      name: fileName,
      type: "FILE",
      parentId: parentId || undefined,
      content
    });

    // 6. Update UI IMMEDIATELY (two-way sync)
    // Update local state
    const updatedTree = parentId
      ? updateTreeWithNewFile(fileTree, parentId, newFile)
      : [...fileTree, newFile];
    
    setFileTree(updatedTree);
    
    // Update parent component
    if (onFileTreeUpdate) {
      await onFileTreeUpdate(parentId || undefined);
    }

    // 7. Select the new file
    onDocumentSelect({
      ...newFile,
      children: [],
      content
    });

    showToast(`Saved as "${fileName}" in ${parentFolder?.name || "root"}`, "success");

  } catch (error) {
    handleApiError(error, showToast);
  }
};

// Helper function to update tree
const updateTreeWithNewFile = (
  tree: FileSystemNodeProps[],
  parentId: string,
  newFile: FileSystemNodeProps
): FileSystemNodeProps[] => {
  return tree.map(node => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newFile]
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeWithNewFile(node.children, parentId, newFile)
      };
    }
    return node;
  });
};
 
const handleSaveAs = async (name?: string) => {
  try {
    console.log("Current fileTree:", fileTree);
    console.log("Current fileId:", fileId);
    console.log("Selected node:", selectedNode);

    if (!fileId) {
      showToast("No file selected to save as");
      return;
    }

    // Ensure fileTree is loaded and up-to-date
    if (fileTree.length === 0 || !findNodeInTree(fileId, fileTree)) {
      console.log("Fetching updated fileTree...");
      if (onFileTreeUpdate) {
        const updatedTree = await onFileTreeUpdate();
        setFileTree(updatedTree); // Update the state
      }
      if (fileTree.length === 0) {
        showToast("File system not loaded. Try again.");
        return;
      }
    }

    // Resolve parentId (fallback to selectedNode or root)
    const parentId = verifyFileInTree(fileTree, fileId) 
      ?? selectedNode?.parentId 
      ?? findNodeInTree(fileId, fileTree)?.parentId;

    if (!parentId) {
      console.log("Saving to root directory");
    } else {
      console.log("Resolved parentId:", parentId);
    }

    const parentFolder = parentId ? findNodeById(fileTree, parentId) : null;

    // Get filename
    let fileName = name?.trim() || window.prompt("Enter new file name:")?.trim();
    if (!fileName) {
      showToast("File name is required");
      return;
    }

    // Ensure file extension
    if (!fileName.includes(".")) {
      const originalExt = selectedNode?.name.split('.').pop() || "docx";
      fileName = `${fileName}.${originalExt}`;
    }

    // Check for duplicates
    const siblings = parentId
      ? parentFolder?.children || []
      : fileTree.filter(node => node.type === "FILE");

    if (siblings.some(f => f.name === fileName)) {
      const availableName = getAvailableName(fileName, siblings);
      const useSuggestedName = window.confirm(
        `Filename conflict!\n\n` +
        `"${fileName}" already exists.\n\n` +
        `We suggest using: "${availableName}"\n\n` +
        `OK = Use suggested name\nCancel = Enter new name`
      );
      if (!useSuggestedName) return;
      fileName = availableName;
    }

    // Create new file
    const newFile = await createNode({
      name: fileName,
      type: "FILE",
      parentId, // undefined = root
      content,
    });

    // Update fileTree (with nested support)
    setFileTree(prevTree => {
      if (!prevTree) return []; // Ensure prevTree is defined
      if (!parentId) return [...prevTree, newFile];

      const updateTree = (nodes: FileSystemNodeProps[]): FileSystemNodeProps[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return { ...node, children: [...(node.children || []), newFile] };
          }
          if (node.children) {
            return { ...node, children: updateTree(node.children) };
          }
          return node;
        });
      };

      return updateTree(prevTree);
    });

    // Select the new file
    onDocumentSelect({
      ...newFile,
      children: [],
      content,
      parentId, // Ensure parentId is set
    });

    // Refresh tree
    if (onFileTreeUpdate) {
      await onFileTreeUpdate(parentId);
      await new Promise(resolve => setTimeout(resolve, 50)); // Let state update
    }

    showToast(`Saved as "${fileName}" in ${parentFolder?.name || "root"}`);
  } catch (error) {
    handleApiError(error, showToast);
  }
};
 
const findNodeById = (nodes: FileSystemNodeProps[], id: string): FileSystemNodeProps | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  useEffect(() => {
    if (fileId) {
      // Find the node in your nodes tree
      const findNode = (nodes: FileSystemNodeProps[]): FileSystemNodeProps | null => {
        for (const node of nodes) {
          if (node.id === fileId) return node;
          if (node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const current = findNode(nodes);
      setSelectedNode(current);
    }
  }, [fileId, nodes]);
  
  return (
    <div className="h-full flex">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[#f9f9f9]">
        {/* Header */}
        <div className="p-4 bg-[#f9f9f9]">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800/80">
              {fileName || "New Document"}
            </h1>

            <div className="flex items-center gap-2">
              <TranslationDropdown 
                onTranslate={handleTranslate}
                isLoading={isLoading("TRANSLATE_TEXT")}
              />
              {/* <SaveDropdown onSave={onSave} onSaveAs={onSaveAs} nodeId={nodeId} content={content} name={""} />
            */}
                <SaveDropdown
                       onSave={async () => {
                             if (!fileId) {
                                    console.error("❌ fileId is undefined. Can't save.");
                                       return;
                                         }
                                     console.log("✅ Saving document with fileId:", fileId);
                                      await updateNodeContent(fileId, content);
                                       }}
   
                                          onSaveAs={handleSaveAs} 
                                         name={fileName || ""}
                                         />
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative p-6 bg-white" ref={containerRef}>
          <QuillEditor
            content={content}
            onContentChange={onContentChange}
            onSelectionChange={handleSelectionChange}
          />

          {showAIPopup && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50" style={{ width: '600px' }}>
              <AIPopup
                onGenerate={handleGeneratedText}
                currentContent={content}
                selectedText={selectedText}
                cursorPosition={cursorPosition}
                cursorIndicatorPosition={cursorIndicatorPosition}
                documents={[]}
                files={[]}
                onTreeUpdate={handleTreeUpdate} 
              />
            </div>
          )}

          {/* Loading animation */}
          {generationState.isGenerating && cursorIndicatorPosition && (
            <div 
              className="pointer-events-none absolute z-50"
              style={{
                top: `${cursorIndicatorPosition.coords.top - 8}px`,
                left: `${cursorIndicatorPosition.coords.left}px`,
              }}
            >
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full shadow-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get caret coordinates
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  // Create a mirror div with exact same content and styling
  const mirror = document.createElement('div');
  mirror.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;
    box-sizing: border-box;
    width: ${element.offsetWidth}px;
    font: ${getComputedStyle(element).font};
    line-height: ${getComputedStyle(element).lineHeight};
    padding: ${getComputedStyle(element).padding};
  `;

  // Add text content up to cursor position
  const textBeforeCursor = element.value.slice(0, position);
  const textNode = document.createTextNode(textBeforeCursor);
  const span = document.createElement('span');
  span.appendChild(textNode);
  mirror.appendChild(span);
  
  // Add to DOM temporarily for measurement
  document.body.appendChild(mirror);
  
  // Get exact coordinates
  const rect = element.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();

  const coordinates = {
    top: spanRect.height + rect.top - element.scrollTop,
    left: spanRect.width + rect.left - element.scrollLeft
  };

  document.body.removeChild(mirror);
  return coordinates;
}
