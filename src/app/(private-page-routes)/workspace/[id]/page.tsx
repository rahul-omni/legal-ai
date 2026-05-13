"use client";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle,
  Circle,
  Clock,
  FilePlus,
  FileStack,
  FileText,
  FolderUp,
  Gavel,
  Hash,
  Languages,
  PenLine,
  Plus,
  ScanText,
  Upload,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { normalizePartiesDisplay } from "@/lib/parties";

type WorkspaceDetails = {
  id: string;
  workspaceStatus: string;
  workspaceCreatedAt: string;
  workspaceUpdatedAt: string;
  subscribedCaseId: string;
  subscriptionStatus: string;
  subscriptionCreatedAt: string;
  caseId: string;
  parties: string | null;
  diaryNumber: string | null;
  caseNumber: string | null;
  court: string;
  city: string | null;
  district: string | null;
  bench: string | null;
  caseType: string | null;
  caseStatus: string | null;
  tentativeDate: string | null;
  siteSync: number | null;
  judgmentBy: string | null;
  judgmentDate: string | null;
  filingDate: string | null;
  filingNumber: string | null;
  lastListed: string | null;
  nextListingDate: string | null;
  registeredOn: string | null;
  petitionerAdvocate: string | null;
  respondentAdvocate: string | null;
  orderDetails: unknown;
  judgmentUrl: unknown;
  causeListNotifications: CauseListNotification[];
};

type CauseListNotification = {
  id: string;
  day: string | null;
  message: string | null;
  method: string | null;
  status: string | null;
  createdAt: string | null;
};

type TimelineEvent = {
  id: string;
  type: "order" | "causelist" | "hearing" | "subscription";
  date: string;
  sortValue: number;
  title: string;
  description: string;
  url?: string;
  filename?: string;
};

type WorkspaceTask = {
  id: string;
  workspaceId: string;
  title: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  assignedToUserId: string;
  assignedToName: string | null;
  assignedToEmail: string | null;
  assignedByUserId: string;
  assignedByName: string | null;
  assignedByEmail: string | null;
};

const taskStatusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "DONE", label: "Done" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "STALLED", label: "Stalled" },
];

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

function formatDate(value?: string | null) {
  return parseCourtDate(value).display;
}

function parseCourtDate(value?: string | null) {
  if (!value) return { display: "Not available", timestamp: 0 };

  const raw = value.trim();
  if (!raw) return { display: "Not available", timestamp: 0 };

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return {
      display: `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`,
      timestamp: date.getTime(),
    };
  }

  const dayFirstMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return {
      display: `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`,
      timestamp: date.getTime(),
    };
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      display: `${String(parsed.getDate()).padStart(2, "0")}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${parsed.getFullYear()}`,
      timestamp: parsed.getTime(),
    };
  }

  return { display: raw, timestamp: 0 };
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOrderSource(source: unknown) {
  if (!source) return [] as Record<string, unknown>[];
  if (Array.isArray(source)) {
    return source.flatMap((item) => {
      const itemRecord = asRecord(item);
      if (itemRecord && Array.isArray(itemRecord.orders)) {
        return itemRecord.orders.filter(Boolean).map((order) => asRecord(order)).filter(Boolean) as Record<string, unknown>[];
      }
      return itemRecord ? [itemRecord] : [];
    });
  }

  const record = asRecord(source);
  if (!record) return [];
  if (Array.isArray(record.orders)) {
    return record.orders.filter(Boolean).map((order) => asRecord(order)).filter(Boolean) as Record<string, unknown>[];
  }

  return [record];
}

