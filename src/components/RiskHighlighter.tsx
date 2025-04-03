'use client'

import { useState, useEffect } from 'react'
import { RiskFinding } from '@/lib/riskAnalyzer'
import { AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react'

interface RiskHighlighterProps {
  risks: RiskFinding[];
  onRiskClick: (risk: RiskFinding) => void;
}

export function RiskHighlighter({ risks, onRiskClick }: RiskHighlighterProps) {
  const severityIcons = {
    high: <AlertOctagon className="w-4 h-4 text-red-500" />,
    medium: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    low: <AlertCircle className="w-4 h-4 text-blue-500" />
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <h3 className="text-sm font-medium">Risk Analysis</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <AlertOctagon className="w-3 h-3 text-red-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-yellow-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-blue-500" /> Low
          </span>
        </div>
      </div>
      
      <div className="space-y-2 p-4">
        {risks.map((risk, index) => (
          <button
            key={index}
            onClick={() => onRiskClick(risk)}
            className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-2">
              {severityIcons[risk.severity]}
              <div>
                <div className="font-medium text-sm">{risk.category}</div>
                <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Clause: "{risk.clause.substring(0, 100)}..."
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 