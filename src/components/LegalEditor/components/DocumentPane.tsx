"use client";

import { $generateNodesFromDOM } from "@lexical/html";
import { $createParagraphNode, $createTextNode, $getRoot, $insertNodes, $isElementNode } from "lexical";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";
import type { AssistantMode } from "../assistantTypes";
import { assistantContentToSafeHtml } from "../utils/assistantContentHtml";
import { AIAssistantPanel, ChatMessage } from "./AIAssistantPanel";
import { DocumentAIPreview } from "./DocumentAIPreview";
import { DocumentEditor } from "./DocumentEditor";
import { DocumentPaneTopBar } from "./DocumentPaneTopBar";
import { ReviewRequestModal } from "./ReviewRequestModal";
import { TabBar } from "./TabBar";
import { Toolbar } from "./Toolbar";
import { useUIState } from "../reducersContexts/editorUiReducerContext";

/** Composer sends selection-only as `fullText`; empty string must not hide the open tab HTML (?? keeps ""). */
function buildAssistantRequestText(
  tabContent: string | undefined,
  selectionOrEmptyFromComposer: string | undefined
): string {
  const doc = tabContent ?? "";
  const selection = (selectionOrEmptyFromComposer ?? "").trim();
  if (selection && doc.trim()) {
    return `${doc}\n\n---\nSelected excerpt (user highlighted in the editor):\n${selection}`;
  }
  if (selection) return selection;
  return doc;
}

