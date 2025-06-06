"use client";

import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html";
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
import {
  diff_match_patch,
  DIFF_DELETE,
  DIFF_INSERT,
  DIFF_EQUAL,
} from "diff-match-patch";
import { Modal } from "@/components/ui/Modal";

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
  const [initialEditorHtml, setInitialEditorHtml] = useState<string | null>(
    null
  );
  const [diffData, setDiffData] = useState<{
    oldSide: string;
    newSide: string;
    unifiedDiff: string;
    hasChanges: boolean;
  } | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffViewMode, setDiffViewMode] = useState<"side-by-side" | "unified">(
    "side-by-side"
  );
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    loading: false,
  });

  useEffect(() => {
    lexicalEditorRef.current!.getEditorState().read(() => {
      const html = $generateHtmlFromNodes(lexicalEditorRef.current!);
      setInitialEditorHtml(html);
      console.log("[AI DIFF] Initial HTML stored:", html);
    });
  }, []);

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
    let tempElements: { para: ParagraphNode | null; text: TextNode | null } = {
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
    console.log("[AI STREAM] updateLiveText chunk:", chunk);
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
    console.log("[AI STREAM] renderFinalContent rawHtml:", rawHtml);
    const cleanHtml = rawHtml.trim();
    const dom = new DOMParser().parseFromString(cleanHtml, "text/html");

    lexicalEditorRef.current?.update(() => {
      $getRoot().clear();
      const nodes = $generateNodesFromDOM(lexicalEditorRef.current!, dom);
      const validNodes = nodes.filter($isElementNode);

      if (validNodes.length) {
        $insertNodes(validNodes);
      } else {
        $getRoot().append(
          $createParagraphNode().append($createTextNode(cleanHtml))
        );
      }
    });

    // Get new HTML and call showDiff
    if (lexicalEditorRef.current) {
      const newHtml = lexicalEditorRef.current.getEditorState().read(() => {
        return $generateHtmlFromNodes(lexicalEditorRef.current!);
      });
      console.log("[AI DIFF] New HTML generated:", newHtml);
      showDiff(initialEditorHtml, newHtml);
    }
  }
  function showDiff(oldHtml: string | null, newHtml: string) {
    if (oldHtml === null) {
      console.log("[AI DIFF] No initial HTML to compare.");
      return;
    }
    console.log("[AI DIFF] Old HTML:", oldHtml);
    console.log("[AI DIFF] New HTML:", newHtml);

    // Convert HTML to readable text for better diff visualization
    const oldText = htmlToText(oldHtml);
    const newText = htmlToText(newHtml);

    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diffs);

    // Create side-by-side diff
    let oldSide = "";
    let newSide = "";
    let unifiedDiff = "";

    for (const [op, data] of diffs) {
      const escapedText = data
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      switch (op) {
        case DIFF_INSERT:
          newSide += `<span class="bg-green-200 text-green-800 px-1 rounded">${escapedText}</span>`;
          unifiedDiff += `<span class="bg-green-200 text-green-800 px-1 rounded">+ ${escapedText}</span>`;
          break;
        case DIFF_DELETE:
          oldSide += `<span class="bg-red-200 text-red-800 px-1 rounded">${escapedText}</span>`;
          unifiedDiff += `<span class="bg-red-200 text-red-800 px-1 rounded">- ${escapedText}</span>`;
          break;
        case DIFF_EQUAL:
          oldSide += escapedText;
          newSide += escapedText;
          unifiedDiff += escapedText;
          break;
      }
    }
    const diffData = {
      oldSide,
      newSide,
      unifiedDiff,
      hasChanges: diffs.some(([op]) => op !== DIFF_EQUAL),
    };

    setDiffData(diffData);
    setIsDiffModalOpen(true);
  }

  function htmlToText(html: string): string {
    // Create a temporary div to parse HTML and extract text
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
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
      )}{" "}
      <Modal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        title="Content Differences"
        size="xl"
      >
        {diffData && (
          <div className="space-y-4">
            {!diffData.hasChanges ? (
              <div className="text-center py-8 text-gray-500">
                No changes detected between the original and AI-generated
                content.
              </div>
            ) : (
              <>
                {/* View Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setDiffViewMode("side-by-side")}
                    className={`px-3 py-1 rounded text-sm ${
                      diffViewMode === "side-by-side"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Side by Side
                  </button>
                  <button
                    onClick={() => setDiffViewMode("unified")}
                    className={`px-3 py-1 rounded text-sm ${
                      diffViewMode === "unified"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Unified
                  </button>
                </div>

                {/* Diff Content */}
                {diffViewMode === "side-by-side" ? (
                  <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    <div className="border rounded p-3">
                      <h4 className="font-semibold text-sm mb-2 text-red-700">
                        Original Content
                      </h4>
                      <div
                        className="text-sm whitespace-pre-wrap font-mono"
                        dangerouslySetInnerHTML={{ __html: diffData.oldSide }}
                      />
                    </div>
                    <div className="border rounded p-3">
                      <h4 className="font-semibold text-sm mb-2 text-green-700">
                        AI-Generated Content
                      </h4>
                      <div
                        className="text-sm whitespace-pre-wrap font-mono"
                        dangerouslySetInnerHTML={{ __html: diffData.newSide }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border rounded p-3 max-h-96 overflow-y-auto">
                    <h4 className="font-semibold text-sm mb-2">Unified Diff</h4>
                    <div
                      className="text-sm whitespace-pre-wrap font-mono"
                      dangerouslySetInnerHTML={{ __html: diffData.unifiedDiff }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
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
