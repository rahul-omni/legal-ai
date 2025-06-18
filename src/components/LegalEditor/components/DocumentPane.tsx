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
import { useState } from "react";
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
  const { docEditorState, lexicalEditorRef } = useDocumentEditor();
  const [selectedText, setSelectedText] = useState<string>();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    loading: false,
  });

  const activeTab = docEditorState.openTabs.find(
    (tab) => tab.id === docEditorState.activeTabId
  );

  async function handlePromptSubmit(prompt: string, fullText?: string) {
    if (!prompt.trim() || !lexicalEditorRef.current) return;
    setGenerationState({ isGenerating: true, loading: true });

    try {
      const response = await fetchAIResponse(prompt, fullText);
      await processAIStream(response);
    } finally {
      setGenerationState({ isGenerating: false, loading: false });
    }
  }

  async function fetchAIResponse(prompt: string, context?: string) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        text: context || activeTab?.content || "",
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
    const tempElements: { para: ParagraphNode | null; text: TextNode | null } = {
      para: null,
      text: null,
    };

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
      if (!elements.para) {
        elements.para = $createParagraphNode();
        elements.text = $createTextNode("");
        elements.para.append(elements.text);
        $getRoot().append(elements.para);
      }
      if (elements.text) {
        elements.text.setTextContent(elements.text.getTextContent() + chunk);
      }
    });
  }

  function renderFinalContent(rawHtml: string) {
    const cleanHtml = stripCodeFences(rawHtml).trim();
    const dom = new DOMParser().parseFromString(cleanHtml, "text/html");

    lexicalEditorRef.current?.update(() => {
      $getRoot().clear();
      const nodes = $generateNodesFromDOM(lexicalEditorRef.current!, dom);
      const validNodes = nodes.filter($isElementNode);

      if (validNodes.length) {
        $insertNodes(validNodes);
      } else {
        // Fallback for invalid HTML
        $getRoot().append(
          $createParagraphNode().append($createTextNode(cleanHtml))
        );
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

  return (
    <div className="flex flex-col h-full">
      <DocumentPaneTopBar onFileReviewRequest={onFileReviewRequest} />
      <div className="flex-1 relative bg-white">
        <DocumentEditor
          localContent={activeTab?.content || ""}
          handleSelectionChange={setSelectedText}
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
