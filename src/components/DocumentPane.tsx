"use client";

 
import { loadingContext } from "@/context/loadingContext";
import { handleApiError } from "@/helper/handleApiError";
import { TranslationVendor } from "@/lib/translation/types";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { useEffect, useRef, useState } from "react";
import { AIPopup } from "./AIPopup";
import { QuillEditor } from "./QuillEditor";
import { SaveDropdown } from "./SaveDropdown";
import { TranslationDropdown } from "./TranslationDropdown";
 
import { createNewFile, createNode, CreateNodePayload, fetchAllNodes, fetchNodes, updateNodeContent } from "@/app/apiServices/nodeServices";
 
 
import { useToast } from "./ui/toast";
import { ReviewRequestModal } from "./ReviewRequestModal";

interface DocumentPaneProps {
  content: string;
  onContentChange: (_content: string) => void;
  fileName: string;
  fileId?: string | null;
  onDocumentSelect: (doc: FileSystemNodeProps) => void;
   onFileTreeUpdate: (parentId?: string) => Promise<FileSystemNodeProps[]>;
  //onFileTreeUpdate?: () => Promise<void>;
  isNewFile?: boolean;
  node :FileSystemNodeProps[]
  onFileCreated?: (fileId: string) => void; // Add this new prop
  onInitiateSave?: (
    name: string,
    content: string,
    parentId: string | null,
    fileId: string | null,
    callback?: (newFile: FileSystemNodeProps) => void
  ) => void;
  
  // ✅ NEW: Add this to control AIPopup visibility
  isFolderPickerOpen?: boolean;
  isNewFileMode?: boolean;
  // userId: string;
  // documents: any[];
  // files: any[];
}

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
  fileId,
  onDocumentSelect,
  onFileTreeUpdate,
  isNewFile = !fileId,
  onFileCreated,
  onInitiateSave,
  isFolderPickerOpen,
  isNewFileMode,
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
  const [selectedLanguage, setSelectedLanguage] = useState("hi-IN");
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
    isGenerating: false,
  });

  const [nodes, setNodes] = useState<FileSystemNodeProps[]>([]);
  const { showToast } = useToast();
  const [selectedNode, setSelectedNode] = useState<FileSystemNodeProps | null>(
    null
  );

  const [fileTree, setFileTree] = useState<FileSystemNodeProps[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleTreeUpdate = (newTree: FileSystemNodeProps[]) => {
    setFileTree(newTree);
    //console.log("Tree received in DocumentPane:", newTree);
  };
     

 
  // useEffect(() => {
  //   console.log("Fetching file tree on mount...");
  //   fetchUpdatedFileTree();
  // }, []);
  
  
  //console.log("content",content);
 
   

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
          : "root",
      });
      return result.parent?.id || null;
    }

    console.error("File not found in tree");
    return null;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        saveDropdownRef.current &&
        !saveDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSaveDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        translationDropdownRef.current &&
        !translationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTranslateDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const cursorIndex = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorIndex);

    const lines = textBeforeCursor.split("\n");

    const line = lines.length;

    const currentLine = lines[lines.length - 1] || "";

    console.log("Cursor position details:", {
      cursorIndex,
      totalLines: lines.length,
      currentLine,
      allLines: lines.map((l, i) => `Line ${i + 1}: "${l}"`),
    });

    let column = 1;
    for (let i = 0; i < currentLine.length; i++) {
      if (currentLine[i] === "\t") {
        column += 4 - ((column - 1) % 4);
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
      coords: coordinates,
    });
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleScroll = () => {
      if (!selectedText) {
        updateCursorIndicator();
      }
    };

    textarea.addEventListener("scroll", handleScroll);
    return () => textarea.removeEventListener("scroll", handleScroll);
  }, [selectedText]);

  const handleTranslate = async (
    vendor: TranslationVendor,
    language: string
  ) => {
    try {
      setSelectedLanguage(language);
      startLoading("TRANSLATE_TEXT");
      
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vendor,
          sourceText: selectedText || content,
          targetLanguage: language,
          mode: "formal",
        }),
      });

      if (!response.ok) throw new Error("Translation failed");
      const data = await response.json();
      
      console.log("Translated text:", data.translation);
      console.log("Raw translation response:", data);
      console.log("Translation text type:", typeof data.translation);
      console.log("First 10 characters:", Array.from(data.translation).slice(0, 10).map(c => c.charCodeAt(0)));
      
      // For Quill editor, use the HTML paste method
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        
        // Clear the editor if needed
        // quill.setText('');
        
        // Insert the translated text with proper encoding
        quill.clipboard.dangerouslyPasteHTML(data.translation);
      } else {
        // Fallback to the regular content change
      onContentChange(data.translation);
      }
    } catch (error) {
      console.error("Translation error:", error);
      showToast("Failed to translate text", "error");
    } finally {
      stopLoading("TRANSLATE_TEXT");
    }
  };






