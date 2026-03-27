"use client";

import { Bot, Check, FileEdit, MessageCircle, MessageSquare, Trash2, User, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import type { AssistantMode } from "../assistantTypes";
import { assistantContentToSafeHtml } from "../utils/assistantContentHtml";
import { AIPromptComposer } from "./AIPromptComposer";

export type { AssistantMode };

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: number;
  /** Assistant only: this reply can be inserted at the end of the document */
  canApplyToDocument?: boolean;
  appliedToDocument?: boolean;
  /** User dismissed preview without applying */
  rejected?: boolean;
}

export interface AIAssistantPanelProps {
  messages: ChatMessage[];
  streamingPreview: string;
  isStreaming: boolean;
  assistantMode: AssistantMode;
  onAssistantModeChange: (mode: AssistantMode) => void;
  onPromptSubmit: (prompt: string, context: string, files?: string[]) => void;
  onClearChat: () => void;
  onApplyToDocument: (messageId: string) => void;
  onRejectPreview: (messageId: string) => void;
  selectedText?: string;
  isFolderPickerOpen?: boolean;
}

export function AIAssistantPanel({
  messages,
  streamingPreview,
  isStreaming,
  assistantMode,
  onAssistantModeChange,
  onPromptSubmit,
  onClearChat,
  onApplyToDocument,
  onRejectPreview,
  selectedText,
  isFolderPickerOpen,
}: AIAssistantPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingPreview, isStreaming]);

  return (
    <aside
      className="flex flex-col w-[min(100%,420px)] shrink-0 border border-border bg-background-dark h-full min-h-0 shadow-[inset_1px_0_0_0_rgba(0,0,0,0.04)]"
      aria-label="AI assistant"
    >
      <div className="flex flex-col gap-2 px-3 py-2.5 border-b border-border bg-background-medium/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-text truncate">Assistant</h2>
              <p className="text-[11px] text-muted leading-tight">
                {assistantMode === "chat"
                  ? "Ask about the open document. Replies stay in chat only."
                  : "Replies can be previewed and applied to the document."}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              className="p-1.5 rounded-md text-muted hover:text-text hover:bg-background-dark transition-colors shrink-0"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div
          className="flex rounded-lg border border-border bg-background p-0.5"
          role="group"
          aria-label="Assistant mode"
        >
          <button
            type="button"
            disabled={isStreaming}
            onClick={() => onAssistantModeChange("chat")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              assistantMode === "chat"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-text hover:bg-background-dark"
            } disabled:opacity-50`}
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            Chat
          </button>
          <button
            type="button"
            disabled={isStreaming}
            onClick={() => onAssistantModeChange("document")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              assistantMode === "document"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-muted hover:text-text hover:bg-background-dark"
            } disabled:opacity-50`}
          >
            <FileEdit className="w-3.5 h-3.5 shrink-0" />
            Editor
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="rounded-lg border border-dashed border-border bg-background p-4 text-center">
            <Bot className="w-8 h-8 mx-auto text-primary/60 mb-2" />
            <p className="text-sm text-text font-medium">Chat about this document</p>
            {assistantMode === "chat" && (
            <p className="text-xs text-muted mt-1 leading-relaxed">
                Use <strong>Chat</strong> for questions about the file. Switch to <strong>Document</strong> when you want
                AI generated text you can preview and apply to the editor.
              </p>
            )}
            {assistantMode === "document" && (
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Use <strong>Editor</strong> to make a draft or create citation entries. Switch to <strong>Chat</strong> when you want to chat with the document.
              </p>
            )}
            
          </div>
        )}

        {messages.map((m, index) => (
          <div key={m.id} className="space-y-1">
            {index > 0 && <div className="h-px bg-border/80 my-1" aria-hidden />}
            <div className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-primary text-white" : "bg-background-dark text-text"
                }`}
              >
                {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`min-w-0 max-w-[calc(100%-2.5rem)] rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-background-dark border border-border text-text rounded-tl-sm"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80 mb-1">
                  {m.role === "user" ? "You" : "Assistant"}
                  <span className="font-normal normal-case ml-2 opacity-70">
                    {new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {m.role === "assistant" ? (
                  <div
                    className="ai-chat-html prose prose-sm max-w-none text-sm leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0 [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: assistantContentToSafeHtml(m.content) }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                )}
                {m.role === "assistant" && m.canApplyToDocument && !m.appliedToDocument && !m.rejected && (
                  <div className="mt-2 pt-2 border-t border-border/80 flex flex-col gap-1.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onRejectPreview(m.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-background-dark transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyToDocument(m.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Apply changes
                      </button>
                    </div>
                    <p className="text-[10px] text-muted">
                      Same actions appear under the editor on the green preview. Nothing is saved until Apply.
                    </p>
                  </div>
                )}
                {m.role === "assistant" && m.appliedToDocument && (
                  <p className="text-[10px] text-emerald-700 mt-2">Applied to the document.</p>
                )}
                {m.role === "assistant" && m.rejected && (
                  <p className="text-[10px] text-muted mt-2">Preview dismissed — document unchanged.</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="space-y-1">
            {messages.length > 0 && <div className="h-px bg-border/80 my-1" />}
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm border-2 border-primary/40 bg-primary/5 px-3 py-2">
                <div className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">
                  Assistant · generating · {assistantMode === "chat" ? "chat" : "document"}
                </div>
                <div
                  className="ai-chat-html prose prose-sm max-w-none text-xs text-text/90 leading-relaxed max-h-48 overflow-y-auto [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{
                    __html: streamingPreview ? assistantContentToSafeHtml(streamingPreview) : "<p>…</p>",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <AIPromptComposer
        assistantMode={assistantMode}
        onPromptSubmit={onPromptSubmit}
        selectedText={selectedText}
        isFolderPickerOpen={isFolderPickerOpen}
        isLoading={isStreaming}
      />
    </aside>
  );
}
