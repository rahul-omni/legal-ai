"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  FileText,
  Filter,
  LayoutGrid,
  ListChecks,
  Loader2,
  Lock,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CaseData, SearchParams, ValidationErrors } from "@/components/caseManagementComponents/types";
import { normalizePartiesDisplay } from "@/lib/parties";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

const SearchModal = dynamic(() => import("@/components/caseManagementComponents/SearchModal").then((mod) => mod.SearchModal), {
  ssr: false,
});

type WorkspaceCase = CaseData & {
  workspace?: {
    id: string;
    status: string;
    isLocked?: boolean;
    lockReason?: string | null;
  } | null;
  access?: {
    isLocked: boolean;
    lockReason: string | null;
    position: number | null;
    limit: number | null;
  };
  caseDetails?: (Partial<CaseData> & {
    id?: string;
    case_type?: string;
    site_sync?: number;
    tentativeDate?: string | Date | null;
    caseStatus?: string | null;
  }) | null;
};

type WorkspaceListFilters = { q: string; year: string; court: string };

const tabs = ["All Cases", "Cause List", "Card View"];
const defaultListFilters: WorkspaceListFilters = { q: "", year: "", court: "" };
const courtFilterOptions = ["Supreme Court", "High Court", "District Court", "Nclt Court"];

const defaultSearchParams: SearchParams = {
  number: "",
  year: "",
  court: "",
  judgmentType: "",
  caseType: "",
  city: "",
  bench: "",
  district: "",
  courtComplex: "",
};

const workspaceStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  STALLED: "Stalled",
};

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
  return workspaceStatusLabels[s] || s || "Pending";
}

