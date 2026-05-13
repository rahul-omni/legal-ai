"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import toast from "react-hot-toast";
import { FileService } from "@/lib/fileService";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Landmark,
  Loader2,
  Paperclip,
  Plus,
  Scale,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type Role = "user" | "assistant";
type FileSystemNode = { id: string; name: string; type: "FILE" | "FOLDER" };

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt?: string;
  attachments?: { nodeId: string; fileName: string; createdAt?: string }[];
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
};

type PendingAttachment = {
  id: string;
  file: File;
};

const SUGGESTIONS: {
  text: string;
  Icon: LucideIcon;
  accent: string;
}[] = [
  {
    text: "Draft a legal notice for breach of contract",
    Icon: FileText,
    accent: "from-sky-500 to-primary",
  },
  {
    text: "Explain Section 138 of Negotiable Instruments Act",
    Icon: Scale,
    accent: "from-violet-500 to-indigo-600",
  },
  {
    text: "Create a divorce petition template",
    Icon: BookOpen,
    accent: "from-rose-500 to-pink-600",
  },
  {
    text: "Summarize Supreme Court judgment on data privacy",
    Icon: Landmark,
    accent: "from-amber-500 to-orange-600",
  },
];

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center px-1 py-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-gradient-to-br from-primary to-indigo-600 animate-bounce opacity-90"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: "0.6s" }}
        />
      ))}
    </div>
  );
}

function renderMarkdown(text: string) {
  const raw = marked.parse(text, { async: false }) as string;
  return DOMPurify.sanitize(raw);
}

function formatHistorySubtitle(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startToday - startMsg) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

function fileExtension(name: string): string {
  const ext = name.split(".").pop();
  return ext && ext !== name ? ext.toUpperCase().slice(0, 5) : "FILE";
}

async function ensureChatDocumentsFolder(): Promise<string> {
  const res = await fetch("/api/nodes", { method: "GET" });
  if (!res.ok) {
    throw new Error("Failed to load Project Hub folders");
  }
  const nodes = (await res.json()) as FileSystemNode[];
  const existingFolder = nodes.find(
    (n) => n.type === "FOLDER" && n.name.trim().toLowerCase() === "chat documents"
  );
  if (existingFolder) return existingFolder.id;

  const createRes = await fetch("/api/nodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Chat Documents",
      type: "FOLDER",
      parentId: null,
    }),
  });

  if (createRes.ok) {
    const created = (await createRes.json()) as FileSystemNode;
    return created.id;
  }

  // Handle race condition (folder created by another request)
  if (createRes.status === 409) {
    const retryRes = await fetch("/api/nodes", { method: "GET" });
    if (retryRes.ok) {
      const retryNodes = (await retryRes.json()) as FileSystemNode[];
      const retryFolder = retryNodes.find(
        (n) => n.type === "FOLDER" && n.name.trim().toLowerCase() === "chat documents"
      );
      if (retryFolder) return retryFolder.id;
    }
  }

  throw new Error("Failed to create Chat Documents folder");
}

function toSafeProjectFileName(original: string): string {
  const base = original.replace(/[^\w.\- ]+/g, "_").trim() || "uploaded-document";
  return `${base}-${Date.now()}.txt`;
}

async function uploadParsedDocToProjectHub(fileName: string, text: string): Promise<string> {
  const folderId = await ensureChatDocumentsFolder();
  const createRes = await fetch("/api/nodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: toSafeProjectFileName(fileName),
      type: "FILE",
      parentId: folderId,
      content: text,
    }),
  });
  if (!createRes.ok) {
    const data = (await createRes.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(data.error || data.message || "Failed to upload file to Project Hub");
  }
  const created = (await createRes.json()) as FileSystemNode;
  return created.id;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

async function fileToText(file: File): Promise<string> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".txt") || file.type === "text/plain") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsText(file);
    });
  }

  if (lower.endsWith(".pdf") || file.type === "application/pdf") {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const base64PDF = btoa(binary);
    const res = await fetch("/api/parse-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64PDF }),
    });
    const data = (await res.json()) as { text?: string; error?: string };
    if (!res.ok) {
      throw new Error(data.error || "PDF parse failed");
    }
    return data.text ?? "";
  }

  if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    file.type.startsWith("image/")
  ) {
    const base64Image = await fileToBase64(file);
    const res = await fetch("/api/parse-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64Image,
        mimeType: file.type || "image/png",
      }),
    });
    const data = (await res.json()) as { html?: string; error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Image parse failed");
    }
    return data.html ?? `Image attachment: ${file.name}`;
  }

  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    return await FileService.parseFile(file);
  }

  throw new Error("Unsupported file type. Use PDF, TXT, DOCX, PNG, JPG, or JPEG.");
}