export function DocumentPane() {
  const { docEditorState, lexicalEditorRef, docEditorDispatch } = useDocumentEditor();
  const { state: uiState } = useUIState();
  const [selectedText, setSelectedText] = useState<string>();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamingPreview, setStreamingPreview] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** Chat = Q&A only. Document = green preview + Apply/Reject. */
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("chat");
  /** Live preview in the editor column — not persisted until Apply */
  const [pendingPreview, setPendingPreview] = useState<{ messageId: string; html: string } | null>(null);

  const [initialContent, setInitialContent] = useState<string>("");

  const activeTab = docEditorState.openTabs.find((tab) => tab.id === docEditorState.activeTabId);

  useEffect(() => {
    setInitialContent(activeTab?.content || "");
  }, [docEditorState.activeTabId, activeTab?.content]);

  useEffect(() => {
    if (docEditorState.isAIEdit) {
      setInitialContent(activeTab?.content || "");
      docEditorDispatch({
        type: "UPDATE_IS_AI_EDIT",
        payload: { isAIEdit: false },
      });
    }
  }, [docEditorState.isAIEdit]);

  useEffect(() => {
    if (assistantMode === "chat") {
      setPendingPreview(null);
    }
  }, [assistantMode]);

  async function handlePromptSubmit(prompt: string, fullText?: string, files?: string[]) {
    if (!prompt.trim() || !lexicalEditorRef.current) return;
    setLoading(true);
    setStreamingPreview("");
    setPendingPreview(null);

    const mode = assistantMode;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          text: buildAssistantRequestText(activeTab?.content, fullText),
          files,
          mode,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as { relevant?: boolean; message?: string; error?: string };
        if (!res.ok) {
          toast.error(data?.error || "Request failed");
          return;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.message || "I couldn’t process that.",
            createdAt: Date.now(),
            canApplyToDocument: false,
          },
        ]);
        return;
      }

      if (!res.ok) {
        toast.error("Request failed");
        return;
      }

      await processAIStream(res.body, mode);
    } catch {
      setPendingPreview(null);
      toast.error("Something went wrong. Preview cleared.");
    } finally {
      setLoading(false);
      setStreamingPreview("");
    }
  }

  async function processAIStream(stream: ReadableStream<Uint8Array> | null, mode: AssistantMode) {
    if (!stream) return;
    const previewMessageId = crypto.randomUUID();
    const documentMode = mode === "document";
    if (documentMode) {
      setPendingPreview({ messageId: previewMessageId, html: "" });
    }

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullHtml = "";

    while (true) {
      const { value, done } = await reader.read();
      if (!value && !done) continue;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        fullHtml += chunk;
        setStreamingPreview((prev) => prev + chunk);
        if (documentMode) {
          setPendingPreview({ messageId: previewMessageId, html: fullHtml });
        }
      }

      if (done) {
        const assistantMessage: ChatMessage = {
          id: previewMessageId,
          role: "assistant",
          content: fullHtml,
          createdAt: Date.now(),
          canApplyToDocument: documentMode,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        if (documentMode) {
          setPendingPreview({ messageId: previewMessageId, html: fullHtml });
        }
        break;
      }
    }
  }

  function renderFinalContent(rawHtml: string, opts?: { leadingBlankLines?: number }) {
    const leadingBlankLines = opts?.leadingBlankLines ?? 0;
    const spacerHtml =
      leadingBlankLines > 0
        ? Array.from({ length: leadingBlankLines }, () => "<p><br /></p>").join("")
        : "";

    const cleanHtml = assistantContentToSafeHtml(rawHtml);
    const markerHtml = `<p data-ai-marker="true" style="border-left:3px solid rgb(59 130 246);padding-left:0.75rem;margin:1rem 0 0.75rem;color:rgb(100 116 139);font-size:12px;font-family:system-ui,sans-serif;">AI content — ${new Date().toLocaleString()}</p>`;
    const wrapped = `<div>${spacerHtml}${markerHtml}${cleanHtml}</div>`;
    const dom = new DOMParser().parseFromString(wrapped, "text/html");

    if (!dom.body.firstElementChild || !docEditorState.activeTabId) return;

    const appended = spacerHtml + markerHtml + cleanHtml;
    docEditorDispatch({
      type: "UPDATE_TAB_CONTENT",
      payload: {
        tabId: docEditorState.activeTabId,
        content: (activeTab?.content || "") + appended,
      },
    });

    lexicalEditorRef.current?.update(() => {
      const nodes = $generateNodesFromDOM(lexicalEditorRef.current!, dom);
      const validNodes = nodes.filter($isElementNode);

      $getRoot().selectEnd();
      if (validNodes.length) {
        $insertNodes(validNodes);
      } else {
        $insertNodes([$createParagraphNode().append($createTextNode(cleanHtml))]);
      }
    });
  }

  function handleApplyToDocument(messageId: string) {
    const msg = messages.find(
      (m) =>
        m.id === messageId &&
        m.role === "assistant" &&
        m.canApplyToDocument &&
        !m.appliedToDocument &&
        !m.rejected
    );
    if (!msg) return;
    if (!lexicalEditorRef.current || !docEditorState.activeTabId) {
      toast.error("Editor is not ready");
      return;
    }
    renderFinalContent(msg.content, { leadingBlankLines: 3 });
    setPendingPreview(null);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, appliedToDocument: true } : m)));
    toast.success("Changes applied to the document");
  }

  function handleRejectPreview(messageId: string) {
    setPendingPreview((p) => (p?.messageId === messageId ? null : p));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.role === "assistant"
          ? { ...m, rejected: true, canApplyToDocument: false }
          : m
      )
    );
    toast.success("Preview dismissed — document unchanged");
  }

  const onFileReviewRequest = () => {
    if (activeTab?.fileId) {
      setShowReviewModal(true);
    } else {
      toast.error("Please save the document first before requesting a review");
    }
  };

  const updateContent = (content: string) => {
    if (docEditorState.isTranslating && docEditorState.translatingTab == activeTab?.id) {
      return `<div>${initialContent} translating...</div>`;
    }
    return content;
  };

  const handleClearChat = () => {
    setMessages([]);
    setPendingPreview(null);
  };

  return (
    <div className="relative flex flex-col h-full min-h-0">
      <DocumentPaneTopBar onFileReviewRequest={onFileReviewRequest} />
      <div className="flex w-full flex-row justify-between max-w-full shrink-0">
        <TabBar />
        <Toolbar />
      </div>

      <div className="flex flex-1 flex-row min-h-0 min-w-0">
        <div className="flex flex-1 flex-col min-w-0 min-h-0 bg-white mx-6 border border-border/40 rounded-lg overflow-hidden">
          <div className="flex flex-1 flex-col min-h-0 min-w-0">
            <div className="flex-1 min-h-0">
              <DocumentEditor
                localContent={updateContent(initialContent)}
                handleSelectionChange={setSelectedText}
                activeTabId={docEditorState.activeTabId || ""}
              />
            </div>
            {pendingPreview && (
              <DocumentAIPreview
                html={pendingPreview.html}
                isStreaming={loading}
                actionsDisabled={loading}
                onApply={() => handleApplyToDocument(pendingPreview.messageId)}
                onReject={() => handleRejectPreview(pendingPreview.messageId)}
              />
            )}
          </div>
        </div>

        {uiState.showAIPanel && (
          <AIAssistantPanel
            messages={messages}
            streamingPreview={streamingPreview}
            isStreaming={loading}
            assistantMode={assistantMode}
            onAssistantModeChange={setAssistantMode}
            onPromptSubmit={handlePromptSubmit}
            onClearChat={handleClearChat}
            onApplyToDocument={handleApplyToDocument}
            onRejectPreview={handleRejectPreview}
            selectedText={selectedText}
            isFolderPickerOpen={docEditorState.isFolderPickerOpen}
          />
        )}
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
