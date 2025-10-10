import { CaseData } from "./types";
import { CaseCard } from "./CaseCard";

interface CaseListProps {
  cases: CaseData[];
}

export function CaseList({
  cases
}: CaseListProps) {
  return (
    <div className="grid grid-cols-1 gap-2 px-6 mb-6">
      {cases.map((caseItem, index) => (
        <CaseCard
          key={caseItem.id}
          caseItem={caseItem}
          index={index}
        />
      ))}
    </div>
  );
} 