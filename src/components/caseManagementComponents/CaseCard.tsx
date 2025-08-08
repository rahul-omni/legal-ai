import { Calendar, ChevronDown, Loader2 } from "lucide-react";
import { CaseData } from "./types";
import { CaseDetails } from "./CaseDetails";

interface CaseCardProps {
  caseItem: CaseData;
  index: number;
  isExpanded: boolean;
  caseDetails?: CaseData[];
  isLoadingDetails: boolean;
  onExpandToggle: (caseItem: CaseData) => void;
  handlePdfClick: (caseData: CaseData, event: React.MouseEvent) => void;
}

export function CaseCard({
  caseItem,
  index,
  isExpanded,
  caseDetails,
  isLoadingDetails,
  onExpandToggle,
  handlePdfClick
}: CaseCardProps) {
  if (!caseItem.id) {
    console.error('Rendering case with no ID:', caseItem);
    return null;
  }

  return (
    <div className="bg-background-light border border-border rounded-lg hover:shadow-md transition-all duration-200 text-sm">
      {/* Case header - clickable */}
      <div
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-background-dark transition-colors"
        onClick={() => onExpandToggle(caseItem)}
      >
        <div className="flex items-center gap-6 flex-1">
          {/* Court Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-info-light rounded-lg flex items-center justify-center">
              <span className="text-info font-semibold text-sm">
                {index + 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text">
                {caseItem.court}
              </span>
              <span className="text-muted">•</span>
              <span className="text-text-light font-medium">
                Diary: {caseItem.diaryNumber}
              </span>
            </div>
          </div>

          {/* Court Information */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {caseItem.caseType && (
                <span className="px-2 py-1 bg-info-light text-info text-xs font-medium rounded">
                  {caseItem.caseType}
                </span>
              )}
            </div>
          </div>

          {/* Judgment Information */}
          <div className="flex items-center gap-4">
            {caseItem.judgmentDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 text-sm">
                  {caseItem.judgmentDate}
                </span>
              </div>
            )}
            {caseItem.judgmentBy && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">By:</span>
                <span className="text-gray-700 text-sm font-medium">
                  {caseItem.judgmentBy}
                </span>
              </div>
            )}
          </div>

          {/* Parties Information */}
          <div className="flex-1 min-w-0">
            {caseItem.parties && (
              <div className="truncate">
                <span className="text-gray-500 text-sm">Parties:</span>
                <span className="text-gray-700 text-sm font-medium ml-1">
                  {caseItem.parties}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Expand/Collapse Indicator */}
        <div className="flex items-center gap-3 ml-4">
          {isLoadingDetails ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : (
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-200">
          <CaseDetails
            caseItem={caseItem}
            caseDetails={caseDetails || []}
            isLoading={isLoadingDetails}
            handlePdfClick={handlePdfClick}
          />
        </div>
      )}
    </div>
  );
} 