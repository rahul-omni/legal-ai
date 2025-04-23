"use client";
import { loadingContext } from "@/context/loadingContext";
import { handleApiError } from "@/helper/handleApiError";
import { RiskAnalyzer, RiskFinding } from "@/lib/riskAnalyzer";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { useEffect, useState } from "react";
import { DocumentPane } from "./DocumentPane";
import { FileExplorerV2 } from "./FileExplorerV2";
import { PanelLeft, PanelRightOpen, X, Plus } from "lucide-react";
import { useTabs } from "@/context/tabsContext";
import { SmartPrompts } from "./SmartPrompts";
import { SmartPromptsPanel } from './SmartPromptsPanel';

// Add this interface near the top
interface TabInfo {
  id: string;
  fileId: string | null; // null for new untitled files
  name: string;
  content: string;
  isUnsaved: boolean;
}

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
  const { startLoading, stopLoading } = loadingContext();

  // Add state for panel visibility
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showSmartPrompts, setShowSmartPrompts] = useState(true);

  // Add these states
  const {
    openTabs,
    activeTabId,
    openFileInTab,
    closeTab,
    updateTabContent,
    setActiveTabId,
  } = useTabs();

  const loadDocuments = async () => {};

  useEffect(() => {
    loadDocuments(); // Only load documents, don't show popup
  }, []);

  const handleFileSelect = (file: FileSystemNodeProps) => {
    openFileInTab(file);
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
    }
  };

  const handleTranslate = async () => {
    try {
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
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
  };

  const handleSaveAs = async () => {
    const newName = prompt("Enter new file name:", selectedFile?.name || "");
    if (!newName) return;
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
    setDocumentContent(text);
  };

  // Add this before the return statement
  const activeTab = openTabs.find(tab => tab.id === activeTabId);
    console.log("activetab" ,activeTab)
    
  return (
    <div className="h-screen flex flex-col bg-[#f9f9f9]">
      {/* Toolbar */}
      <div className="absolute top-0 right-0 z-50 flex gap-1 p-2">
        <div className="flex gap-1 bg-[#f9f9f9] shadow-sm rounded p-1">
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className={`p-1.5 rounded ${
              showLeftPanel ? "bg-white shadow-sm" : "bg-transparent"
            } 
                       hover:bg-white hover:shadow-sm transition-all`}
          >
            <PanelLeft className="w-4 h-4 text-gray-600/80" />
          </button>
          <button
            onClick={() => setShowSmartPrompts(!showSmartPrompts)}
            className={`p-1.5 rounded ${
              showSmartPrompts ? "bg-white shadow-sm" : "bg-transparent"
            } 
                       hover:bg-white hover:shadow-sm transition-all`}
          >
            <PanelRightOpen className="w-4 h-4 text-gray-600/80" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Left Panel - File Explorer */}
        <div
          className={`${
            showLeftPanel ? "w-56" : "w-0"
          } transition-all duration-200`}
        >
          <div
            className={`h-full overflow-hidden ${
              !showLeftPanel && "invisible"
            }`}
          >
            <FileExplorerV2
              selectedDocument={selectedFile}
              onDocumentSelect={handleFileSelect}
              onPdfParsed={handlePdfParsed}
            //  files ={files}
            />
          </div>
        </div>

        {/* Middle Panel - Document Editor */}
        <div className="flex-1 bg-white flex flex-col">
          {/* Tab Bar */}
          <div className="flex items-center h-9 border-b border-gray-200 bg-gray-50/80">
            <div className="flex-1 flex items-center">
              {openTabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`group flex items-center h-full px-3 border-r border-gray-200 cursor-pointer
                            ${
                              activeTabId === tab.id
                                ? "bg-white text-gray-700 border-b-0"
                                : "text-gray-500 hover:bg-gray-100"
                            }`}
                >
                  <span className="text-xs font-medium truncate max-w-[100px]">
                    {tab.name} {tab.isUnsaved && "•"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="ml-1.5 p-0.5 rounded-sm hover:bg-gray-200/80 opacity-0 group-hover:opacity-100
                             transition-opacity"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>

            {/* New Tab Button */}
            <button
              onClick={() => {
                // addNewTab();
              }}
              className="h-full px-2 text-gray-500 hover:bg-gray-100 transition-colors border-l border-gray-200"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Editor Wrapper */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeTabId ? (
              <DocumentPane
                content={activeTab?.content || ""}
                onContentChange={(newContent) => {
                  if (activeTabId) {
                    updateTabContent(activeTabId, newContent);
                  }
                }}
                fileName={activeTab?.name || "Untitled"}
                onSave={handleSave}
                onSaveAs={handleSaveAs}
                fileId={activeTab?.fileId || "" }
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    No Document Open
                  </h3>
                  <p className="text-sm text-gray-500">
                    Open a file from the file explorer to start working
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Smart Prompts Panel */}
        <div
          className={`${
            showSmartPrompts ? "w-80" : "w-0"
          } transition-all duration-200`}
        >
          <div
            className={`h-full overflow-hidden ${
              !showSmartPrompts && "invisible"
            }`}
          >
            <SmartPromptsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
