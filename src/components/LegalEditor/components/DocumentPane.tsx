"use client";

import {
  createNewFile,
  createNode,
  updateNodeContent,
} from "@/app/apiServices/nodeServices";
import { loadingContext } from "@/context/loadingContext";
import { handleApiError } from "@/helper/handleApiError";
import { TranslationVendor } from "@/lib/translation/types";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $getSelection, LexicalEditor } from "lexical";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../../ui/toast";
import { AIPopup } from "./AIPopup";
import { DocumentEditor, insertTextAtSelection } from "./DocumentEditor";
import { DocumentPaneTopBar } from "./DocumentPaneTopBar";
import { ReviewRequestModal } from "./ReviewRequestModal";

//#region Types & Interfaces

interface DocumentPaneProps {
  content: string;
  onContentChange: (_content: string) => void;
  fileName: string;
  fileId?: string | null;
  onDocumentSelect: (_doc: FileSystemNodeProps) => void;
  onFileTreeUpdate: (_parentId?: string) => Promise<FileSystemNodeProps[]>;
  onFileCreated?: (_fileId: string) => void;
  onInitiateSave?: (
    _name: string,
    _content: string,
    _parentId: string | null,
    _fileId: string | null,
    _callback?: (_newFile: FileSystemNodeProps) => void
  ) => void;
  isFolderPickerOpen?: boolean;
  isNewFileMode?: boolean;
}

interface GenerationState {
  isGenerating: boolean;
  insertPosition?: {
    line: number;
    column: number;
    coords: { left: number; top: number };
  };
}

//#endregion

//#region Helper Functions

function verifyFileInTree(tree: FileSystemNodeProps[], targetFileId: string) {
  const result = {
    file: null as FileSystemNodeProps | null,
    parent: null as FileSystemNodeProps | null,
  };
  const findFile = (
    nodes: FileSystemNodeProps[],
    parent: FileSystemNodeProps | null
  ): boolean => {
    for (const node of nodes) {
      if (node.id === targetFileId) {
        result.file = node;
        result.parent = parent;
        return true;
      }
      if (node.type === "FOLDER" && node.children) {
        if (findFile(node.children, node)) return true;
      }
    }
    return false;
  };
  findFile(tree, null);
  return result.file ? result.parent?.id || null : null;
}

function findNodeById(
  nodes: FileSystemNodeProps[],
  id: string
): FileSystemNodeProps | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getAvailableName(name: string, siblings: FileSystemNodeProps[]) {
  const base = name.replace(/\..+$/, "");
  const ext = name.split(".").pop() || "";
  let counter = 1;
  while (siblings.some((f) => f.name === `${base}_${counter}.${ext}`))
    counter++;
  return `${base}_${counter}.${ext}`;
}

//#endregion

