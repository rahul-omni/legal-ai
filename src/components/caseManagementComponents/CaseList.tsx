import { CaseData } from "./types";
import { CaseCard } from "./CaseCard";

interface CaseListProps {
  cases: CaseData[];
  expandedCases: Record<string, boolean>;
  caseDetails: Record<string, CaseData[]>;
  loadingDetails: Record<string, boolean>;
  onCaseExpand: (caseItem: CaseData) => void;
  handlePdfClick: (caseData: CaseData, event: React.MouseEvent) => void;
}

export function CaseList({
  cases,
  expandedCases,
  caseDetails,
  loadingDetails,
  onCaseExpand,
  handlePdfClick
}: CaseListProps) {
  return (
    <div className="grid grid-cols-1 gap-2 px-6">
      {cases.map((caseItem, index) => (
        <CaseCard
          key={caseItem.id}
          caseItem={caseItem}
          index={index}
          isExpanded={expandedCases[caseItem.id] || false}
          caseDetails={caseDetails[caseItem.id]}
          isLoadingDetails={loadingDetails[caseItem.id] || false}
          onExpandToggle={onCaseExpand}
          handlePdfClick={handlePdfClick}
        />
      ))}
    </div>
  );
} 