const quillRef = useRef<any>(null);           // ✅ direct Quill ref
const caretIdxRef = useRef<number | null>(null);
const quillInstRef = useRef<any>(null);  

  const handlePromptSubmit = async (prompt: string) => {
    if (!prompt.trim()) return;

    setGenerationState({ isGenerating: true });

    const getQuill = () => quillRef.current?.getEditor?.();

  try {
    // Determine what text to send as context
    let contextText;
    
    // If there's selected text, use that as the context
    if (selectedText) {
      contextText = selectedText;
    } 
    // Otherwise use the entire document content
    else {
      contextText = quillRef.current ? 
        quillRef.current.getEditor().getText() : 
        content;
    }
    
    // Call API with both prompt and context
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt,
        text: contextText
      }),
    });
    
    if (!res.body) throw new Error("No stream returned");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

      const q0 = getQuill();

      if (!q0) {
        setTimeout(() => handlePromptSubmit(prompt), 100);
        setGenerationState({ isGenerating: false });
        return;
      }

      console.log("✅ Quill instance ready:", q0);

      const endOfDoc = q0.getLength?.();
      const startIdx =
        caretIdxRef.current ??
        q0.getSelection()?.index ??
        (endOfDoc ? endOfDoc - 1 : undefined) ??
        0;

      console.log("📌 Insert starts at index:", startIdx);

      let htmlFallback = content;
      let insertPos = startIdx;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const quill = getQuill();
        if (quill && startIdx !== null) {
          quill.insertText(insertPos, chunk, "api");
          insertPos += chunk.length;
          quill.setSelection(insertPos, 0, "api");

        // Auto-scroll to bottom
        const root = quill.root as HTMLElement;
        //root.scrollTop = root.scrollHeight;
      } else {
        // fallback path
        htmlFallback += chunk;
        onContentChange(htmlFallback);
      }
    }

      if (!quillRef.current) {
        onContentChange(htmlFallback);
      }
    } catch (err) {
      console.error("❌ Generation failed:", err);
    } finally {
      setGenerationState({ isGenerating: false });
    }
  };

  const [caretIdx, setCaretIdx] = useState<number | null>(null);
  const lastCaret = useRef<number | null>(null);

  const handleSelectionChange = (
    range: { index: number; length: number } | null
  ) => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill) {
      console.log("❌ Quill instance not found");
      return;
    }

    if (!range) {
      setSelectedText("");
      return;
    }

    if (range.length === 0) {
      caretIdxRef.current = range.index;
      setCaretIdx(range.index);
    }

    if (range.length > 0) {
      const selected = quill.getText(range.index, range.length);
      setSelectedText(selected);
    } else {
      setSelectedText("");
    }

    lastCaret.current = range.index;
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

  const findNodeInTree = (
    id: string,
    nodes: FileSystemNodeProps[]
  ): FileSystemNodeProps | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeInTree(id, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const getAvailableName = (name: string, siblings: FileSystemNodeProps[]) => {
    const base = name.replace(/\..+$/, "");
    const ext = name.split(".").pop() || "";
    let counter = 1;

    while (siblings.some((f) => f.name === `${base}_${counter}.${ext}`)) {
      counter++;
    }

    return `${base}_${counter}.${ext}`;
  };

  const updateTreeWithNewFile = (
    tree: FileSystemNodeProps[],
    parentId: string,
    newFile: FileSystemNodeProps
  ): FileSystemNodeProps[] => {
    return tree.map((node) => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), newFile],
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeWithNewFile(node.children, parentId, newFile),
        };
      }
      return node;
    });
  };

  const handleSaveAs = async (name?: string) => {
    try {
      if (!fileId) {
        showToast("No file selected to save as");
        return;
      }

      if (fileTree.length === 0 || !findNodeInTree(fileId, fileTree)) {
        console.log("Fetching updated fileTree...");
        if (onFileTreeUpdate) {
          const updatedTree = await onFileTreeUpdate();
          setFileTree(updatedTree);
        }
        if (fileTree.length === 0) {
          showToast("File system not loaded. Try again.");
          return;
        }
      }

      const parentId =
        verifyFileInTree(fileTree, fileId) ??
        selectedNode?.parentId ??
        findNodeInTree(fileId, fileTree)?.parentId;

      if (!parentId) {
        console.log("Saving to root directory");
      } else {
        console.log("Resolved parentId:", parentId);
      }

      const parentFolder = parentId ? findNodeById(fileTree, parentId) : null;

      let fileName =
        name?.trim() || window.prompt("Enter new file name:")?.trim();
      if (!fileName) {
        showToast("File name is required");
        return;
      }

      if (!fileName.includes(".")) {
        const originalExt = selectedNode?.name.split(".").pop() || "docx";
        fileName = `${fileName}.${originalExt}`;
      }

      const siblings = parentId
        ? parentFolder?.children || []
        : fileTree.filter((node) => node.type === "FILE");

      if (siblings.some((f) => f.name === fileName)) {
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

      const newFile = await createNode({
        name: fileName,
        type: "FILE",
        parentId,
        content,
      });

      setFileTree((prevTree) => {
        if (!prevTree) return [];
        if (!parentId) return [...prevTree, newFile];

        const updateTree = (
          nodes: FileSystemNodeProps[]
        ): FileSystemNodeProps[] => {
          return nodes.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                children: [...(node.children || []), newFile],
              };
            }
            if (node.children) {
              return { ...node, children: updateTree(node.children) };
            }
            return node;
          });
        };

        return updateTree(prevTree);
      });

      onDocumentSelect({
        ...newFile,
        children: [],
        content,
        parentId,
      });

      if (onFileTreeUpdate) {
        await onFileTreeUpdate(parentId);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      showToast(`Saved as "${fileName}" in ${parentFolder?.name || "root"}`);
    } catch (error) {
      handleApiError(error, showToast);
    }
  };

  const onFileReviewRequest = () => {
    
    setShowReviewModal(true);
  };

  const handleReviewSubmit = (userId: string) => {
    showToast(`Review requested from user ID: ${userId}`);
  };

  const findNodeById = (
    nodes: FileSystemNodeProps[],
    id: string
  ): FileSystemNodeProps | null => {
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
      const findNode = (
        nodes: FileSystemNodeProps[]
      ): FileSystemNodeProps | null => {
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
  
  const [isSaving, setIsSaving] = useState(false);
  // In DocumentPane.tsx
  const [localFileName, setLocalFileName] = useState(fileName || "Untitled");
  const [localContent, setLocalContent] = useState(content);
   
// Sync with parent when props change
useEffect(() => {
  setLocalContent(content);
  setLocalFileName(fileName || "Untitled");
}, [content, fileName, fileId]);

  // Handle saving for both new and existing files
 
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!fileId) {
        let newName = prompt("Create new file name:", localFileName);
        if (!newName) {
          setIsSaving(false);
          return;
        }
  
      // ✅ Enforce `.docx` extension directly on `newName`
      if (!newName.includes(".")) {
        newName = `${newName}.docx`;
      }

        let parentId: string | null = null;
          
          if (onInitiateSave) {
            onInitiateSave(newName, localContent, parentId, null, (newFile) => {
              if (onFileCreated) onFileCreated(newFile.id);
            });
            return;
          }
        // fallback if folder picker isn't used
        const newNode = await createNewFile({
          name: newName,
          content: localContent,
          parentId,
          type: "FILE",
        });
  
        setLocalFileName(newName);
        if (onFileCreated) onFileCreated(newNode.id);
        showToast("File created successfully", "success");
        return newNode.id;
      } else {
        await updateNodeContent(fileId, localContent);
        showToast("File saved successfully", "success");
        return fileId;
      }
    } catch (error) {
      showToast(error.message || "Failed to save", "error");
      console.error("Save error:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleEditorChange = (newContent: string) => {
    setLocalContent(newContent);
    onContentChange(newContent);
  };
  return (
    <>
         
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200">
        <div className="flex justify-between items-center px-3 py-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-medium text-gray-700 truncate max-w-md">
              { localFileName || "Untitled Document"} {!fileId && "(Unsaved)"}
            </h2>
          </div>
          <div className="flex items-center space-x-1">
            <TranslationDropdown
              onTranslate={handleTranslate}
              isLoading={isLoading("TRANSLATE_TEXT")}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              selectedVendor={translationVendor}
              onVendorChange={setTranslationVendor}
            />

           {!isNewFileMode && (   <button
              onClick={onFileReviewRequest}
              className="ml-2 px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg
                   hover:bg-green-100 transition-colors"
            >
              Review Request
            </button>)}
            <SaveDropdown
              
              onSave={handleSave}
              onSaveAs={handleSaveAs}
              isNewFile={!fileId} 
              name={localFileName || ""}
              isSaving={isSaving}
              
            />
          </div>
        </div>
      </div>

      <div className="flex-1 relative p-3 bg-white" ref={containerRef}>
        <QuillEditor
          ref={quillRef}
         // content={content}
          content={ localContent}
          onContentChange={handleEditorChange}
         // onContentChange={onContentChange}
          onSelectionChange={handleSelectionChange}
        />

        {showAIPopup && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50" style={{ width: '600px' }}>
          <AIPopup
              onPromptSubmit={handlePromptSubmit}
            currentContent={content}
            selectedText={selectedText}
              cursorPosition={cursorPosition}
              cursorIndicatorPosition={cursorIndicatorPosition}
              documents={[]}
              files={[]}
              onTreeUpdate={handleTreeUpdate} 
              isFolderPickerOpen={isFolderPickerOpen}
            />
          </div>
        )}

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

      <ReviewRequestModal
        isOpen={showReviewModal}
        fileId={fileId!}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
      />
    </div>
    </>
  );
}

function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const mirror = document.createElement("div");
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

  const textBeforeCursor = element.value.slice(0, position);
  const textNode = document.createTextNode(textBeforeCursor);
  const span = document.createElement("span");
  span.appendChild(textNode);
  mirror.appendChild(span);

  document.body.appendChild(mirror);

  const rect = element.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();

  const coordinates = {
    top: spanRect.height + rect.top - element.scrollTop,
    left: spanRect.width + rect.left - element.scrollLeft,
  };

  document.body.removeChild(mirror);
  return coordinates;
}
