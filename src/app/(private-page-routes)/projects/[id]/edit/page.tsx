"use client";

import { LegalEditor } from "@/components/LegalEditor/LegalEditor";
import { DocumentEditorProvider } from "@/components/LegalEditor/reducersContexts/documentEditorReducerContext";
import { UIProvider } from "@/components/LegalEditor/reducersContexts/editorUiReducerContext";
import { ExplorerProvider } from "@/components/LegalEditor/reducersContexts/explorerReducerContext";
import { FolderPickerProvider } from "@/components/LegalEditor/reducersContexts/folderPickerReducerContext";

export default function Page() {
  return (
    <UIProvider>
      <ExplorerProvider>
        <FolderPickerProvider>
          <DocumentEditorProvider>
            <LegalEditor />
          </DocumentEditorProvider>
        </FolderPickerProvider>
      </ExplorerProvider>
    </UIProvider>
  );
}
