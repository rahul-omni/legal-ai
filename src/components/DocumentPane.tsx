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
import { createNode, CreateNodePayload, fetchNodes, updateNodeContent } from "@/app/apiServices/nodeServices";
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
  selectedNode: FileSystemNodeProps | null;
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
  onDocumentSelect
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
   
     
  console.log("content",content);
  
   
  console.log("filesID",fileId);
  
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
     
   const refreshNodeswork1 = async (parentId?: string, fileId?: string) => {
      const children = await fetchNodes(parentId);
      if (!parentId) {
        setNodes(children);
        return;
      }
  
      if (fileId && children.length >= 0) {
        const file = children.find((node) => node.id === fileId);
        if (file) {
          onDocumentSelect(file);
        }
      }
  
      setNodes((prevNodes) => updateNodeChildren(prevNodes, children, parentId));
    };
 
  const handleSaveAswork1 = async (name?: string, parentId?: string) => {
    try {
      let fileName: string | undefined = name;
  
      if (!fileName) {
        const userInput = window.prompt("Please enter new file name:");
        if (!userInput || userInput.trim() === "") {
          alert("❌ File name is required to save.");
          return;
        }
        fileName = userInput.trim();
      }
  
      const newFile: CreateNodePayload = {
        name: fileName,
        type: "FILE",
         
        parentId,
        content, // current content from editor
      };
  
      const uploadedNode = await createNode(newFile);
      const now = new Date();
  
      const localNode: FileSystemNodeProps = {
        id: uploadedNode?.id || Date.now().toString(),
        name: newFile.name,
        type: "FILE",
        userId: "",
        children: [],
        createdAt: now,
        updatedAt: now,
      };
  
      handleAddDocument(localNode, parentId ?? null);
  
       await refreshNodes();
      showToast("✅ Document saved as new file!");
    } catch (error) {
      handleApiError(error, showToast);
    }
  };
   
  const refreshNodes = async (parentId?: string) => {
    try {
      const children = await fetchNodes(parentId);
      if (!parentId) {
        setNodes(children);
      } else {
        setNodes(prevNodes => {
          const updateChildren = (nodes: FileSystemNodeProps[]): FileSystemNodeProps[] => {
            return nodes.map(node => {
              if (node.id === parentId) {
                return { ...node, children };
              }
              if (node.children) {
                return { ...node, children: updateChildren(node.children) };
              }
              return node;
            });
          };
          return updateChildren(prevNodes);
        });
      }
    } catch (error) {
      handleApiError(error, showToast);
    }
  };
   
  const handleSaveAs = async (name?: string) => {
    try {
      // 1. Get filename
      let fileName = name?.trim() || window.prompt("File name:")?.trim();
      if (!fileName) {
        alert("Filename required");
        return;
      }
  
      // 2. Add extension if missing
      if (!fileName.includes('.')) {
        fileName += '.docx';
      }
  
      // 3. Determine parent folder
      const parentId = selectedNode
        ? selectedNode.type === "FOLDER" 
          ? selectedNode.id 
          : selectedNode.parentId ?? null
        : null;
  
      // 4. Handle root save confirmation
      if (parentId === null) {
        const confirmSave = window.confirm(
          `Save "${fileName}" to root directory?`
        );
        if (!confirmSave) return;
      }
  
      // 5. Create file payload
      const newFile = {
        name: fileName,
        type: "FILE",
        parentId,
        content
      };
  
      // 6. Save to backend
      const savedFile = await createNode(newFile);
      
      // 7. Create complete node object with all required properties
      const fileNode: FileSystemNodeProps = {
        id: savedFile.id,
        name: fileName,
        type: "FILE",
        userId: savedFile.userId || "", // Required field
        parentId,
        content,
        children: [], // Required if defined in interface
        createdAt: new Date(),
        updatedAt: new Date(),
        // Include any other required properties
      };
  
      // 8. Update UI
      handleAddDocument(fileNode, parentId); // Now types match
      await refreshNodes(parentId);
      onDocumentSelect(fileNode);
      showToast(`Saved: ${fileName}`);
  
    } catch (error) {
      console.error('Save failed:', error);
      showToast('Save failed', 'error');
    }
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
               
                 {/* <SaveDropdown
                 onSave={async () => {
                  if (!fileId) {
                    console.error("❌ fileId is undefined. Can't save.");
                    return;
                  }
                   console.log("✅ Saving document with fileId:", fileId);
                  await updateNodeContent(fileId, content   ); // <-- use 'content' prop
                   
                } }
                onSaveAs={handleSaveAs}
                //onSaveAs={onSaveAs} 
                name={""} 
               />     */}

<SaveDropdown
  onSave={async () => {
    if (!fileId) {
      console.error("❌ fileId is undefined. Can't save.");
      return;
    }
    console.log("✅ Saving document with fileId:", fileId);
    await updateNodeContent(fileId, content);
  }}
  onSaveAs={async () => {
    // Safely handle the parentId type
    const parentId = selectedNode
      ? selectedNode.type === "FOLDER"
        ? selectedNode.id
        : selectedNode.parentId ?? null // Fallback to null if parentId is undefined
      : null;

    console.log("Saving to parent:", parentId);
    
    const newFile = await handleSaveAs(
      undefined, // No default name
      parentId,  // Now properly typed as string | null
           // Current editor content
    );
    
    if (newFile) {
      onDocumentSelect(newFile);
    }
  }}
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
