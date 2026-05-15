"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Keyboard,
  Loader2,
  PenLine,
  Sparkles,
} from "lucide-react";
import {
  DRAFT_TEMPLATES,
  DraftFieldDefinition,
  getDraftTemplateById,
  getInitialFieldValues,
} from "@/lib/document-drafting/templates";
import { cn } from "@/lib/utils";
import Header from "../ui/Header";

const inputClassName =
  "w-full text-sm border-2 border-indigo-100/80 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-sm shadow-indigo-950/5 transition-all duration-200 " +
  "placeholder:text-muted-dark/70 text-text focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary/40 " +
  "hover:border-indigo-200/90 disabled:opacity-50 disabled:cursor-not-allowed";

export function DocumentDraftingWorkspace() {
  const FIELDS_PER_PAGE = 5;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DRAFT_TEMPLATES[0]?.id ?? "");
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const template = DRAFT_TEMPLATES[0];
    return template ? getInitialFieldValues(template) : {};
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [draftHtml, setDraftHtml] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTemplate = useMemo(
    () => getDraftTemplateById(selectedTemplateId),
    [selectedTemplateId]
  );

  const isReady = useMemo(() => {
    if (!selectedTemplate) return false;
    return selectedTemplate.fields
      .filter((field) => field.required)
      .every((field) => (fields[field.key] ?? "").trim().length > 0);
  }, [fields, selectedTemplate]);

  const totalPages = useMemo(() => {
    if (!selectedTemplate) return 1;
    return Math.max(1, Math.ceil(selectedTemplate.fields.length / FIELDS_PER_PAGE));
  }, [selectedTemplate]);

  const pageGroups = useMemo(() => {
    if (!selectedTemplate) return [] as DraftFieldDefinition[][];
    const groups: DraftFieldDefinition[][] = [];
    for (let i = 0; i < selectedTemplate.fields.length; i += FIELDS_PER_PAGE) {
      groups.push(selectedTemplate.fields.slice(i, i + FIELDS_PER_PAGE));
    }
    return groups;
  }, [selectedTemplate]);

  const pagedFields = useMemo(() => {
    return pageGroups[currentPage] ?? [];
  }, [pageGroups, currentPage]);

  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  const isCurrentPageReady = useMemo(() => {
    return pagedFields
      .filter((field) => field.required)
      .every((field) => (fields[field.key] ?? "").trim().length > 0);
  }, [pagedFields, fields]);

  const pageCompletionStates = useMemo(() => {
    return pageGroups.map((group) =>
      group
        .filter((field) => field.required)
        .every((field) => (fields[field.key] ?? "").trim().length > 0)
    );
  }, [pageGroups, fields]);

  const maxUnlockedPage = useMemo(() => {
    if (!pageCompletionStates.length) return 0;
    let unlocked = 0;
    while (
      unlocked < pageCompletionStates.length - 1 &&
      pageCompletionStates[unlocked]
    ) {
      unlocked += 1;
    }
    return unlocked;
  }, [pageCompletionStates]);

  const setField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const onSelectTemplate = (templateId: string) => {
    const template = getDraftTemplateById(templateId);
    if (!template) return;
    setSelectedTemplateId(templateId);
    setFields(getInitialFieldValues(template));
    setCurrentPage(0);
    setDraftHtml("");
  };

  const goToNextPage = useCallback(() => {
    if (!canGoNext || loading) return;
    if (!isCurrentPageReady) {
      toast.error("Please fill all required fields on this page before continuing.");
      return;
    }
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  }, [canGoNext, loading, isCurrentPageReady, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (!canGoPrev || loading) return;
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  }, [canGoPrev, loading]);

  const goToPage = useCallback(
    (targetPage: number) => {
      if (loading) return;
      if (targetPage < 0 || targetPage >= totalPages) return;
      if (targetPage > maxUnlockedPage) {
        toast.error("Complete required fields in the current step to continue.");
        return;
      }
      setCurrentPage(targetPage);
    },
    [loading, totalPages, maxUnlockedPage]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevPage();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextPage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToNextPage, goToPrevPage]);

  const renderField = (field: DraftFieldDefinition) => {
    const value = fields[field.key] ?? "";
    const type = field.type ?? "text";

    if (type === "textarea") {
      return (
        <textarea
          value={value}
          onChange={(e) => setField(field.key, e.target.value)}
          placeholder={field.placeholder || ""}
          rows={4}
          className={cn(inputClassName, "min-h-[100px] resize-y")}
          disabled={loading}
        />
      );
    }

    if (type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => setField(field.key, e.target.value)}
          className={cn(inputClassName, "h-11 cursor-pointer")}
          disabled={loading}
        >
          <option value="">Select</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (type === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => setField(field.key, e.target.value)}
          className={cn(inputClassName, "h-11")}
          disabled={loading}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => setField(field.key, e.target.value)}
        placeholder={field.placeholder || ""}
        className={cn(inputClassName, "h-11")}
        disabled={loading}
      />
    );
  };

  const isFieldFullWidth = (field: DraftFieldDefinition) => (field.type ?? "text") === "textarea";

  const processDraft = async () => {
    if (!isReady || loading) {
      toast.error("Please fill all required fields to generate the draft.");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Please select a template.");
      return;
    }

    setLoading(true);
    setDraftHtml("");

    try {
      const res = await fetch("/api/document-drafting/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          fields,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Generation failed");
      }

      const html = await res.text();
      setDraftHtml(DOMPurify.sanitize(html));
      toast.success("Draft generated — review before use");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsPdf = () => {
    if (!draftHtml.trim()) {
      toast.error("Generate a draft before saving as PDF.");
      return;
    }
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
    if (!printWindow) {
      toast.error("Popup blocked. Please allow popups to save PDF.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Draft Document</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            .doc { white-space: normal; line-height: 1.6; font-size: 14px; }
            @media print { body { margin: 16mm; } }
          </style>
        </head>
        <body>
          <div class="doc">${draftHtml}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="relative flex flex-col min-h-0 h-full overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/50 to-sky-50/70">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(40,97,226,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative flex-1 min-h-0 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Page intro — matches app marketing / assistant tone */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-violet-600 text-white shadow-lg shadow-primary/25 ring-4 ring-white/80">
                <PenLine className="h-6 w-6" strokeWidth={2} aria-hidden />
              </div> */}
              <Header
                headerTitle="Document drafting"
                subTitle="Structured templates for common filings and deeds. Fill the steps, then generate a clean draft to review or export."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-stretch">
            <div className="rounded-2xl border border-indigo-100/80 bg-white/90 backdrop-blur-md shadow-lg shadow-indigo-950/5 overflow-hidden h-[70vh] flex flex-col ring-1 ring-indigo-100/60">
              <div className="p-5 sm:p-6 flex flex-col h-full min-h-0 border-b border-indigo-100/60 bg-gradient-to-r from-primary/[0.06] to-indigo-50/50">
                <h2 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Templates
                </h2>
                <p className="text-sm text-muted-dark mt-1.5 leading-snug">
                  Choose a format — fields update automatically.
                </p>
                <div className="grid grid-cols-2 gap-2.5 flex-1 min-h-0 overflow-auto pr-1 py-2 content-start">
                  {DRAFT_TEMPLATES.map((template) => {
                    const active = selectedTemplateId === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => onSelectTemplate(template.id)}
                        className={cn(
                          "group w-full p-2.5 rounded-xl border-2 text-left transition-all duration-300",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          active
                            ? "border-primary/50 bg-white shadow-md shadow-primary/10 ring-2 ring-primary/15"
                            : "border-white/80 bg-white/70 hover:bg-white hover:border-indigo-200/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                        )}
                        title={template.summary}
                      >
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="text-xl leading-none transition-transform duration-300 group-hover:scale-110" aria-hidden>
                            {template.emoji}
                          </span>
                          <span
                            className={cn(
                              "font-semibold text-[11px] leading-snug line-clamp-2",
                              active ? "text-primary" : "text-text group-hover:text-text-dark"
                            )}
                          >
                            {template.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100/80 bg-white/90 backdrop-blur-md shadow-lg shadow-indigo-950/5 overflow-hidden h-[70vh] flex flex-col ring-1 ring-indigo-100/60">
              <div className="p-5 sm:p-6 border-b border-indigo-100/60 bg-gradient-to-r from-white via-indigo-50/30 to-sky-50/20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-text tracking-tight">Document details</h2>
                    <p className="text-sm text-muted-dark mt-1 line-clamp-2 leading-relaxed">
                      {selectedTemplate
                        ? selectedTemplate.title
                        : "Select a template to begin"}
                    </p>
                  </div>
                  {selectedTemplate ? (
                    <span className="shrink-0 inline-flex items-center rounded-full border border-indigo-100/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
                      Step {currentPage + 1} of {totalPages}
                    </span>
                  ) : null}
                </div>
                {selectedTemplate ? (
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-indigo-100/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-600 transition-[width] duration-500 ease-out shadow-sm shadow-primary/30"
                      style={{
                        width: `${((currentPage + 1) / totalPages) * 100}%`,
                      }}
                      role="progressbar"
                      aria-valuenow={currentPage + 1}
                      aria-valuemin={1}
                      aria-valuemax={totalPages}
                    />
                  </div>
                ) : null}
              </div>

              <div className="p-5 sm:p-6 flex-1 min-h-0 flex flex-col bg-white/40">
                {selectedTemplate ? (
                  <>
                    <div className="flex-1 min-h-0 overflow-auto -mx-1 px-1">
                      <div
                        key={currentPage}
                        className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 animate-fade-in-fast"
                      >
                        {pagedFields.map((field) => (
                          <div
                            key={field.key}
                            className={cn(
                              "space-y-1.5",
                              isFieldFullWidth(field) && "md:col-span-2"
                            )}
                          >
                            <label className="text-xs font-semibold text-text flex items-baseline gap-1">
                              <span>{field.label}</span>
                              {field.required ? (
                                <span className="text-error font-bold" title="Required">
                                  *
                                </span>
                              ) : null}
                            </label>
                            {renderField(field)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-indigo-100/70 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={goToPrevPage}
                          disabled={!canGoPrev || loading}
                          className={cn(
                            "inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-indigo-100/90 bg-white/95 px-4 py-2.5 text-sm font-semibold text-text",
                            "shadow-sm shadow-indigo-950/5 transition-all duration-200 hover:bg-indigo-50/50 hover:border-indigo-200 hover:shadow-md",
                            "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                          )}
                        >
                          <ChevronLeft className="w-4 h-4 shrink-0" />
                          Back
                        </button>

                        <div className="flex flex-1 min-w-0 items-center justify-center gap-0.5 px-2 overflow-x-auto py-1">
                          {Array.from({ length: totalPages }).map((_, index) => {
                            const isCurrent = index === currentPage;
                            const isDone = Boolean(pageCompletionStates[index]);
                            const isLocked = index > maxUnlockedPage;
                            return (
                              <button
                                key={`step-${index}`}
                                type="button"
                                onClick={() => goToPage(index)}
                                disabled={isLocked || loading}
                                aria-label={`Go to step ${index + 1}`}
                                aria-current={isCurrent ? "step" : undefined}
                                className={cn(
                                  "group flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                  !isLocked && "hover:bg-primary/5 active:scale-95",
                                  isLocked && "cursor-not-allowed opacity-50"
                                )}
                              >
                                <span
                                  className={cn(
                                    "block rounded-full transition-all duration-200",
                                    isCurrent && "h-3 w-3 bg-gradient-to-br from-primary to-indigo-600 ring-4 ring-primary/20 shadow-md shadow-primary/25",
                                    !isCurrent && isDone && "h-2.5 w-2.5 bg-success",
                                    !isCurrent && !isDone && "h-2.5 w-2.5 bg-indigo-200",
                                    !isLocked && !isCurrent && "group-hover:scale-125"
                                  )}
                                />
                                <span className="sr-only">Step {index + 1}</span>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={goToNextPage}
                          disabled={!canGoNext || loading || !isCurrentPageReady}
                          className={cn(
                            "inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white",
                            "shadow-lg shadow-primary/30 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-primary/25",
                            "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none disabled:brightness-100"
                          )}
                        >
                          Next
                          <ChevronRight className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-100/80 bg-gradient-to-b from-indigo-50/40 to-white/60 p-8 text-center">
                    <div className="rounded-2xl bg-white p-4 shadow-md shadow-indigo-950/5 ring-1 ring-indigo-100/60 mb-4">
                      <FileText className="h-10 w-10 text-primary/80" strokeWidth={1.5} aria-hidden />
                    </div>
                    <p className="text-sm font-semibold text-text">No template selected</p>
                    <p className="text-xs text-muted-dark mt-1.5 max-w-xs leading-relaxed">
                      Pick a draft type from the panel on the left to load fields here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          

          <div className="mt-8">
            <div className="rounded-2xl border border-indigo-100/80 bg-white/90 backdrop-blur-md shadow-lg shadow-indigo-950/5 overflow-hidden ring-1 ring-indigo-100/60">
              <div className="p-5 sm:p-6 border-b border-indigo-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/[0.07] via-white to-indigo-50/40">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-indigo-100/80 text-primary">
                    <Sparkles className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text tracking-tight">Generated draft</h2>
                    <p className="text-sm text-muted-dark mt-1 leading-relaxed max-w-lg">
                      {isReady
                        ? "Generate a formatted preview, then print or save as PDF."
                        : "Complete every required field in the steps above to unlock generation."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-end shrink-0">
                  <button
                    type="button"
                    disabled={!isReady || loading}
                    onClick={() => void processDraft()}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white px-5 py-2.5 text-sm font-semibold",
                      "shadow-lg shadow-primary/30 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.98]",
                      "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
                    )}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{loading ? "Generating…" : "Generate draft"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAsPdf}
                    disabled={!draftHtml || loading}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl border-2 border-indigo-100/90 bg-white/95 px-4 py-2.5 text-sm font-semibold text-text shadow-sm shadow-indigo-950/5",
                      "transition-all duration-200 hover:bg-indigo-50/50 hover:border-indigo-200 active:scale-[0.98]",
                      "disabled:pointer-events-none disabled:opacity-40"
                    )}
                  >
                    <Download className="w-4 h-4 text-primary" />
                    Save as PDF
                  </button>
                </div>
              </div>
              <div className="p-5 sm:p-6 bg-white/50">
                {!draftHtml && !loading && (
                  <div className="rounded-2xl border-2 border-dashed border-indigo-100/80 bg-gradient-to-b from-indigo-50/30 via-white to-sky-50/20 p-10 text-center min-h-[300px] flex flex-col items-center justify-center">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 opacity-25 blur-xl scale-125" aria-hidden />
                      <div className="relative rounded-2xl bg-white p-5 shadow-lg shadow-indigo-950/10 ring-1 ring-indigo-100/80">
                        <FileText className="h-9 w-9 text-primary" strokeWidth={1.5} aria-hidden />
                      </div>
                    </div>
                    <p className="text-base font-bold text-text">Preview will appear here</p>
                    <p className="text-sm text-muted-dark mt-2 max-w-md leading-relaxed">
                      Finish the form, then use{" "}
                      <span className="font-semibold text-primary">Generate draft</span> to see the output.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/60 to-white p-8 flex flex-col sm:flex-row items-center justify-center gap-4 shadow-inner">
                    <Loader2 className="w-9 h-9 animate-spin text-primary" />
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-semibold text-text">Building your document…</p>
                      <p className="text-xs text-muted-dark mt-0.5">This usually takes only a moment.</p>
                    </div>
                  </div>
                )}

                {draftHtml ? (
                  <div
                    className="prose prose-sm max-w-none rounded-2xl border border-indigo-100/70 bg-white/90 p-6 sm:p-8 shadow-md shadow-indigo-950/5 animate-fade-in prose-headings:text-text prose-p:text-text-dark prose-li:text-text-dark prose-table:text-sm"
                    dangerouslySetInnerHTML={{ __html: draftHtml }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
