"use client";

import { useState } from "react";
import { FileText, AlertOctagon, ListChecks } from "lucide-react";
import { RiskHighlighter } from "./RiskHighlighter";
import { LegalTemplates } from "./LegalTemplates";
import { RiskFinding } from "@/lib/riskAnalyzer";

// Add interface for template
interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

interface RightPanelProps {
  risks: RiskFinding[];
  onRiskClick: (risk: RiskFinding) => void;
  onSelectTemplate: (content: string) => void;
  onAnalyzeRisks: () => Promise<void>;
}

export function RightPanel({
  risks,
  onRiskClick,
  onSelectTemplate,
  onAnalyzeRisks,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<"templates" | "risks">("templates");

  // Add sample templates or fetch from your data source
  const templates: Template[] = [
    {
      id: "1",
      name: "Non-Disclosure Agreement",
      description: "Standard NDA template for business purposes",
      content: "This Non-Disclosure Agreement..."
    },
    {
      id: "2",
      name: "Employment Contract",
      description: "Basic employment agreement template",
      content: "This Employment Agreement..."
    },
    // Add more templates as needed
  ];

  return (
    <div className="h-full flex flex-col bg-white border-l">
      <div className="flex border-b mt-10">
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === "templates"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <FileText className="w-4 h-4" /> Templates
        </button>
        <button
          onClick={() => setActiveTab("risks")}
          className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === "risks"
              ? "border-b-2 border-amber-500 text-amber-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <ListChecks className="w-4 h-4" /> Risks ({risks.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "templates" && (
          <LegalTemplates onSelectTemplate={onSelectTemplate} />
        )}

        {activeTab === "risks" && (
          <div>
            <button
              onClick={onAnalyzeRisks}
              className="w-full mb-4 px-3 py-2 text-sm bg-amber-50 text-amber-600 rounded-lg
                       hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
            >
              <AlertOctagon className="w-4 h-4" />
              Analyze Document Risks
            </button>

            {risks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-4">
                No risks identified yet. Click the button above to analyze the document.
              </p>
            ) : (
              <ul className="space-y-3">
                {risks.map((risk, index) => (
                  <li
                    key={index}
                    onClick={() => onRiskClick(risk)}
                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-800">{risk.clause}</p>
                    <p className="text-xs text-gray-600 mt-1">{risk.finding}</p>
                    <p className="text-xs text-red-600 font-semibold mt-1">Severity: {risk.severity}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
