"use client";

import { $generateNodesFromDOM } from "@lexical/html";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $insertNodes,
  $isElementNode,
} from "lexical";
import { useState } from "react";
import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";
import { AIPopup } from "./AIPopup";
import { DocumentEditor } from "./DocumentEditor";
import { DocumentPaneTopBar } from "./DocumentPaneTopBar";
import { ReviewRequestModal } from "./ReviewRequestModal";
import toast from "react-hot-toast";

interface GenerationState {
  isGenerating: boolean;
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
  });

  const activeTab = docEditorState.openTabs.find(
    (tab) => tab.id === docEditorState.activeTabId
  );

  const stripCodeFence = (raw: string): string =>
    raw
      .replace(/^```(?:html)?\s*\n?/i, "") // opening fence
      .replace(/\n?```$/i, "") // closing fence
      .trim();

  async function handlePromptSubmit(prompt: string, fullText?: string) {
    if (!prompt.trim() || !lexicalEditorRef.current) return;
    setGenerationState({ isGenerating: true });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          text: fullText || activeTab?.content || "",
        }),
      });
      if (!res.body) throw new Error("No stream returned");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // buffer for the *entire* answer so we can render rich HTML later
      let fullHtml = "";

      // references for the "live typing" paragraph + text node
      let paraNode: ReturnType<typeof $createParagraphNode> | null = null;
      let liveText: ReturnType<typeof $createTextNode> | null = null;

      while (true) {
        const { value, done } = await reader.read();

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullHtml += chunk;

          // ── Phase 1: update plain text immediately ──
          lexicalEditorRef.current.update(() => {
            if (!paraNode) {
              paraNode = $createParagraphNode();
              liveText = $createTextNode("");
              paraNode.append(liveText);
              $getRoot().append(paraNode);
            }
            if (liveText) {
              const previous = liveText.getTextContent();
              liveText.setTextContent(previous + chunk);
            }
          });
        }

        if (done) {
          // ── Phase 2: replace plain text with rich HTML ──
          const cleanHtml = stripCodeFence(fullHtml).trim();
          const dom = new DOMParser().parseFromString(cleanHtml, "text/html");

          lexicalEditorRef.current.update(() => {
            // wipe the temporary paragraph
            $getRoot().clear();

            // keep only element/decorator nodes (TextNodes alone will break root)
            const nodes = $generateNodesFromDOM(
              lexicalEditorRef.current!,
              dom
            ).filter($isElementNode);
            const safeNodes = nodes.filter($isElementNode);

            if (safeNodes.length) {
              $insertNodes(safeNodes);
            } else {
              // fallback: show raw HTML as text so the user sees *something*
              const p = $createParagraphNode().append(
                $createTextNode(cleanHtml)
              );
              $getRoot().append(p);
            }
          });

          break;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerationState({ isGenerating: false });
    }
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
        <GenerationIndicator isGenerating={generationState.isGenerating} />
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
    <div className="pointer-events-none absolute z-50">
      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full shadow-lg">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:150ms]" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  );
}
