"use client";

import { LegalEditor } from "@/components/LegalEditor/LegalEditor";
import { FileProvider } from "@/components/LegalEditor/reducers/fileReducer";

export default function Page() {
  return (
    <FileProvider>
      <LegalEditor />
    </FileProvider>
  );
}