function buildTimelineEvents(workspace: WorkspaceDetails, courtLabel: string, hearingDate: string): TimelineEvent[] {
  const orderSources = [
    ...normalizeOrderSource(workspace.orderDetails),
    ...normalizeOrderSource(workspace.judgmentUrl),
  ];

  const orderEvents = orderSources
    .map((order, index) => {
      const rawDate = asString(order.order_date) || asString(order.judgmentDate) || asString(order.date) || asString(order.orderDate);
      const parsedDate = parseCourtDate(rawDate);
      const url = asString(order.order_url) || asString(order.url) || asString(order.gcsPath) || asString(order.link);
      const filename = asString(order.filename);
      const orderNumber = asString(order.order_number) || asString(order.orderNumber);
      const details = asString(order.order_details) || asString(order.details) || asString(order.filename) || "Order available";

      if (!rawDate && !url && !details) return null;

      return {
        id: `order-${index}-${rawDate || url || details}`,
        type: "order" as const,
        date: parsedDate.display,
        sortValue: parsedDate.timestamp,
        title: orderNumber ? `Order ${orderNumber}` : "Order",
        description: details,
        url,
        filename,
      };
    })
    .filter(Boolean) as TimelineEvent[];

  const causeListEvents = (workspace.causeListNotifications || []).map((notification) => {
    const parsedDate = parseCourtDate(notification.day || notification.createdAt);
    return {
      id: `causelist-${notification.id}`,
      type: "causelist" as const,
      date: parsedDate.display,
      sortValue: parsedDate.timestamp,
      title: "Cause List",
      description: notification.message || `${courtLabel} cause list update`,
    };
  });

  const events: TimelineEvent[] = [
    ...orderEvents,
    ...causeListEvents,
  ];

  if (workspace.subscriptionCreatedAt) {
    const parsedDate = parseCourtDate(workspace.subscriptionCreatedAt);
    events.push({
      id: "case-subscribed",
      type: "subscription",
      date: parsedDate.display,
      sortValue: parsedDate.timestamp,
      title: "Case Subscribed",
      description: "This case was added to your workspace.",
    });
  }

  if (hearingDate !== "Not available") {
    const parsedDate = parseCourtDate(hearingDate);
    events.push({
      id: "tentative-hearing",
      type: "hearing",
      date: hearingDate,
      sortValue: parsedDate.timestamp,
      title: "Tentative Hearing",
      description: courtLabel,
    });
  }

  return events.sort((a, b) => {
    const dateA = a.sortValue;
    const dateB = b.sortValue;
    if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
    if (Number.isNaN(dateA)) return 1;
    if (Number.isNaN(dateB)) return -1;
    return dateB - dateA;
  });
}

function formatCourtLabel(workspace: WorkspaceDetails) {
  const courtRaw = (workspace.court || "").trim();
  const courtLower = courtRaw.toLowerCase();
  const city = (workspace.city || "").trim();
  const district = (workspace.district || "").trim();

  if (courtLower.includes("high court")) {
    return city ? `High Court - ${city}` : "High Court";
  }

  if (courtLower.includes("district")) {
    return district ? `District Court - ${district}` : "District Court";
  }

  return courtRaw || "Not available";
}

function getSyncBadge(siteSync?: number | null) {
  if (siteSync === 1) return { label: "Site Synced", tone: "success" };
  if (siteSync === 0) return { label: "Site Sync Pending", tone: "warning" };
  return { label: "Error Syncing", tone: "error" };
}

function valueOrFallback(value?: string | null) {
  const text = (value || "").trim();
  return text || "Not available";
}

function formatPersonName(name?: string | null, email?: string | null) {
  return valueOrFallback(name || email);
}

function getTaskVisual(status: string, dueDate?: string | null) {
  if (status === "DONE" || status === "COMPLETED") return { icon: CheckCircle, tone: "text-success", badgeTone: "success" };
  if (status === "OVERDUE") return { icon: Clock, tone: "text-error", badgeTone: "error" };
  if (status === "STALLED") return { icon: Circle, tone: "text-warning", badgeTone: "warning" };
  if (dueDate) return { icon: Clock, tone: "text-warning", badgeTone: "warning" };
  return { icon: Circle, tone: "text-muted-dark", badgeTone: "muted" };
}