function getWorkspaceStatusTone(status?: string | null) {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "primary";
  if (status === "STALLED") return "warning";
  return "muted";
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
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>(defaultSearchParams);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [listFilters, setListFilters] = useState<WorkspaceListFilters>(defaultListFilters);
  const [casePendingDelete, setCasePendingDelete] = useState<WorkspaceCase | null>(null);
  const [deletingSubscriptionId, setDeletingSubscriptionId] = useState<string | null>(null);

  const loadSubscribedCases = useCallback(async (filters: WorkspaceListFilters = defaultListFilters) => {
    try {
      setIsLoading(true);
      setError("");

      const url = new URL("/api/cases/user-cases/v2", window.location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "50");

      const q = filters.q.trim();
      if (q) {
        url.searchParams.set("q", q);
      }

      const year = filters.year.trim();
      if (/^\d{4}$/.test(year)) {
        url.searchParams.set("year", year);
      }

      const court = filters.court.trim();
      if (court) {
        url.searchParams.set("court", court);
      }

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
    loadSubscribedCases(defaultListFilters);
  }, [loadSubscribedCases]);

  const handleListFilterChange = (key: keyof WorkspaceListFilters, value: string) => {
    setListFilters((current) => ({ ...current, [key]: value }));
  };

  const handleListSearch = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    loadSubscribedCases(listFilters);
  };

  const handleClearListFilters = () => {
    setListFilters(defaultListFilters);
    loadSubscribedCases(defaultListFilters);
  };

  const validateSearchForm = () => {
    const errors: ValidationErrors = {};

    if (!searchParams.number.trim()) {
      errors.number = "Diary number is required";
    }

    if (!searchParams.year.trim()) {
      errors.year = "Year is required";
    } else if (!/^\d{4}$/.test(searchParams.year.trim())) {
      errors.year = "Year must be a 4-digit number";
    }

    if (!searchParams.court.trim()) {
      errors.court = "Court is required";
    }

    if (searchParams.court === "Supreme Court" && !searchParams.caseType.trim()) {
      errors.caseType = "Case type is required";
    }

    if (searchParams.court === "High Court") {
      if (!searchParams.city.trim()) {
        errors.city = "City is required";
      }
      if (!searchParams.caseType.trim()) {
        errors.caseType = "Case type is required";
      }
    }

    if (searchParams.court === "District Court") {
      if (!searchParams.district.trim()) {
        errors.district = "District is required";
      }
      if (!searchParams.courtComplex.trim()) {
        errors.courtComplex = "Court complex is required";
      }
      if (!searchParams.caseType.trim()) {
        errors.caseType = "Case type is required";
      }
    }

    if (searchParams.court === "Nclt Court") {
      if (!searchParams.bench.trim()) {
        errors.bench = "NCLT bench is required";
      }
      if (!searchParams.caseType.trim()) {
        errors.caseType = "Case type is required";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCloseNewCaseModal = () => {
    setShowNewCaseModal(false);
    setSearchParams(defaultSearchParams);
    setValidationErrors({});
  };

  const handleAddNewCase = async () => {
    setValidationErrors({});

    if (!validateSearchForm()) {
      return;
    }

    try {
      setIsAddingCase(true);

      const searchUrl = new URL("/api/cases/search/allCourts", window.location.origin);
      searchUrl.searchParams.append("diaryNumber", searchParams.number);
      searchUrl.searchParams.append("year", searchParams.year);

      if (searchParams.court) searchUrl.searchParams.append("court", searchParams.court);
      if (searchParams.judgmentType) searchUrl.searchParams.append("judgmentType", searchParams.judgmentType);
      if (searchParams.caseType) searchUrl.searchParams.append("caseType", searchParams.caseType);
      if (searchParams.city) searchUrl.searchParams.append("city", searchParams.city);
      if (searchParams.bench) searchUrl.searchParams.append("bench", searchParams.bench);
      if (searchParams.district) searchUrl.searchParams.append("district", searchParams.district);
      if (searchParams.courtComplex) searchUrl.searchParams.append("courtComplex", searchParams.courtComplex);

      const response = await fetch(searchUrl.toString());
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to subscribe case");
      }

      if (responseData.message === "Case exists.") {
        toast.success("Case subscribed successfully.");
        handleCloseNewCaseModal();
      } else if (responseData.message === "Triggered external Cloud Function.") {
        toast.success("Case is subscribed will take 2-5 mins to sync the case details.");
        handleCloseNewCaseModal();
      } else if (responseData.message === "Case already subscribed.") {
        toast.error("Case already subscribed.");
      } else {
        toast.success(responseData.message || "Case subscribed successfully.");
        handleCloseNewCaseModal();
      }

      setActiveTab("All Cases");
      await loadSubscribedCases(listFilters);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe case";
      setValidationErrors({ general: message });
      toast.error(message);
    } finally {
      setIsAddingCase(false);
    }
  };

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

  const handleConfirmDeleteWorkspace = async () => {
    if (!casePendingDelete?.id) return;

    try {
      setDeletingSubscriptionId(casePendingDelete.id);

      const response = await fetch(`/api/cases/user-cases/${casePendingDelete.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete workspace");
      }

      toast.success("Workspace deleted successfully");
      setCasePendingDelete(null);
      await loadSubscribedCases(listFilters);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete workspace";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingSubscriptionId(null);
    }
  };

  const hearingCount = cases.filter((caseItem) => getCaseDetails(caseItem).tentativeDate).length;
  const pendingSyncCount = cases.filter((caseItem) => getCaseDetails(caseItem).site_sync === 0).length;
  const lockedWorkspaceCount = cases.filter((caseItem) => caseItem.access?.isLocked || caseItem.workspace?.isLocked).length;
  const hasActiveListFilters = Boolean(listFilters.q.trim() || listFilters.year.trim() || listFilters.court.trim());

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Workspace</h1>
          <p className="mt-1 text-sm text-muted-dark">Your central working area for ongoing cases, hearings, files, and payments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-text shadow-sm transition-colors hover:bg-background-dark">
            <LayoutGrid className="h-4 w-4" />
            View
          </button> */}
          <button
            type="button"
            onClick={() => setShowNewCaseModal(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            New Case
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active matters", value: String(Math.max(cases.length - lockedWorkspaceCount, 0)), helper: lockedWorkspaceCount ? `${lockedWorkspaceCount} locked by plan` : "Subscribed cases", icon: BriefcaseBusiness },
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
          <form onSubmit={handleListSearch} className="mb-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-64 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={listFilters.q}
                  onChange={(event) => handleListFilterChange("q", event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 py-2 pl-9 text-sm text-text shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Search case number, diary number, parties, bench..."
                />
              </div>
              <input
                value={listFilters.year}
                onChange={(event) => handleListFilterChange("year", event.target.value.replace(/\D/g, "").slice(0, 4))}
                className="h-10 w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Year"
                inputMode="numeric"
              />
              <select
                value={listFilters.court}
                onChange={(event) => handleListFilterChange("court", event.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All courts</option>
                {courtFilterOptions.map((court) => (
                  <option key={court} value={court}>
                    {court}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading}
              >
                <Filter className="h-3.5 w-3.5" />
                Search
              </button>
              {hasActiveListFilters ? (
                <button
                  type="button"
                  onClick={handleClearListFilters}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-muted-dark shadow-sm transition-colors hover:bg-background-dark hover:text-text"
                  disabled={isLoading}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </form>

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
              <h2 className="text-lg font-semibold text-text">
                {hasActiveListFilters ? "No matching cases found" : "No subscribed cases found"}
              </h2>
              <p className="mt-2 text-sm text-muted-dark">
                {hasActiveListFilters
                  ? "Try changing your search text, year, or court filter."
                  : "Subscribed cases will appear in this workspace table."}
              </p>
              {hasActiveListFilters ? (
                <button
                  type="button"
                  onClick={handleClearListFilters}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-text shadow-sm hover:bg-background-dark"
                >
                  Clear filters
                </button>
              ) : null}
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left text-sm">
                  <thead className="border-b border-border bg-background-dark text-xs uppercase tracking-wide text-muted-dark">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Case</th>
                      <th className="px-4 py-3 font-semibold">Court</th>
                      <th className="px-4 py-3 font-semibold">Hearing</th>
                      <th className="px-4 py-3 font-semibold">Case Status</th>
                      <th className="px-4 py-3 font-semibold">Sync Status</th>
                      <th className="px-4 py-3 font-semibold">Payment</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cases.map((caseItem) => {
                      const details = getCaseDetails(caseItem);
                      const syncBadge = getSyncBadge(details.site_sync);
                      const workspaceStatus = caseItem.workspace?.status || "PENDING";
                      const caseStatusLabel = formatCaseStatusLabel(workspaceStatus);
                      const isLocked = Boolean(caseItem.access?.isLocked || caseItem.workspace?.isLocked);
                      const lockReason = caseItem.access?.lockReason || caseItem.workspace?.lockReason || "Upgrade your plan to unlock this workspace.";

                      return (
                        <tr key={caseItem.id} className={`transition-colors ${isLocked ? "bg-muted-light/40 text-muted-dark hover:bg-muted-light/60" : "hover:bg-primary-light/30"}`}>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`font-semibold ${isLocked ? "text-muted-dark" : "text-text"}`}>{getCaseTitle(caseItem)}</p>
                              {isLocked ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-muted/30 bg-muted-light px-2 py-0.5 text-[11px] font-semibold text-muted-dark" title={lockReason}>
                                  <Lock className="h-3 w-3" />
                                  Locked
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 font-mono text-xs text-muted-dark">{getCaseReference(caseItem)}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-dark">{formatCourtLabel(details)}</td>
                          <td className={`px-4 py-3 font-mono text-xs ${isLocked ? "text-muted-dark" : "text-text"}`}>{formatDate(details.tentativeDate)}</td>
                          <td className="max-w-[220px] px-4 py-3">
                            <span
                              className={`inline-flex min-w-[5.75rem] justify-center whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-sm ${toneClasses[isLocked ? "muted" : getWorkspaceStatusTone(workspaceStatus)]}`}
                              title={caseStatusLabel}
                            >
                              {caseStatusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={isLocked ? "muted" : syncBadge.tone} withDot>
                              {syncBadge.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={isLocked ? "muted" : "warning"}>Receivable</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isLocked) handleOpenWorkspace(caseItem.id);
                                }}
                                disabled={isLocked || openingWorkspaceId === caseItem.id}
                                title={isLocked ? lockReason : "Open workspace"}
                                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-dark hover:bg-background-dark hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {openingWorkspaceId === caseItem.id ? (
                                  <Loader2 className="h-10 w-10 animate-spin text-primary" strokeWidth={2.5} aria-label="Opening workspace" />
                                ) : (
                                  <>
                                    {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    {isLocked ? "Locked" : "View"}
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCasePendingDelete(caseItem)}
                                disabled={deletingSubscriptionId === caseItem.id}
                                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-dark hover:bg-background-dark hover:text-text"
                              >
                                {deletingSubscriptionId === caseItem.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                Delete
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
        <section className="relative overflow-hidden rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary-light/80 to-transparent" />
          <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-white text-primary shadow-sm">
            {activeTab === "Cause List" ? <ListChecks className="h-7 w-7" /> : <LayoutGrid className="h-7 w-7" />}
          </div>
          <div className="relative mx-auto max-w-xl">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
              Coming soon
            </span>
            <h2 className="mt-3 text-xl font-semibold text-text">{activeTab}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-dark">
              We are shaping this view for faster workspace reviews. Your subscribed cases stay available in the table while this experience is prepared.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4 text-left">
                <CalendarDays className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-text">Court dates</p>
                <p className="mt-1 text-xs leading-5 text-muted-dark">Track upcoming listings and hearing movement.</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4 text-left">
                <FileText className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-text">Case context</p>
                <p className="mt-1 text-xs leading-5 text-muted-dark">See key case facts without leaving Workspace.</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4 text-left">
                <Search className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-text">Quick filters</p>
                <p className="mt-1 text-xs leading-5 text-muted-dark">Find the right matter by court, year, and status.</p>
              </div>
            </div>
          </div>
        </section>
      )}
      {showNewCaseModal ? (
        <SearchModal
          showModal={showNewCaseModal}
          foundCases={[]}
          selectedCases={[]}
          selectAll={false}
          searchParams={searchParams}
          isLoading={isAddingCase}
          isSubmitting={false}
          loadingUrls={{}}
          errors={validationErrors}
          onClose={handleCloseNewCaseModal}
          setSearchParams={setSearchParams}
          onSearch={handleAddNewCase}
          onToggleSelectCase={() => undefined}
          onToggleSelectAll={() => undefined}
          handlePdfClick={() => undefined}
          onCreateCases={() => undefined}
          onBackToSearch={() => undefined}
        />
      ) : null}
      <ConfirmationModal
        isOpen={Boolean(casePendingDelete)}
        onClose={() => {
          if (!deletingSubscriptionId) setCasePendingDelete(null);
        }}
        onConfirm={handleConfirmDeleteWorkspace}
        title="Delete Workspace"
        message={`Are you sure you want to delete this workspace? This will remove the workspace and delete the case subscription.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={Boolean(deletingSubscriptionId)}
      />
    </main>
  );
}

export default WorkspacePage;
