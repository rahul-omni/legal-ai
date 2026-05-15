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

type LegalEditorConversation = {
  id: string;
  mode: "CHAT" | "DOCUMENT";
  messages: ChatMessage[];
};

type DocumentPaneProps = {
  workspaceId?: string;
};

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

export function DocumentPane({ workspaceId }: DocumentPaneProps) {
  const { docEditorState, lexicalEditorRef, docEditorDispatch } = useDocumentEditor();
  const { state: uiState } = useUIState();
  const [selectedText, setSelectedText] = useState<string>();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [streamingPreview, setStreamingPreview] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [legalEditorConversations, setLegalEditorConversations] = useState<{
    chat: LegalEditorConversation | null;
    document: LegalEditorConversation | null;
  }>({ chat: null, document: null });
  /** Chat = Q&A only. Document = green preview + Apply/Reject. */
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("chat");
  /** Live preview in the editor column — not persisted until Apply */
  const [pendingPreview, setPendingPreview] = useState<{ messageId: string; html: string } | null>(null);

  const [initialContent, setInitialContent] = useState<string>("");

  const activeTab = docEditorState.openTabs.find((tab) => tab.id === docEditorState.activeTabId);
  const activeConversation =
    assistantMode === "document" ? legalEditorConversations.document : legalEditorConversations.chat;

  const updateConversationMessages = (
    mode: AssistantMode,
    updater: (_messages: ChatMessage[]) => ChatMessage[]
  ) => {
    setLegalEditorConversations((current) => {
      const key = mode === "document" ? "document" : "chat";
      const existing = current[key];
      if (!existing) return current;
      return {
        ...current,
        [key]: {
          ...existing,
          messages: updater(existing.messages || []),
        },
      };
    });
  };

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
    const nextConversation =
      assistantMode === "document" ? legalEditorConversations.document : legalEditorConversations.chat;
    if (nextConversation) {
      setMessages(nextConversation.messages || []);
    }
  }, [assistantMode, legalEditorConversations]);

  useEffect(() => {
    if (!workspaceId || !activeTab?.fileId) {
      setLegalEditorConversations({ chat: null, document: null });
      setMessages([]);
      setPendingPreview(null);
      return;
    }

    let cancelled = false;
    const loadConversations = async () => {
      try {
        setConversationLoading(true);
        const params = new URLSearchParams({
          workspaceId,
          fileId: activeTab.fileId!,
        });
        const response = await fetch(`/api/assistant/legal-editor/conversations?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load editor conversations");
        }

        if (cancelled) return;

        const chat = data.conversations.chat as LegalEditorConversation;
        const document = data.conversations.document as LegalEditorConversation;
        setLegalEditorConversations({ chat, document });
        setMessages(assistantMode === "document" ? document.messages || [] : chat.messages || []);
        setPendingPreview(null);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load editor conversations");
          setLegalEditorConversations({ chat: null, document: null });
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setConversationLoading(false);
        }
      }
    };

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, activeTab?.fileId]);

  async function handlePromptSubmit(prompt: string, fullText?: string, files?: string[]) {
    if (!prompt.trim() || !lexicalEditorRef.current) return;
    const shouldUsePersistedConversation = Boolean(workspaceId && activeTab?.fileId && activeConversation?.id);
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
    if (shouldUsePersistedConversation) {
      updateConversationMessages(mode, (current) => [...current, userMessage]);
    }

    try {
      const res = await fetch(shouldUsePersistedConversation ? "/api/assistant/legal-editor/chat" : "/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          fileId: activeTab?.fileId,
          prompt,
          text: buildAssistantRequestText(activeTab?.content, fullText),
          files,
          mode: shouldUsePersistedConversation ? mode.toUpperCase() : mode,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as { relevant?: boolean; message?: string; error?: string };
        if (!res.ok) {
          toast.error(data?.error || "Request failed");
          return;
        }
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message || "I couldn’t process that.",
          createdAt: Date.now(),
          canApplyToDocument: false,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        if (shouldUsePersistedConversation) {
          updateConversationMessages(mode, (current) => [...current, assistantMessage]);
        }
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
        if (workspaceId && activeTab?.fileId) {
          updateConversationMessages(mode, (current) => [...current, assistantMessage]);
        }
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

  const handleClearChat = async () => {
    if (workspaceId && activeTab?.fileId) {
      const params = new URLSearchParams({
        workspaceId,
        fileId: activeTab.fileId,
        mode: assistantMode.toUpperCase(),
      });
      const response = await fetch(`/api/assistant/legal-editor/conversations?${params.toString()}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error("Failed to clear conversation");
        return;
      }
    }
    setMessages([]);
    setPendingPreview(null);
    updateConversationMessages(assistantMode, () => []);
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
            isHistoryLoading={conversationLoading}
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
