"use client";
import { loadingContext } from "@/context/loadingContext";
import { handleApiError } from "@/helper/handleApiError";
import { RiskAnalyzer, RiskFinding } from "@/lib/riskAnalyzer";
import { FileSystemNodeProps } from "@/types/fileSystem";
import { useEffect, useRef, useState } from "react";
import { DocumentPane } from "./DocumentPane";
import { FileExplorerV2 } from "./FileExplorerV2";
import { PanelLeft, PanelRightOpen, X, Plus } from "lucide-react";
import { useTabs } from "@/context/tabsContext";
import { SmartPrompts } from "./SmartPrompts";
import { SmartPromptsPanel } from "./SmartPromptsPanel";
import {
  createNewFile,
  fetchAllNodes,
  fetchNodes,
  updateNodeContent,
} from "@/app/apiServices/nodeServices";
import { FileType } from "@prisma/client";

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
  const [showSmartPrompts, setShowSmartPrompts] = useState(false);
  // In LegalEditor component
  const [selectedNode, setSelectedNode] = useState<FileSystemNodeProps | null>(
    null
  );
  const [fileTree, setFileTree] = useState<FileSystemNodeProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfBlobOrUrl, setPdfBlobOrUrl] = useState<File | string | null>(null);
  const [tabs, setTabs] = useState<
    Array<{
      id: string;
      name: string;
      content: string;
      fileId?: string;
      parentId?: string;
    }>
  >([]);
   // Add these states
  const {
    openTabs,
    activeTabId,
    openFileInTab,
    closeTab,
    updateTabContent,
    setActiveTabId,
    createNewTab,
    updateTabName
  } = useTabs();

  const loadDocuments = async () => {};

  const [refreshKey, setRefreshKey] = useState(0); // Add this state

  // const fetchUpdatedFileTree = async (parentId?: string) => {
  //   try {
  //     const tree = parentId
  //       ? await fetchNodes(parentId)
  //       : await fetchAllNodes();

  //     setFileTree(tree);
  //     setRefreshKey((n) => n + 1);

  //     return tree;
  //   } catch (error) {
  //     handleApiError(error, showToast);
  //     return [];
  //   }
  // };

  const isCalledRef = useRef(false);

const fetchUpdatedFileTree = async (parentId?: string) => {
  if (isCalledRef.current) return;
  isCalledRef.current = true;
  
  try {
    const tree = parentId
      ? await fetchNodes(parentId)
      : await fetchAllNodes();

    //setFileTree(tree);
     // Ensure we always set an array, even if response is undefined
     setFileTree(Array.isArray(tree) ? tree : []);
    setRefreshKey((n) => n + 1);
    return tree;
  } catch (error) {
    handleApiError(error, showToast);
    return [];
  } finally {
    isCalledRef.current = false;
  }
};
  const [folderPickerState, setFolderPickerState] = useState<{
    show: boolean;
    fileData: {
      name: string;
      content: string;
      parentId: string | null;
      fileId: string // Optional, include only if used elsewhere
      callback?: (newFile: FileSystemNodeProps) => void;
    } | null;
  }>({ show: false, fileData: null });
  
 // In your parent component (or state management)
