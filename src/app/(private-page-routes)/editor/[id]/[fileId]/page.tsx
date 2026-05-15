"use client";

import { LegalEditor } from "@/components/LegalEditor/LegalEditor";
import { DocumentEditorProvider } from "@/components/LegalEditor/reducersContexts/documentEditorReducerContext";
import { UIProvider } from "@/components/LegalEditor/reducersContexts/editorUiReducerContext";
import { ExplorerProvider } from "@/components/LegalEditor/reducersContexts/explorerReducerContext";
import { FolderPickerProvider } from "@/components/LegalEditor/reducersContexts/folderPickerReducerContext";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function WorkspaceEditorPage() {
  const { id } = useParams<{ id: string; fileId: string }>();
  const [projectFolderId, setProjectFolderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadWorkspaceFolder = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`/api/workspace/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success || !data.data?.projectFolderId) {
          throw new Error(data.message || "Workspace folder not found");
        }

        setProjectFolderId(data.data.projectFolderId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Workspace folder not found");
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaceFolder();
  }, [id]);

  if (isLoading) {
    return (
      <main className="flex-1 p-6">
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-dark">Opening editor...</p>
        </div>
      </main>
    );
  }

  if (error || !projectFolderId) {
    return (
      <main className="flex-1 p-6">
        <div className="rounded-2xl border border-error/30 bg-error-light p-6 text-sm font-medium text-error-dark shadow-sm">
          {error || "Workspace folder not found"}
        </div>
      </main>
    );
  }

  return (
    <UIProvider>
      <ExplorerProvider>
        <FolderPickerProvider>
          <DocumentEditorProvider>
            <LegalEditor rootFolderId={projectFolderId} workspaceId={id} />
          </DocumentEditorProvider>
        </FolderPickerProvider>
      </ExplorerProvider>
    </UIProvider>
  );
}
