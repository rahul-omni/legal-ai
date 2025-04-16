"use client";

import { useState } from "react";
import { FileText, AlertOctagon } from "lucide-react";
import { RiskHighlighter } from "./RiskHighlighter";
import { LegalTemplates } from "./LegalTemplates";
import { RiskFinding } from "@/lib/riskAnalyzer";

interface RightPanelProps {
  risks: RiskFinding[];
  onRiskClick: (risk: RiskFinding) => void;
  onSelectTemplate: (content: string) => void;
}

export function RightPanel({
  risks,
  onRiskClick,
  onSelectTemplate,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<"templates" | "risks">(
    "templates"
  );

  return (
    <div className="w-80 border-l flex flex-col">
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === "templates"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          Templates
        </button>
        <button
          onClick={() => {
            setActiveTab("risks");
          }}
          className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === "risks"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          Risks {risks.length > 0 && `(${risks.length})`}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "templates" ? (
          <LegalTemplates onSelectTemplate={onSelectTemplate} />
        ) : (
          <RiskHighlighter risks={risks} onRiskClick={onRiskClick} />
        )}
      </div>
    </div>
  );
}
