"use client";

import { $generateNodesFromDOM } from "@lexical/html";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $insertNodes,
  $isElementNode,
  ParagraphNode,
  TextNode,
} from "lexical";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";
import { AIPopup } from "./AIPopup";
import { DocumentEditor } from "./DocumentEditor";
import { DocumentPaneTopBar } from "./DocumentPaneTopBar";
import { ReviewRequestModal } from "./ReviewRequestModal";

interface GenerationState {
  isGenerating: boolean;
  loading: boolean;
  insertPosition?: {
    line: number;
    column: number;
    coords: { left: number; top: number };
  };
}

export function DocumentPane() {
  const { docEditorState, lexicalEditorRef, docEditorDispatch } = useDocumentEditor();
  const [selectedText, setSelectedText] = useState<string>();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    loading: false,
  });

  const [initialContent, setInitialContent] = useState<string>("")

  useEffect(()=>{
    setInitialContent(activeTab?.content || "")
  }, [docEditorState.activeTabId])

   useEffect(()=>{
    if(docEditorState.isAIEdit){
      setInitialContent(activeTab?.content || "")
      docEditorDispatch({
        type: "UPDATE_IS_AI_EDIT",
        payload: { isAIEdit: false },
      });
    }
  }, [docEditorState.isAIEdit])

  const activeTab = docEditorState.openTabs.find(
    (tab) => tab.id === docEditorState.activeTabId
  );
  let tempElements: { para: ParagraphNode | null; text: TextNode | null } = {
    para: null,
    text: null,
  };
  async function handlePromptSubmit(prompt: string, fullText?: string, files?: string[]) {
    if (!prompt.trim() || !lexicalEditorRef.current) return;
    setGenerationState({ isGenerating: true, loading: true });

    try {
      const response = await fetchAIResponse(prompt, fullText, files);
      await processAIStream(response);
    } finally {
      setGenerationState({ isGenerating: false, loading: false });
    }
  }

  async function fetchAIResponse(prompt: string, context?: string, files?: string[]) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        text: context || activeTab?.content || "",
        files
      }),
    });
    setGenerationState({ isGenerating: true, loading: false });
    return res.body;
  }

  async function processAIStream(stream: ReadableStream<Uint8Array> | null) {
    if (!stream) return;
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullHtml = "";
    

    while (true) {
      const { value, done } = await reader.read();
      if (!value && !done) continue;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        fullHtml += chunk;
        updateLiveText(chunk, tempElements);
      }

      if (done) {
        renderFinalContent(fullHtml);
        break;
      }

      
    }
  }

  function updateLiveText(
    chunk: string,
    elements: { para: ParagraphNode | null; text: TextNode | null }
  ) {
    lexicalEditorRef.current?.update(() => {
      if (!tempElements.para) {
        tempElements.para = $createParagraphNode();
        tempElements.text = $createTextNode("");
        tempElements.para.append(tempElements.text);
        $getRoot().append(tempElements.para);
      }
      if (tempElements.text) {
        tempElements.text.setTextContent(tempElements.text.getTextContent() + chunk);
      }
    });
  }

  function renderFinalContent(rawHtml: string) {
    const cleanHtml = stripCodeFences(rawHtml).trim();
    const dom = new DOMParser().parseFromString(cleanHtml, "text/html");
    if (docEditorState.activeTabId) {
      docEditorDispatch({
        type: "UPDATE_TAB_CONTENT",
        payload: { tabId: docEditorState.activeTabId, content: activeTab?.content + cleanHtml },
      });
    }

    lexicalEditorRef.current?.update(() => {
      // 1️⃣ drop the temp paragraph if it exists
      if (tempElements.para) {
        tempElements.para.remove();
        tempElements = { para: null, text: null };
      }
  
      // 2️⃣ convert & insert final nodes
      const nodes = $generateNodesFromDOM(lexicalEditorRef.current!, dom);
      const validNodes = nodes.filter($isElementNode);
  
      $getRoot().selectEnd();   // caret to end
      if (validNodes.length) {
        $insertNodes(validNodes);
      } else {
        $insertNodes([
          $createParagraphNode().append($createTextNode(cleanHtml)),
        ]);
      }
    });
  }
  

  function stripCodeFences(raw: string): string {
    return raw
      .replace(/^```(?:html)?\s*\n?/i, "") // opening fence
      .replace(/\n?```$/i, "") // closing fence
      .trim();
  }

  const onFileReviewRequest = () => {
    if (activeTab?.fileId) {
      setShowReviewModal(true);
    } else {
      toast.error("Please save the document first before requesting a review");
    }
  };

  const updateContent = (content : string)=>{
    if (docEditorState.isTranslating && docEditorState.translatingTab == activeTab?.id){
      return `<div>${initialContent} translating...</div>`
    }
    return content;
  }

  return (
    <div className="flex flex-col h-full">
      <DocumentPaneTopBar onFileReviewRequest={onFileReviewRequest} />
      <div className="flex-1 relative bg-white">
        <DocumentEditor
          localContent={updateContent(initialContent)}
          handleSelectionChange={setSelectedText}
          activeTabId={docEditorState.activeTabId || ""}
        />

        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[600px]">
          <AIPopup
            onPromptSubmit={handlePromptSubmit}
            selectedText={selectedText}
            cursorPosition={undefined}
            isFolderPickerOpen={docEditorState.isFolderPickerOpen}
          />
        </div>
        <GenerationIndicator isGenerating={generationState.loading} />
      </div>
      {activeTab?.fileId && (
        <ReviewRequestModal
          isOpen={showReviewModal}
          fileId={activeTab.fileId}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
}

function GenerationIndicator({ isGenerating }: { isGenerating: boolean }) {
  if (!isGenerating) return null;
  return (
    <div className="top-16 left-4 pointer-events-none absolute z-50">
      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full shadow-lg">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:150ms]" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  );
}