function getTaskStatusSelectClass(status: string) {
  if (status === "DONE") return "border-success/30 bg-success-light text-success-dark";
  if (status === "OVERDUE") return "border-error/30 bg-error-light text-error-dark";
  if (status === "STALLED") return "border-warning/30 bg-warning-light text-warning-dark";
  return "border-border bg-muted-light text-muted-dark";
}

function WorkspaceDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [workspace, setWorkspace] = useState<WorkspaceDetails | null>(null);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState("PENDING");

  const generateSignedUrlForCase = async (filePath: string) => {
    const response = await fetch("/api/signed-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filePath,
        bucketName: process.env.NEXT_PUBLIC_HIGH_COURT_PDF_BUCKET || "high-court-pdfs",
        expirationMinutes: 30,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate signed URL");
    }

    const data = await response.json();
    return data.signedUrl as string;
  };

  useEffect(() => {
    if (!id) return;

    const loadWorkspace = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`/api/workspace/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load workspace");
        }

        setWorkspace(data.data);

        setIsTasksLoading(true);
        const tasksResponse = await fetch(`/api/workspace/${id}/tasks`);
        const tasksData = await tasksResponse.json();

        if (!tasksResponse.ok || !tasksData.success) {
          setTaskError(tasksData.message || "Failed to load workspace tasks");
          setTasks([]);
        } else {
          setTasks(tasksData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workspace");
        setWorkspace(null);
      } finally {
        setIsLoading(false);
        setIsTasksLoading(false);
      }
    };

    loadWorkspace();
  }, [id]);

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !newTaskTitle.trim()) return;

    try {
      setIsCreatingTask(true);
      setTaskError("");

      const response = await fetch(`/api/workspace/${id}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          dueDate: newTaskDueDate || null,
          status: newTaskStatus,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create task");
      }

      setTasks((current) => [data.data, ...current]);
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewTaskStatus("PENDING");
      setIsTaskModalOpen(false);
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    if (!id) return;

    const previousTasks = tasks;
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status } : task)));

    try {
      setUpdatingTaskId(taskId);
      setTaskError("");

      const response = await fetch(`/api/workspace/${id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update task status");
      }

      setTasks((current) => current.map((task) => (task.id === taskId ? data.data : task)));
    } catch (err) {
      setTasks(previousTasks);
      setTaskError(err instanceof Error ? err.message : "Failed to update task status");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleOpenTimelineEvent = async (event: TimelineEvent) => {
    try {
      if (workspace?.court === "High Court" && workspace?.city === "Delhi" && event.filename) {
        const signedUrl = await generateSignedUrlForCase(event.filename);
        window.open(signedUrl, "_blank", "noopener,noreferrer");
        return;
      }

      if (event.url) {
        window.open(event.url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : "Failed to open order");
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-dark">Loading workspace...</p>
        </div>
      </main>
    );
  }

  if (error || !workspace) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <button
          type="button"
          onClick={() => router.push("/workspace")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-dark hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspace
        </button>
        <div className="rounded-2xl border border-error/30 bg-error-light p-6 text-sm font-medium text-error-dark shadow-sm">
          {error || "Workspace not found"}
        </div>
      </main>
    );
  }

  const syncBadge = getSyncBadge(workspace.siteSync);
  const caseTitle = valueOrFallback(normalizePartiesDisplay(workspace.parties) || workspace.caseNumber || workspace.diaryNumber);
  const caseStatus = valueOrFallback(workspace.caseStatus || "Pending");
  const hearingDate = formatDate(workspace.tentativeDate);
  const courtLabel = formatCourtLabel(workspace);

  const caseFacts = [
    { label: "Diary Number", value: valueOrFallback(workspace.diaryNumber), icon: Hash },
    { label: "Case Number", value: valueOrFallback(workspace.caseNumber), icon: Hash },
    { label: "Court", value: courtLabel, icon: Gavel },
    { label: "Bench", value: valueOrFallback(workspace.bench), icon: BriefcaseBusiness },
    { label: "Case Type", value: valueOrFallback(workspace.caseType), icon: FileText },
    { label: "Tentative Hearing", value: hearingDate, icon: CalendarDays },
  ];

  const workspaceFacts = [
    { label: "Workspace ID", value: workspace.id },
    { label: "Workspace Status", value: workspace.workspaceStatus },
    { label: "Subscribed Case ID", value: workspace.subscribedCaseId },
    { label: "Subscription Status", value: workspace.subscriptionStatus },
    { label: "Created", value: formatDateTime(workspace.workspaceCreatedAt) },
    { label: "Updated", value: formatDateTime(workspace.workspaceUpdatedAt) },
  ];

  const documentOperations = [
    { label: "Draft", icon: FileText },
    { label: "Translate", icon: Languages },
    { label: "OCR Extract", icon: ScanText },
    { label: "Templates", icon: FileStack },
  ];

  const files = [
    { name: "Petition_Final_v3.pdf", meta: "2.4 MB - 2h ago" },
    { name: "Affidavit_Client.docx", meta: "184 KB - Yesterday" },
    { name: "Evidence_Bundle/", meta: "12 files - 3 days ago" },
    { name: "Draft_Rejoinder.docx", meta: "92 KB - 1 week ago" },
  ];

  const timeline = buildTimelineEvents(workspace, courtLabel, hearingDate);

  return (
    <main className="flex-1 px-4 py-2 sm:p-6 lg:p-8">
      {/* <button
        type="button"
        onClick={() => router.push("/workspace")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-dark hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workspace
      </button> */}

      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-dark">{workspace.diaryNumber || workspace.caseNumber || workspace.id}</span>
            <Badge tone="primary" withDot>
              {caseStatus}
            </Badge>
            <Badge tone={syncBadge.tone} withDot>
              {syncBadge.label}
            </Badge>
            <Badge tone="warning">Receivable</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text">{caseTitle}</h1>
          <p className="mt-1 text-sm text-muted-dark">
            {courtLabel} - Hearing {hearingDate} {courtLabel === "High Court" ? `- ${valueOrFallback(workspace.bench)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark">
            <PenLine className="h-4 w-4" />
            Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-text">Case Details</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {caseFacts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <div key={fact.label} className="rounded-xl border border-border bg-background p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-dark">
                      <Icon className="h-3.5 w-3.5" />
                      {fact.label}
                    </div>
                    <p className="break-words text-sm font-semibold text-text">{fact.value}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-dark">Advocates</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <p className="text-sm text-text">
                  <span className="font-semibold">Petitioner:</span> {valueOrFallback(workspace.petitionerAdvocate)}
                </p>
                <p className="text-sm text-text">
                  <span className="font-semibold">Respondent:</span> {valueOrFallback(workspace.respondentAdvocate)}
                </p>
              </div>
            </div>
          </section> */}

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-text">Document Operations</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {documentOperations.map((operation) => {
                const Icon = operation.icon;
                return (
                  <button
                    key={operation.label}
                    className="rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-primary/40 hover:bg-primary-light"
                  >
                    <Icon className="mb-2 h-5 w-5 text-primary" />
                    <div className="text-sm font-semibold text-text">{operation.label}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-text">Files & Documents</h3>
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-text shadow-sm hover:bg-background-dark">
                  <Upload className="h-3.5 w-3.5" />
                  Upload File
                </button>
                <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-text shadow-sm hover:bg-background-dark">
                  <FolderUp className="h-3.5 w-3.5" />
                  Upload Folder
                </button>
                <button className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-sm hover:bg-primary-dark">
                  <FilePlus className="h-3.5 w-3.5" />
                  New Doc
                </button>
              </div>
            </div>
            <div className="divide-y divide-border">
              {files.map((file) => (
                <div key={file.name} className="flex items-center gap-3 p-4 hover:bg-primary-light/30">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-light text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-text">{file.name}</div>
                    <div className="text-xs text-muted-dark">{file.meta}</div>
                  </div>
                  <button className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-muted-dark hover:bg-background-dark hover:text-text">
                    Open
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">

          <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h3 className="text-lg font-semibold text-text">Task Management</h3>
                <p className="mt-1 text-xs text-muted-dark">{tasks.length} workspace tasks</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTaskError("");
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-muted-dark hover:bg-background-dark hover:text-text"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Task
              </button>
            </div>
            <div className="divide-y divide-border">
              {isTasksLoading ? (
                <div className="p-4 text-sm text-muted-dark">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="p-4 text-sm text-muted-dark">No tasks assigned yet.</div>
              ) : (
                tasks.map((task) => {
                  const taskVisual = getTaskVisual(task.status, task.dueDate);
                  const Icon = taskVisual.icon;
                  return (
                    <div key={task.id} className="flex items-start gap-3 p-4">
                      <Icon className={`mt-0.5 h-4 w-4 ${taskVisual.tone}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-semibold text-text">{task.title}</div>
                          <select
                            value={task.status}
                            disabled={updatingTaskId === task.id}
                            onChange={(event) => handleTaskStatusChange(task.id, event.target.value)}
                            className={`h-7 rounded-full border px-2 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${getTaskStatusSelectClass(task.status)}`}
                            aria-label={`Change status for ${task.title}`}
                          >
                            {taskStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-1 space-y-0.5 text-xs text-muted-dark">
                          <div>{formatPersonName(task.assignedToName, task.assignedToEmail)} · Due {formatDate(task.dueDate)}</div>
                          <div>Assigned by {formatPersonName(task.assignedByName, task.assignedByEmail)} · Created {formatDate(task.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border p-5">
              <h3 className="text-lg font-semibold text-text">Timeline & Orders</h3>
              <p className="mt-1 text-xs text-muted-dark">Orders, cause-list notifications, and tentative hearing dates.</p>
            </div>
            <div className="space-y-4 p-5">
              {timeline.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-dark">
                  No orders, cause-list entries, or tentative dates are available yet.
                </div>
              ) : (
                timeline.map((event, index) => {
                  const Icon =
                    event.type === "order"
                      ? FileText
                      : event.type === "causelist"
                        ? CalendarDays
                        : event.type === "subscription"
                          ? BriefcaseBusiness
                          : Clock;
                  const dotClass =
                    event.type === "order"
                      ? "bg-primary"
                      : event.type === "causelist"
                        ? "bg-warning"
                        : event.type === "subscription"
                          ? "bg-muted-dark"
                          : "bg-success";

                  return (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                        {index < timeline.length - 1 ? <div className="my-1 w-px flex-1 bg-border" /> : null}
                      </div>
                      <div className="min-w-0 flex-1 pb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-dark" />
                          <div className="font-mono text-xs text-muted-dark">{event.date}</div>
                        </div>
                        <div className="mt-0.5 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-text">{event.title}</div>
                            <div className="line-clamp-2 text-xs text-muted-dark" title={event.description}>
                              {event.description}
                            </div>
                          </div>
                          {event.url || event.filename ? (
                            <button
                              type="button"
                              onClick={() => handleOpenTimelineEvent(event)}
                              className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-light"
                            >
                              Open
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {isTaskModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <h3 className="text-lg font-semibold text-text">Add Task</h3>
                <p className="mt-1 text-xs text-muted-dark">
                  This task will be linked to this workspace. Assigned to and assigned by are set to you for now.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-dark hover:bg-background-dark hover:text-text"
                aria-label="Close task modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-dark">
                  Task
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="e.g. File rejoinder"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-dark">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(event) => setNewTaskDueDate(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-dark">
                  Status
                </label>
                <select
                  value={newTaskStatus}
                  onChange={(event) => setNewTaskStatus(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {taskStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {taskError ? <p className="text-xs font-medium text-error">{taskError}</p> : null}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-text shadow-sm hover:bg-background-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim() || isCreatingTask}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {isCreatingTask ? "Adding" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default WorkspaceDetailPage;
