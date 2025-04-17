"use client";

import { useState } from "react";
import { FileText, AlertOctagon } from "lucide-react";
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
}

export function RightPanel({
  risks,
  onRiskClick,
  onSelectTemplate,
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
    <div className="h-full flex flex-col bg-[#f9f9f9]">
      <div className="p-4 bg-[#f9f9f9]">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500/80 mb-3">Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors
                      ${activeTab === 'templates' 
                        ? 'bg-blue-50 text-blue-600/95' 
                        : 'text-gray-600/95 hover:bg-gray-200/70'}
                      flex items-center justify-center`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('risks')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors
                      ${activeTab === 'risks' 
                        ? 'bg-amber-50 text-amber-600/95' 
                        : 'text-gray-600/95 hover:bg-gray-200/70'}
                      flex items-center justify-center`}
          >
            <AlertOctagon className="w-4 h-4 mr-2" />
            Risk Analysis {risks.length > 0 && `(${risks.length})`}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#f9f9f9]">
        {activeTab === 'templates' ? (
          <LegalTemplates onSelectTemplate={onSelectTemplate} />
        ) : (
          <div className="space-y-3">
            {risks.length === 0 ? (
              <div className="text-center text-gray-500/95 py-8">
                No risks detected. Click "Analyze Risks" to begin analysis.
              </div>
            ) : (
              risks.map((risk, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-amber-200 bg-amber-50
                           cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={() => onRiskClick(risk)}
                >
                  <h3 className="font-medium text-amber-800/95">
                    {risk.description ? 'Risk Warning' : 'No Description'}
                  </h3>
                  <p className="text-sm text-amber-700/95 mt-1">
                    {risk.description}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