const [isNewFileMode, setIsNewFileMode] = useState(false)
// Modified handleNewFile function
const handleNewFile = () => {
  setIsNewFileMode(true); // Set the mode to new file
  createNewTab()
};



 
  useEffect(() => {
    loadDocuments(); // Only load documents, don't show popup
  }, []);

  const handleFileSelect = (file: FileSystemNodeProps) => {
    setIsNewFileMode(false); // Reset after saving
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

  console.log("openTabs", openTabs);
  
  // Add this before the return statement
  const activeTab = openTabs.find((tab) => tab.id === activeTabId);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const foldersOnly = fileTree.filter(
    (node) => node.type === "FOLDER" || node.id === "root"
  );
   
  const handleInitiateSave = (
    name: string,
    content: string,
    parentId: string | null,
    fileId: string ,
    callback?: (newFile: FileSystemNodeProps) => void
  ) => {
    console.log("Initiating save with name:", name, "and content length:", content.length);
    setFolderPickerState({
      show: true,
      fileData: {
        name,
        content,
        parentId, // 👈 Include it here
        fileId,   // Optional, include only if used elsewhere
        callback: (newFile: FileSystemNodeProps) => {
          updateTabName(activeTabId, newFile.name, newFile.id);
          setRefreshKey((n) => n + 1);
          console.log("✔️ Name updated in context:", newFile.name);
          if (callback) callback(newFile); // Call back to DocumentPane
        },
      },
    });
  };
  console.log("Selected folder ID:", selectedFolderId);
  

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

        {/* Folder Picker Modal */}
  
{folderPickerState.show && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-1/2 max-h-[80vh] flex flex-col">
      <h3 className="text-lg font-medium mb-4">Select Save Location</h3>
      <div className="flex-1 overflow-auto">
        <FileExplorerV2 
          key={`folder-picker-${refreshKey}`} // 🔑 Key change = full reload
          fileTree={foldersOnly}
          onDocumentSelect={(node) => {
            if (node.type === 'FOLDER') {
              console.log("Selected folder:", node , node.id);
              
              setSelectedFolderId(node.id);
            } else if (node.type === 'FILE' && node.parentId) {
              // File selected — use its parent folder as save location
              setSelectedFolderId(node.parentId);
            } else if (node.id === 'root') {
              setSelectedFolderId(null); // save in root
            }
          }}
          selectedDocument={selectedFile}
          onPdfParsed={() => {}}
          isFolderPickerOpen={true} // ✅ tell the explorer it’s in picker mode
        />
      </div>
      <div className="flex justify-between mt-4">

      <button
  onClick={() => {
    if (folderPickerState.fileData?.callback) {
      const newNodePayload = {
        name: folderPickerState.fileData.name,
        content: folderPickerState.fileData.content,
        fileId: folderPickerState.fileData.fileId,
        parentId: selectedFolderId ?? null,
        type: "FILE",
      };
      createNewFile({ ...newNodePayload, type: "FILE" as FileType }).then((newFile) => {
        if (folderPickerState.fileData && folderPickerState.fileData.callback) {
          folderPickerState.fileData.callback(newFile);
        }
        setFolderPickerState({ show: false, fileData: null });
      });
    }
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  Save Here
</button>
 
        <button 
          onClick={() => setFolderPickerState({ show: false, fileData: null })}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}



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
              // key={fileTree.length}
              key={`file-explorer-${refreshKey}`} // 🔑 Key change = full reload
              fileTree={fileTree}
              selectedDocument={selectedFile}
              onDocumentSelect={(file) => {
                handleFileSelect(file);
                setSelectedNode(file); // Update selected node
              }}
              onPdfParsed={handlePdfParsed}
              isFolderPickerOpen={ false} // ✅ tell the explorer it’s NOT in picker mode
              isNewFileMode={isNewFileMode} // <-- Pass the state her
              onPdfFileUpload={setPdfBlobOrUrl}
           />

            <button
              onClick={() =>
                setFolderPickerState({ show: false, fileData: null })
              }
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Middle Panel - Document Editor */}
        <div className="flex-1 bg-white flex flex-col">
          {/* Tab Bar */}

          <div className="flex items-center h-9 border-b border-gray-200 bg-gray-50/80">
            {/* New Tab Button */}
            <button
              
              onClick={handleNewFile}
              className="h-full px-2 text-gray-500 hover:bg-gray-100 transition-colors border-l border-gray-200"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
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
                  {/* <span className="text-xs font-medium truncate max-w-[100px]">
                    {tab.name} {tab.isUnsaved && "•"}  {!tab.fileId && <span className="text-gray-500"> (Unsaved)</span>}
                  </span> */}
                  <span className="text-xs font-medium truncate max-w-[100px]">
  {tab.name === "Untitled Document" && !tab.fileId ? "New" : tab.name}
  {tab.isUnsaved && "•"}
  {!tab.fileId && <span className="text-gray-500"> (Unsaved)</span>}
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
          </div>

          {/* Editor Wrapper */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeTabId ? (
              <DocumentPane
                key={activeTabId}
                onDocumentSelect={handleFileSelect}
                content={activeTab?.content || ""}
                onContentChange={(newContent) => {
                  if (activeTabId) {
                    updateTabContent(activeTabId, newContent);
                  }
                }}
                fileName={activeTab?.name || ""}
                fileId={activeTab?.fileId || ""}
                node={[]}
                onInitiateSave={handleInitiateSave}
                //  onFileTreeUpdate={async () => {
                //   await reloadFileExplorer();
                //   return []; // Return empty array to satisfy type
                // }}
                onFileTreeUpdate={fetchUpdatedFileTree}
                isFolderPickerOpen={folderPickerState.show}
                isNewFileMode={isNewFileMode} // <-- Pass the state her
                pdfBlobOrUrl={pdfBlobOrUrl}
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
