"use client";
import { useLoading } from "@/context/loadingContext";
import { handleApiError } from "@/helper/handleApiError";
import { RiskAnalyzer, RiskFinding } from "@/lib/riskAnalyzer";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { useEffect, useState } from "react";
import { DocumentPane } from "./DocumentPane";
import { FileExplorerV2 } from "./FileExplorerV2";
import { RightPanel } from "./RightPanel";
import { 
  PanelLeft, 
  PanelRightOpen, 
} from "lucide-react";

// Add this type for language options
type LanguageOption = {
  label: string;
  value: string;
};

// Add these language options
const indianLanguages: LanguageOption[] = [
  { label: "English", value: "English" },
  { label: "Hindi", value: "Hindi" },
  { label: "Tamil", value: "Tamil" },
  { label: "Telugu", value: "Telugu" },
  { label: "Bengali", value: "Bengali" },
  { label: "Marathi", value: "Marathi" },
  { label: "Gujarati", value: "Gujarati" },
  { label: "Kannada", value: "Kannada" },
  { label: "Malayalam", value: "Malayalam" },
];

export default function LegalEditor() {
  const [files, setFiles] = useState<FileSystemNodeProps[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileSystemNodeProps>();
  const [documentContent, setDocumentContent] = useState(
    "This Agreement is made between..."
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    indianLanguages[0].value
  );
  const [risks, setRisks] = useState<RiskFinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIPopup, setShowAIPopup] = useState(false);
  const { startLoading, stopLoading } = useLoading();

  const [selectedText, setSelectedText] = useState("");
  const [popupPosition, setPopupPosition] = useState({ x: 900, y: 100 });
  const [editorContent, setEditorContent] = useState("");

  // Add state for panel visibility
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const loadDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };
  useEffect(() => {
    loadDocuments(); // Only load documents, don't show popup
  }, []);

  const openPopupWithSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";
    const position = selection?.getRangeAt(0)?.getBoundingClientRect();

    if (selectedText) {
      setSelectedText(selectedText);
      setPopupPosition({
        x: position?.x ?? 900,
        y: position?.y ?? 100,
      });
      setEditorContent(documentContent);
      setShowAIPopup(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        openPopupWithSelection(); // 👈 Just one call here
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [documentContent]);

  const handleFileSelect = (file: FileSystemNodeProps) => {
    setSelectedFile(file);
    if (file.content) {
      setDocumentContent(file.content);
    }
  };

  const handleContentChange = (newContent: string) => {
    setDocumentContent(newContent);
    if (selectedFile) {
      // Update the file content in FileExplorer
      selectedFile.content = newContent;
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    // toast({
    //   title: type === 'success' ? 'Success' : 'Error',
    //   description: message,
    //   variant: type === 'success' ? 'default' : 'destructive'
    // });
  };

  const handleGenerateSummary = async () => {
    try {
      setIsLoading(true);

      if (!documentContent || documentContent.trim().length === 0) {
        alert("Please enter some text first");
        return;
      }

      const requestBody = { text: documentContent };
      console.log("Sending request with body:", requestBody);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Response:", {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      if (!data.summary) {
        throw new Error("No summary received from API");
      }

      setDocumentContent(data.summary);
    } catch (error) {
      console.error("Summary error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to generate summary"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: documentContent,
          targetLanguage: selectedLanguage,
        }),
      });

      if (!response.ok) throw new Error("Translation failed");

      const data = await response.json();
      setDocumentContent(data.translatedText);
    } catch (error) {
      console.error("Translation error:", error);
      alert("Failed to translate text");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    try {
      const response = await fetch(`/api/documents/${selectedFile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: documentContent,
        }),
      });

      if (!response.ok) throw new Error("Failed to save document");
      showToast("Document saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save document", "error");
    }
  };

  const handleSaveAs = async () => {
    const newName = prompt("Enter new file name:", selectedFile?.name || "");
    if (!newName) return;

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          content: documentContent,
          type: "file",
        }),
      });

      if (!response.ok) throw new Error("Failed to save document");
      showToast("Document saved successfully");
      // Refresh file list
      loadDocuments();
    } catch (error) {
      console.error("Save as error:", error);
      showToast("Failed to save document", "error");
    }
  };

  const handleAnalyzeRisks = async () => {
    try {
      startLoading("RISK_ANALYZE");
      const findings = await RiskAnalyzer.analyzeContract(documentContent);
      setRisks(findings);
    } catch (error) {
      handleApiError(error, showToast);
    } finally {
      stopLoading("RISK_ANALYZE");
    }
  };

  const handleRiskClick = (risk: RiskFinding) => {
    // Scroll to and highlight the risky section
    debugger;
    if (risk.location) {
      setDocumentContent((prevContent) => {
        // You might want to implement a more sophisticated highlighting mechanism
        const before = prevContent.slice(0, risk.location.start);
        const highlighted = prevContent.slice(
          risk.location.start,
          risk.location.end
        );
        const after = prevContent.slice(risk.location.end);
        return before + highlighted + after;
      });
    }
  };

  const handleTemplateSelect = (content: string) => {
    setDocumentContent(content);
    // Optionally show a toast notification
    // showToast('Template loaded successfully');
  };

  const handlePdfParsed = (text: string) => {
    setDocumentContent(text); // Update the document content with parsed PDF text
  };

  useEffect(() => {
    if (showAIPopup) {
      console.log("Documents loaded and passed to AIPopup:", files);
    }
  }, [showAIPopup, files]);

  useEffect(() => {
    if (files.length > 0) {
      console.log("Documents loaded and passed to AIPopup:", files);
    }
  }, [files]);

  return (
    <div className="h-screen flex flex-col bg-[#f9f9f9]">
      {/* Toolbar */}
      <div className="absolute top-0 right-0 z-50 flex gap-1 p-2">
        <div className="flex gap-1 bg-[#f9f9f9] shadow-sm rounded p-1">
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className={`p-1.5 rounded ${showLeftPanel ? 'bg-white shadow-sm' : 'bg-transparent'} 
                       hover:bg-white hover:shadow-sm transition-all`}
          >
            <PanelLeft className="w-4 h-4 text-gray-600/80" />
          </button>
          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            className={`p-1.5 rounded ${showRightPanel ? 'bg-white shadow-sm' : 'bg-transparent'} 
                       hover:bg-white hover:shadow-sm transition-all`}
          >
            <PanelRightOpen className="w-4 h-4 text-gray-600/80" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Left Panel - File Explorer */}
        <div className={`${showLeftPanel ? 'w-72' : 'w-0'} transition-all duration-200`}>
          <div className={`h-full overflow-hidden ${!showLeftPanel && 'invisible'}`}>
            <FileExplorerV2
              userId={"1"}
              selectedDocument={selectedFile}
              onDocumentSelect={handleFileSelect}
              onPdfParsed={handlePdfParsed}
            />
          </div>
        </div>

        {/* Middle Panel - Document Editor */}
        <div className="flex-1 bg-white">
          <DocumentPane
            content={documentContent}
            onContentChange={setDocumentContent}
            fileName={selectedFile?.name || "New Document"}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            onAnalyzeRisks={handleAnalyzeRisks}
          />
        </div>

        {/* Right Panel */}
        <div className={`${showRightPanel ? 'w-80' : 'w-0'} transition-all duration-200`}>
          <div className={`h-full overflow-hidden ${!showRightPanel && 'invisible'}`}>
            <RightPanel
              risks={risks}
              onRiskClick={handleRiskClick}
              onSelectTemplate={handleTemplateSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
