"use client";

import { Check, Loader2, Sparkles, XCircle } from "lucide-react";
import { assistantContentToSafeHtml } from "../utils/assistantContentHtml";

export interface DocumentAIPreviewProps {
  html: string;
  isStreaming: boolean;
  onApply: () => void;
  onReject: () => void;
  /** Disable Apply/Reject until stream has finished */
  actionsDisabled?: boolean;
}

export function DocumentAIPreview({
  html,
  isStreaming,
  onApply,
  onReject,
  actionsDisabled = false,
}: DocumentAIPreviewProps) {
  const safeHtml = assistantContentToSafeHtml(html);
  const showEmpty = !html.trim() && isStreaming;

  return (
    <div
      className="shrink-0 border-t border-emerald-200/90 bg-gradient-to-b from-emerald-50/95 to-emerald-50/80 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.12)]"
      role="region"
      aria-label="AI reply preview, not saved until you apply"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-emerald-200/70 bg-emerald-100/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/15 text-emerald-800 shrink-0">
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="w-4 h-4" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-950">Preview in document</p>
            <p className="text-[11px] text-emerald-800/80 leading-snug">
              {isStreaming
                ? "Generating… nothing is saved yet."
                : "Review below. Your file is unchanged until you apply."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReject}
            disabled={actionsDisabled}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/90 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 shadow-sm hover:bg-emerald-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={actionsDisabled || !html.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Apply changes
          </button>
        </div>
      </div>
      <div className="max-h-[min(40vh,320px)] overflow-y-auto px-4 py-3">
        {showEmpty ? (
          <p className="text-sm text-emerald-800/70 italic">Waiting for output…</p>
        ) : (
          <div
            className="document-ai-preview-html prose prose-sm max-w-none text-emerald-950 prose-headings:text-emerald-950 prose-p:text-emerald-950/95 [&_p]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5 [&_strong]:font-semibold rounded-md border border-emerald-200/60 bg-white/90 px-3 py-2.5"
            dangerouslySetInnerHTML={{ __html: safeHtml || "<p>(empty)</p>" }}
          />
        )}
      </div>
    </div>
  );
}
