"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  FileText,
  Filter,
  FolderOpen,
  LayoutGrid,
  ListChecks,
  PenLine,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CaseData } from "@/components/caseManagementComponents/types";
import { normalizePartiesDisplay } from "@/lib/parties";

type WorkspaceCase = CaseData & {
  caseDetails?: (Partial<CaseData> & {
    id?: string;
    case_type?: string;
    site_sync?: number;
    tentativeDate?: string | Date | null;
    caseStatus?: string | null;
  }) | null;
};

const filters = ["Text search", "Year", "Court"];
const tabs = ["All Cases", "Cause List", "Card View"];

const toneClasses: Record<string, string> = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  success: "border-success/30 bg-success-light text-success-dark",
  warning: "border-warning/30 bg-warning-light text-warning-dark",
  error: "border-error/30 bg-error-light text-error-dark",
  muted: "border-border bg-muted-light text-muted-dark",
};

function Badge({ children, tone = "primary", withDot = false }: { children: React.ReactNode; tone?: string; withDot?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {withDot ? <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-75" /> : null}
      {children}
    </span>
  );
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toISOString().slice(0, 10);
}

function getCaseDetails(caseItem: WorkspaceCase) {
  return caseItem.caseDetails ?? caseItem;
}

function getCaseTitle(caseItem: WorkspaceCase) {
  const details = getCaseDetails(caseItem);
  return normalizePartiesDisplay(details.parties) || details.caseNumber || details.diaryNumber || "Untitled case";
}

function getCaseReference(caseItem: WorkspaceCase) {
  const details = getCaseDetails(caseItem);
  return details.diaryNumber || details.caseNumber || caseItem.id;
}

function getSyncBadge(siteSync?: number) {
  if (siteSync === 1) return { label: "Synced", tone: "success" };
  if (siteSync === 0) return { label: "Sync Pending", tone: "warning" };
  return { label: "Error Syncing", tone: "error" };
}

function formatCaseStatusLabel(caseStatus?: string | null) {
  const s = (caseStatus ?? "").trim();
  return s || "Pending";
}

function formatCourtLabel(details: ReturnType<typeof getCaseDetails>) {
  const courtRaw = (details.court || "").trim();
  const courtLower = courtRaw.toLowerCase();

  const city = (details.city || "").trim();
  const district = (details.district || "").trim();

  if (courtLower.includes("high court")) {
    return city ? `High Court - ${city}` : "High Court";
  }

  if (courtLower.includes("district")) {
    return district ? `District Court - ${district}` : "District Court";
  }

  return courtRaw || "Not available";
}

function WorkspacePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All Cases");
  const [cases, setCases] = useState<WorkspaceCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingWorkspaceId, setOpeningWorkspaceId] = useState<string | null>(null);

  const loadSubscribedCases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const url = new URL("/api/cases/user-cases/v2", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "50");

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load subscribed cases");
      }

      setCases(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscribed cases");
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscribedCases();
  }, [loadSubscribedCases]);

  const handleOpenWorkspace = async (subscribedCaseId: string) => {
    try {
      setOpeningWorkspaceId(subscribedCaseId);

      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscribedCaseId }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.data?.id) {
        throw new Error(data.message || "Failed to open workspace");
      }

      router.push(`/workspace/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open workspace");
    } finally {
      setOpeningWorkspaceId(null);
    }
  };

  const hearingCount = cases.filter((caseItem) => getCaseDetails(caseItem).tentativeDate).length;
  const pendingSyncCount = cases.filter((caseItem) => getCaseDetails(caseItem).site_sync === 0).length;

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Workspace</h1>
          <p className="mt-1 text-sm text-muted-dark">Your central working area for ongoing cases, hearings, files, and payments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-text shadow-sm transition-colors hover:bg-background-dark">
            <LayoutGrid className="h-4 w-4" />
            View
          </button>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark">
            <Plus className="h-4 w-4" />
            New Case
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active matters", value: String(cases.length), helper: "Subscribed cases", icon: BriefcaseBusiness },
          { label: "Hearing dates", value: String(hearingCount), helper: "Tentative dates available", icon: CalendarDays },
          { label: "Pending sync", value: String(pendingSyncCount), helper: "Awaiting court sync", icon: FileText },
          { label: "Cause list items", value: String(hearingCount), helper: "Linked to tentative dates", icon: ListChecks },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.label} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-dark">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-text">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-dark">{item.helper}</p>
                </div>
                <span className="rounded-xl bg-primary-light p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </section>
          );
        })}
      </div>

      <div className="mb-4 inline-flex rounded-xl border border-border bg-background-dark p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
              activeTab === tab ? "bg-white text-text shadow-sm" : "text-muted-dark hover:text-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "All Cases" ? (
        <>
          <section className="mb-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-64 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 py-2 pl-9 text-sm text-text shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Search will use the existing q API filter later"
                  disabled
                />
              </div>
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-text shadow-sm transition-colors hover:bg-background-dark"
                >
                  <Filter className="h-3.5 w-3.5 text-muted-dark" />
                  {filter}
                </button>
              ))}
            </div>
          </section>

          {isLoading ? (
            <section className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-dark">Loading subscribed cases...</p>
            </section>
          ) : error ? (
            <section className="rounded-2xl border border-error/30 bg-error-light p-6 text-sm font-medium text-error-dark shadow-sm">
              {error}
            </section>
          ) : cases.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-text">No subscribed cases found</h2>
              <p className="mt-2 text-sm text-muted-dark">Subscribed cases will appear in this workspace table.</p>
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1160px] text-left text-sm">
                  <thead className="border-b border-border bg-background-dark text-xs uppercase tracking-wide text-muted-dark">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Case</th>
                      <th className="px-4 py-3 font-semibold">Client</th>
                      <th className="px-4 py-3 font-semibold">Court</th>
                      <th className="px-4 py-3 font-semibold">Hearing</th>
                      <th className="px-4 py-3 font-semibold">Case Status</th>
                      <th className="px-4 py-3 font-semibold">Sync Status</th>
                      <th className="px-4 py-3 font-semibold">Assigned To</th>
                      <th className="px-4 py-3 font-semibold">Payment</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cases.map((caseItem) => {
                      const details = getCaseDetails(caseItem);
                      const syncBadge = getSyncBadge(details.site_sync);
                      const caseStatusLabel = formatCaseStatusLabel(details.caseStatus);

                      return (
                        <tr key={caseItem.id} className="transition-colors hover:bg-primary-light/30">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-text">{getCaseTitle(caseItem)}</p>
                            <p className="mt-1 font-mono text-xs text-muted-dark">{getCaseReference(caseItem)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-primary shadow-sm hover:bg-primary-light"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Add Client
                            </button>
                          </td>
                          <td className="px-4 py-3 text-muted-dark">{formatCourtLabel(details)}</td>
                          <td className="px-4 py-3 font-mono text-xs text-text">{formatDate(details.tentativeDate)}</td>
                          <td className="max-w-[220px] px-4 py-3 text-sm text-text">
                            <span className="line-clamp-2" title={caseStatusLabel}>
                              {caseStatusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={syncBadge.tone} withDot>
                              {syncBadge.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-primary shadow-sm hover:bg-primary-light"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Add Collaborator
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone="warning">Receivable</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenWorkspace(caseItem.id)}
                                disabled={openingWorkspaceId === caseItem.id}
                                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-dark hover:bg-background-dark hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                {openingWorkspaceId === caseItem.id ? "Opening" : "View"}
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-dark hover:bg-background-dark hover:text-text"
                              >
                                <PenLine className="h-3.5 w-3.5" />
                                Status
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-dark hover:bg-background-dark hover:text-text"
                              >
                                <FolderOpen className="h-3.5 w-3.5" />
                                Files
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
            {activeTab === "Cause List" ? <ListChecks className="h-6 w-6" /> : <LayoutGrid className="h-6 w-6" />}
          </div>
          <h2 className="text-lg font-semibold text-text">{activeTab}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-dark">
            This workspace view is ready for the next UI pass. Data and interactions can be connected when the workflow is finalized.
          </p>
        </section>
      )}
    </main>
  );
}

export default WorkspacePage;