export function LegalAssistantChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [conversationToDelete, setConversationToDelete] = useState<ChatSession | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  /** Set while GET /messages is in flight for a conversation (avoids empty vs wrong-history flicker). */
  const [chatHistoryLoadingId, setChatHistoryLoadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadedSessionsRef = useRef<Set<string>>(new Set());

  const active = sessions.find((s) => s.id === activeId) ?? null;
  const messages = active?.messages ?? [];
  const isChatHistoryLoading = useMemo(
    () => Boolean(activeId && chatHistoryLoadingId === activeId),
    [activeId, chatHistoryLoadingId]
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    setInput("");
    setPendingAttachments([]);
  }, [activeId]);

  const patchSession = useCallback((sessionId: string, updater: (s: ChatSession) => ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? updater(s) : s)));
  }, []);

  const loadConversation = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/assistant/conversations/${sessionId}/messages`, {
        method: "GET",
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to load conversation");
      }
      const data = (await res.json()) as {
        conversation: { id: string; title: string; updatedAt: string };
        messages: ChatMessage[];
        attachments: { nodeId: string; fileName: string }[];
      };
      patchSession(sessionId, (session) => ({
        ...session,
        title: data.conversation.title,
        updatedAt: data.conversation.updatedAt,
        messages: data.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
          attachments: Array.isArray(message.attachments)
            ? message.attachments.map((a) => ({
                nodeId: a.nodeId,
                fileName: a.fileName,
                createdAt: a.createdAt,
              }))
            : [],
        })),
      }));
      loadedSessionsRef.current.add(sessionId);
    } finally {
      setChatHistoryLoadingId((cur) => (cur === sessionId ? null : cur));
    }
  }, [patchSession]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/assistant/conversations", { method: "GET" });
        if (!res.ok) {
          throw new Error("Failed to fetch conversations");
        }
        const data = (await res.json()) as {
          conversations: {
            id: string;
            title: string;
            updatedAt: string;
          }[];
        };

        if (!data.conversations.length) {
          const created = await fetch("/api/assistant/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (!created.ok) {
            throw new Error("Failed to create conversation");
          }
          const createdData = (await created.json()) as {
            conversation: {
              id: string;
              title: string;
              updatedAt: string;
            };
          };
          const initialSession: ChatSession = {
            id: createdData.conversation.id,
            title: createdData.conversation.title,
            updatedAt: createdData.conversation.updatedAt,
            messages: [],
          };
          setSessions([initialSession]);
          setActiveId(initialSession.id);
          loadedSessionsRef.current.add(initialSession.id);
          return;
        }

        const nextSessions: ChatSession[] = data.conversations.map((conversation) => ({
          id: conversation.id,
          title: conversation.title,
          updatedAt: conversation.updatedAt,
          messages: [],
        }));
        setSessions(nextSessions);
        setActiveId(nextSessions[0]?.id ?? null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to initialize chats");
      } finally {
        setBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!activeId || !sessions.some((session) => session.id === activeId)) {
      return;
    }
    if (loadedSessionsRef.current.has(activeId)) {
      setChatHistoryLoadingId(null);
      return;
    }
    setChatHistoryLoadingId(activeId);
    void loadConversation(activeId).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Failed to load chat");
    });
  }, [activeId, loadConversation, sessions]);

  const lastMessageContent = messages[messages.length - 1]?.content ?? "";

  useEffect(() => {
    if (bootstrapping || isChatHistoryLoading) return;
    const frame = requestAnimationFrame(() => {
      scrollToBottom("auto");
    });
    return () => cancelAnimationFrame(frame);
  }, [
    activeId,
    bootstrapping,
    isChatHistoryLoading,
    loading,
    messages.length,
    lastMessageContent,
    scrollToBottom,
  ]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !activeId) return;
    const next = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
    }));
    setPendingAttachments((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  }, []);

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete || deletingConversationId) return;
    const id = conversationToDelete.id;
    setDeletingConversationId(id);
    try {
      const res = await fetch(`/api/assistant/conversations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to delete conversation");
      }

      loadedSessionsRef.current.delete(id);
      setSessions((prev) => {
        const next = prev.filter((session) => session.id !== id);
        if (activeId === id) {
          setActiveId(next[0]?.id ?? null);
        }
        return next;
      });
      if (activeId === id) {
        setInput("");
        setPendingAttachments([]);
      }
      setConversationToDelete(null);
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete conversation");
    } finally {
      setDeletingConversationId(null);
    }
  };

  const clearContext = async () => {
    if (!activeId) return;
    try {
      const res = await fetch(`/api/assistant/conversations/${activeId}/messages`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to clear document context");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear context");
      return;
    }

    patchSession(activeId, (s) => ({
      ...s,
      updatedAt: new Date().toISOString(),
    }));
    toast.success("Document context cleared for this chat");
  };

  const startNewChat = async () => {
    if (loading) return;
    try {
      const res = await fetch("/api/assistant/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to create chat");
      const data = (await res.json()) as {
        conversation: { id: string; title: string; updatedAt: string };
      };
      const session: ChatSession = {
        id: data.conversation.id,
        title: data.conversation.title,
        updatedAt: data.conversation.updatedAt,
        messages: [],
      };
      setSessions((prev) => [session, ...prev]);
      setActiveId(session.id);
      loadedSessionsRef.current.add(session.id);
      setInput("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create chat");
    }
  };

  const send = async (messageOverride?: string) => {
    const trimmed = (messageOverride ?? input).trim();
    const filesToAttach = pendingAttachments;
    if ((!trimmed && !filesToAttach.length) || loading || isChatHistoryLoading || !activeId) return;

    const sid = activeId;
    let didCreateUserMessage = false;
    setLoading(true);

    try {
      const uploadedAttachments: NonNullable<ChatMessage["attachments"]> = [];
      for (const attachment of filesToAttach) {
        const text = await fileToText(attachment.file);
        if (!text.trim()) continue;
        const content = `### ${attachment.file.name}\n${text.trim()}`;
        const nodeId = await uploadParsedDocToProjectHub(attachment.file.name, content);
        uploadedAttachments.push({
          nodeId,
          fileName: attachment.file.name,
        });
      }

      const messageText =
        trimmed ||
        (uploadedAttachments.length
          ? "Please review the attached document(s)."
          : "");
      if (!messageText) {
        throw new Error("Could not read the selected file(s).");
      }

      const attachedNodeIds = Array.from(
        new Set([
          ...(active?.messages ?? [])
            .flatMap((m) => m.attachments ?? [])
            .map((a) => a.nodeId)
            .filter(Boolean),
          ...uploadedAttachments.map((a) => a.nodeId),
        ])
      );

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: messageText,
        attachments: uploadedAttachments,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sid) return s;
          const nextTitle =
            s.messages.length === 0
              ? messageText.length > 52
                ? `${messageText.slice(0, 52)}…`
                : messageText
              : s.title;
          return {
            ...s,
            title: nextTitle,
            messages: [...s.messages, userMessage],
            updatedAt: new Date().toISOString(),
          };
        })
      );
      didCreateUserMessage = true;

      setInput("");
      setPendingAttachments([]);

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: sid,
          message: messageText,
          attachedNodeIds,
          attachedDocuments: uploadedAttachments,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Request failed");
      }

      const assistantId = crypto.randomUUID();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sid
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { id: assistantId, role: "assistant" as const, content: "" },
                ],
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          full += decoder.decode(value, { stream: true });
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sid
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantId ? { ...m, content: full } : m
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : s
            )
          );
          scrollToBottom();
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      if (!didCreateUserMessage) return;
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sid
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content:
                      "I could not generate a response right now. Please try again in a moment.",
                  },
                ],
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const sortedHistory = [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const showWelcome =
    messages.length === 0 && !loading && !bootstrapping && !isChatHistoryLoading;
  /** Blocks main column UI (strip, messages, composer) while chats or active thread load. */
  const showMainBlockingLoader = bootstrapping || isChatHistoryLoading;
  /** Conversation fetch only — overlay stays on main column; bootstrap uses full-row overlay above sidebar. */
  const showConversationOverlay = isChatHistoryLoading && !bootstrapping;

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/50 to-sky-50/70">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(40,97,226,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        {/* Main chat: mobile strip + messages + input. Full-area loader overlay (excludes desktop sidebar only). */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Mobile: session strip when desktop history is hidden */}
          <div
            className={`shrink-0 border-b border-indigo-100/80 bg-white/90 shadow-sm backdrop-blur-md lg:hidden ${
              showMainBlockingLoader
                ? "hidden"
                : "flex items-center gap-2 overflow-x-auto px-3 py-2.5"
            }`}
          >
            <button
              type="button"
              onClick={startNewChat}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary/25 transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              New chat
            </button>
            {sortedHistory.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveId(s.id)}
                className={`inline-flex max-w-[160px] shrink-0 items-center gap-1.5 truncate whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                  s.id === activeId
                    ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/20"
                    : "border border-indigo-100/60 bg-white/80 text-gray-700 hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                {chatHistoryLoadingId === s.id ? (
                  <Loader2
                    className={`h-3.5 w-3.5 shrink-0 animate-spin ${s.id === activeId ? "text-white" : "text-primary"}`}
                    aria-hidden
                  />
                ) : null}
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <div ref={scrollContainerRef} className="min-h-0 flex-1 scroll-smooth overflow-y-auto">
          {!showMainBlockingLoader && showWelcome ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-10 text-center md:py-14">
              <div className="relative mb-7">
                <div className="absolute inset-0 scale-150 animate-pulse rounded-2xl bg-gradient-to-br from-primary to-indigo-600 opacity-40 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-white/80 md:h-16 md:w-16">
                  <Sparkles className="h-7 w-7 md:h-8 md:w-8" strokeWidth={2} />
                </div>
              </div>
              <h1 className="mb-3 bg-gradient-to-r from-gray-900 via-indigo-900 to-primary bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-4xl">
                How can I assist you today?
              </h1>
              <p className="text-gray-600 text-sm md:text-base max-w-md mb-10 leading-relaxed">
                Ask me anything about Indian law, draft documents, or analyze legal cases
              </p>

              <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map(({ text, Icon, accent }) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => {
                      setInput(text);
                      textareaRef.current?.focus();
                    }}
                    onDoubleClick={() => {
                      if (loading || isChatHistoryLoading) return;
                      void send(text);
                    }}
                    title="Click to fill · Double-click to send"
                    className="group relative rounded-2xl border border-white/70 bg-white/75 px-4 py-4 text-left leading-snug shadow-md shadow-indigo-950/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98]"
                  >
                    <div className="flex gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{text}</p>
                        <p className="mt-1.5 flex items-center gap-0.5 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Use this prompt
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : !showMainBlockingLoader ? (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex animate-fade-in ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm transition-shadow ${
                      m.role === "user"
                        ? "rounded-br-md bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-primary/25"
                        : "rounded-bl-md border border-indigo-100/80 bg-white/95 text-gray-900 shadow-md shadow-indigo-950/5 backdrop-blur-sm"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div
                        className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800"
                        dangerouslySetInnerHTML={{
                          __html: m.content.trim()
                            ? renderMarkdown(m.content)
                            : "<p class='text-gray-400'>…</p>",
                        }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}

                    {Array.isArray(m.attachments) && m.attachments.length ? (
                      <div
                        className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
                          m.role === "user"
                            ? "border-white/30 bg-white/10 text-white/95"
                            : "border-indigo-100/80 bg-indigo-50/40 text-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-semibold ${
                              m.role === "user" ? "text-white/90" : "text-gray-700"
                            }`}
                          >
                            Attached document(s)
                          </span>
                        </div>

                        <div className="mt-2 flex flex-col gap-1.5">
                          {m.attachments.map((a) => (
                            <div key={a.nodeId} className="flex items-center gap-2">
                              <span className="truncate">{a.fileName}</span>
                              <a
                                href={`/projects/root/edit/${a.nodeId}`}
                                target="_blank"
                                rel="noreferrer"
                                className={`ml-auto inline-flex items-center rounded-lg px-2 py-1 font-semibold underline-offset-2 hover:underline ${
                                  m.role === "user" ? "text-white" : "text-primary"
                                }`}
                              >
                                View in Project Hub
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start animate-fade-in-fast">
                  <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-indigo-100/80 bg-white/95 px-5 py-4 shadow-md backdrop-blur-sm">
                    <TypingDots />
                    <span className="text-xs font-medium text-gray-500">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="min-h-0 flex-1 bg-transparent" aria-hidden />
          )}
            </div>

            {!showMainBlockingLoader ? (
              <div className="shrink-0 border-t border-indigo-100/60 bg-gradient-to-t from-white/90 via-indigo-50/30 to-transparent p-4 backdrop-blur-md md:p-5">
                <div className="mx-auto max-w-3xl">
                  {pendingAttachments.length ? (
                    <div className="mb-3 rounded-2xl border border-indigo-100/80 bg-white/80 p-2.5 shadow-md shadow-indigo-950/5 backdrop-blur-sm">
                      <div className="mb-2 flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                          Ready to attach
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {pendingAttachments.length} file{pendingAttachments.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                      {pendingAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="group/chip inline-flex max-w-full items-center gap-2 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 py-2 pl-2 pr-2.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/12 to-indigo-100 text-[10px] font-black text-primary ring-1 ring-primary/10">
                            {fileExtension(attachment.file.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[230px] truncate text-sm font-semibold leading-4 text-gray-800">
                              {attachment.file.name}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium text-gray-500">
                              {formatFileSize(attachment.file.size)}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removePendingAttachment(attachment.id)}
                            disabled={loading || isChatHistoryLoading}
                            className="ml-1 rounded-full p-1 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            title="Remove attachment"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2 rounded-2xl border-2 border-indigo-100/80 bg-white/95 py-2 pl-2 pr-2 shadow-lg shadow-indigo-950/5 transition-all duration-300 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/15 md:gap-3 md:py-2.5 md:pl-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) => void handleFiles(e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || isChatHistoryLoading}
                      className="shrink-0 rounded-xl p-2.5 text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary active:scale-95 disabled:opacity-50"
                      title="Attach document or image"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      placeholder="Type your legal query here..."
                      rows={1}
                      disabled={loading || isChatHistoryLoading}
                      className="min-h-[44px] max-h-32 flex-1 resize-none border-0 bg-transparent py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => void send()}
                      disabled={loading || isChatHistoryLoading || (!input.trim() && !pendingAttachments.length)}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-primary/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {showConversationOverlay ? (
              <div
                className="absolute inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-white/92 via-indigo-50/90 to-sky-50/85 backdrop-blur-md"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <span className="sr-only">Loading conversation</span>
                <Loader2
                  className="h-10 w-10 animate-spin text-primary"
                  strokeWidth={2.5}
                  aria-hidden
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Chat history sidebar — desktop */}
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col border-l border-indigo-100/80 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50/90 min-h-0 shadow-[inset_1px_0_0_rgba(99,102,241,0.06)]">
        <div className="p-4 border-b border-indigo-100/60 flex items-center justify-between gap-2 bg-gradient-to-r from-primary/8 to-indigo-50/50">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">Chat History</h2>
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex items-center justify-center rounded-xl h-9 w-9 text-white bg-gradient-to-br from-primary to-indigo-600 shadow-md shadow-primary/25 hover:brightness-110 active:scale-95 transition-all"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sortedHistory.map((s) => {
            const isActive = s.id === activeId;
            const attachmentCount = s.messages.reduce(
              (count, message) => count + (message.attachments?.length ?? 0),
              0
            );
            return (
              <div
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 ${
                  isActive
                    ? "border-primary/35 bg-white shadow-lg shadow-primary/10 ring-2 ring-primary/10"
                    : "border-white/70 bg-white/55 shadow-sm shadow-indigo-950/[0.03] hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white hover:shadow-md hover:shadow-indigo-950/[0.06]"
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveId(s.id);
                  }
                }}
              >
                {isActive ? (
                  <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-primary to-indigo-500" />
                ) : null}
                <div className="flex items-start gap-2 pl-1">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-white text-primary ring-1 ring-indigo-100/80">
                    {chatHistoryLoadingId === s.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Sparkles className="h-4 w-4" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">
                      {s.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-slate-100 text-gray-500"
                        }`}
                      >
                        {formatHistorySubtitle(s.updatedAt)}
                      </span>
                      {attachmentCount ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">
                          <Paperclip className="h-3 w-3" />
                          {attachmentCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConversationToDelete(s);
                    }}
                    disabled={deletingConversationId === s.id}
                    className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                    title="Delete conversation"
                  >
                    {deletingConversationId === s.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          {!sortedHistory.length ? (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 px-4 py-8 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-primary/70" />
              <p className="mt-2 text-sm font-semibold text-gray-800">No chats yet</p>
              <p className="mt-1 text-xs text-gray-500">Start a new chat to build your history.</p>
            </div>
          ) : null}
        </div>
        </aside>

        {bootstrapping ? (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white/92 via-indigo-50/90 to-sky-50/85 backdrop-blur-md"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="sr-only">Loading chats</span>
            <Loader2
              className="h-10 w-10 animate-spin text-primary"
              strokeWidth={2.5}
              aria-hidden
            />
          </div>
        ) : null}

        {conversationToDelete ? (
          <div
            className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-conversation-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-5 shadow-2xl shadow-slate-950/20">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 id="delete-conversation-title" className="text-base font-bold text-gray-900">
                    Delete conversation?
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    This will remove “{conversationToDelete.title}” from your chat history.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConversationToDelete(null)}
                  disabled={Boolean(deletingConversationId)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDeleteConversation()}
                  disabled={Boolean(deletingConversationId)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                >
                  {deletingConversationId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