export function DocumentPane({
  content,
  onContentChange,
  fileName,
  fileId,
  onDocumentSelect,
  onFileTreeUpdate,
  onFileCreated,
  onInitiateSave,
  isFolderPickerOpen,
  isNewFileMode,
}: DocumentPaneProps) {
  //#region State & Refs

  const [selectedText, setSelectedText] = useState<string>();
  const [translationVendor, setTranslationVendor] =
    useState<TranslationVendor>("openai");
  const [selectedLanguage, setSelectedLanguage] = useState("hi-IN");
  const { isLoading, startLoading, stopLoading } = loadingContext();
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
  });
  const { showToast } = useToast();
  const [selectedNode, setSelectedNode] = useState<FileSystemNodeProps | null>(
    null
  );
  const [fileTree, setFileTree] = useState<FileSystemNodeProps[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localFileName, setLocalFileName] = useState(fileName || "Untitled");
  const [localContent, setLocalContent] = useState(content);

  const editorRef = useRef<LexicalEditor>(null);

  //#endregion

  //#region Effects

  // Sync local state with props
  useEffect(() => {
    setLocalContent(content);
    setLocalFileName(fileName || "Untitled");
  }, [content, fileName, fileId]);

  // Track selected node by fileId
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
      const current = findNode(fileTree);
      setSelectedNode(current);
    }
  }, [fileId, fileTree]);

  //#endregion

  //#region Handlers

  const handleTranslate = async (
    vendor: TranslationVendor,
    language: string
  ) => {
    try {
      setSelectedLanguage(language);
      startLoading("TRANSLATE_TEXT");
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor,
          sourceText: selectedText || content,
          targetLanguage: language,
          mode: "formal",
        }),
      });
      if (!response.ok) throw new Error("Translation failed");
      const data = await response.json();

      if (editorRef.current) {
        editorRef.current.update(() => {
          const selection = $getSelection();
          if (selection) {
            selection.insertText(data.translation);
          } else {
            const root = $getRoot();
            root.clear();
            const parser = new DOMParser();
            const dom = parser.parseFromString(data.translation, "text/html");
            const nodes = $generateNodesFromDOM(editorRef.current!, dom);
            root.append(...nodes);
          }
        });
      } else {
        onContentChange(data.translation);
      }
    } catch {
      showToast("Failed to translate text", "error");
    } finally {
      stopLoading("TRANSLATE_TEXT");
    }
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!prompt.trim()) return;
    setGenerationState({ isGenerating: true });

    try {
      const contextText = selectedText || content;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, text: contextText }),
      });

      if (!res.body) throw new Error("No stream returned");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      if (!editorRef.current) {
        setTimeout(() => handlePromptSubmit(prompt), 100);
        setGenerationState({ isGenerating: false });
        return;
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (editorRef.current) {
          insertTextAtSelection(editorRef.current, chunk);
        }
      }
    } finally {
      setGenerationState({ isGenerating: false });
    }
  };

  const handleSelectionChange = (text?: string) => {
    setSelectedText(text);
  };

  const handleSaveAs = async (name?: string) => {
    try {
      if (!fileId) {
        showToast("No file selected to save as");
        return;
      }
      if (fileTree.length === 0 || !findNodeById(fileTree, fileId)) {
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
        findNodeById(fileTree, fileId)?.parentId;
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
          `Filename conflict!\n\n"${fileName}" already exists.\n\nWe suggest using: "${availableName}"\n\nOK = Use suggested name\nCancel = Enter new name`
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
        ): FileSystemNodeProps[] =>
          nodes.map((node) =>
            node.id === parentId
              ? { ...node, children: [...(node.children || []), newFile] }
              : node.children
                ? { ...node, children: updateTree(node.children) }
                : node
          );
        return updateTree(prevTree);
      });
      onDocumentSelect({ ...newFile, children: [], content, parentId });
      if (onFileTreeUpdate) {
        await onFileTreeUpdate(parentId);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      showToast(`Saved as "${fileName}" in ${parentFolder?.name || "root"}`);
    } catch (error) {
      handleApiError(error, showToast);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!fileId) {
        let newName = prompt("Create new file name:", localFileName);
        if (!newName) {
          setIsSaving(false);
          return;
        }
        if (!newName.includes(".")) newName = `${newName}.docx`;
        const parentId: string | null = null;
        if (onInitiateSave) {
          onInitiateSave(newName, localContent, parentId, null, (newFile) => {
            if (onFileCreated) onFileCreated(newFile.id);
          });
          return;
        }
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
    } catch (error: any) {
      showToast(error.message || "Failed to save", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const onFileReviewRequest = () => setShowReviewModal(true);

  //#endregion

  //#region Render

  return (
    <>
      <div className="flex flex-col h-full">
        <DocumentPaneTopBar
          localFileName={localFileName}
          fileId={fileId}
          isNewFileMode={isNewFileMode}
          handleTranslate={handleTranslate}
          isLoading={isLoading("TRANSLATE_TEXT")}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          translationVendor={translationVendor}
          setTranslationVendor={setTranslationVendor}
          onFileReviewRequest={onFileReviewRequest}
          handleSave={handleSave}
          handleSaveAs={handleSaveAs}
          isSaving={isSaving}
        />
        <div className="flex-1 relative bg-white">
          <DocumentEditor
            localContent={localContent}
            editorRef={editorRef}
            handleSelectionChange={handleSelectionChange}
            onSelectedTextChange={setSelectedText}
          />

          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[600px]">
            <AIPopup
              onPromptSubmit={handlePromptSubmit}
              currentContent={content}
              selectedText={selectedText}
              cursorPosition={undefined}
              isFolderPickerOpen={isFolderPickerOpen}
            />
          </div>
          <GenerationIndicator isGenerating={generationState.isGenerating} />
        </div>
        <ReviewRequestModal
          isOpen={showReviewModal}
          fileId={fileId!}
          onClose={() => setShowReviewModal(false)}
        />
      </div>
    </>
  );

  //#endregion
}

function GenerationIndicator({ isGenerating }: { isGenerating: boolean }) {
  if (!isGenerating) return null;
  return (
    <div className="pointer-events-none absolute z-50">
      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full shadow-lg">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:150ms]" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  );
}
